import os
import re

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import EmailVerificationToken, PasswordResetToken, User


USERNAME_REGEX = re.compile(r"^[\w.@+-]+\Z")
NAME_REGEX = re.compile(r"^[A-Za-z ]+\Z")


class UserValidationMixin:
    username_invalid_message = "Username can only contain letters, numbers, and @/./+/-/_ characters."
    username_exists_message = "Username is unavailable. Please choose a different one."
    email_exists_message = "This email is already registered."
    phone_exists_message = "Phone number is already registered."

    def _instance_id(self):
        return getattr(self.instance, "id", None)

    def validate_name(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Name is required.")
        if not NAME_REGEX.fullmatch(value):
            raise serializers.ValidationError("Full name can contain letters and spaces only.")
        return value

    def validate_username(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        if not USERNAME_REGEX.fullmatch(value):
            raise serializers.ValidationError(self.username_invalid_message)
        if User.objects.filter(username__iexact=value).exclude(id=self._instance_id()).exists():
            raise serializers.ValidationError(self.username_exists_message)
        return value

    def validate_email(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=value).exclude(id=self._instance_id()).exists():
            raise serializers.ValidationError(self.email_exists_message)
        return value

    def validate_phone(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        if User.objects.filter(phone=value).exclude(id=self._instance_id()).exists():
            raise serializers.ValidationError(self.phone_exists_message)
        return value


class UserSerializer(UserValidationMixin, serializers.ModelSerializer):
    is_admin = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "name",
            "username",
            "email",
            "phone",
            "avatar",
            "is_admin",
            "is_active",
            "is_email_verified",
            "created_at",
        )
        read_only_fields = ("id", "is_admin", "is_active", "is_email_verified", "created_at")
        extra_kwargs = {
            "username": {"validators": []},
            "email": {"validators": []},
            "phone": {"validators": []},
        }

    def validate_avatar(self, value):
        if not value:
            return value

        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        extension = os.path.splitext(value.name)[1].lower()
        if extension not in allowed_extensions:
            raise serializers.ValidationError("Invalid avatar type. Use JPG, PNG or WEBP.")

        max_size = 3 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Avatar image must be 3MB or smaller.")
        return value


class AdminUserUpdateSerializer(UserValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("name", "username", "email", "phone", "is_active", "is_email_verified")
        extra_kwargs = {
            "name": {"required": False},
            "username": {"required": False, "validators": []},
            "email": {"required": False, "validators": []},
            "phone": {"required": False, "validators": []},
            "is_active": {"required": False},
            "is_email_verified": {"required": False},
        }


class SignupSerializer(UserValidationMixin, serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("name", "username", "email", "phone", "password", "confirm_password")
        extra_kwargs = {
            "username": {"validators": []},
            "email": {"validators": []},
            "phone": {"validators": []},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match. Please confirm your password."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["username"] = user.username
        token["is_admin"] = user.is_admin
        return token

    def validate(self, attrs):
        username = attrs.get(self.username_field)
        password = attrs.get("password")
        if not username or not password:
            raise serializers.ValidationError("Username or email and password are required.")

        # Allow login by username or email.
        user = User.objects.filter(username__iexact=username).first()
        if not user:
            user = User.objects.filter(email__iexact=username).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError("Invalid username/email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Account is inactive.")

        if user.is_deleted:
            raise serializers.ValidationError("Account is deleted.")

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs.get("email")
        otp_code = attrs.get("otp_code")
        if email and otp_code:
            return attrs
        raise serializers.ValidationError("Provide email and otp_code.")


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(required=True, min_length=6, max_length=6)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match. Please confirm your new password."}
            )
        email = attrs.get("email")
        otp_code = attrs.get("otp_code")
        if not (email and otp_code):
            raise serializers.ValidationError("Provide email and otp_code.")
        validate_password(attrs["password"])
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class EmailVerificationTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailVerificationToken
        fields = ("otp_code", "expires_at", "is_used")


class PasswordResetTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordResetToken
        fields = ("otp_code", "expires_at", "is_used")
