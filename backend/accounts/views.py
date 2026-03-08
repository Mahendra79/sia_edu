import logging

from django.conf import settings
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.models import EmailVerificationToken, PasswordResetToken, User
from accounts.email_service import (
    send_password_reset_verification_code_email,
    send_registration_success_email,
    send_verification_code_email,
)
from accounts.permissions import IsActiveAuthenticated, IsAdminUserRole
from accounts.serializers import (
    AdminUserUpdateSerializer,
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ResendVerificationSerializer,
    SignupSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)
from analytics.models import AdminActivityLog
from deleted_records.services import record_soft_delete
from payments.models import PaymentTransaction
from payments.serializers import PaymentTransactionSerializer

logger = logging.getLogger(__name__)


def _log_admin_action(user, action: str, target_type: str, target_id: str, details: str = ""):
    if user and user.is_authenticated and user.is_admin:
        AdminActivityLog.objects.create(
            admin_user=user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )


def _send_email_verification_token(user: User) -> EmailVerificationToken:
    token = EmailVerificationToken.issue_for_user(user)
    try:
        send_verification_code_email(user=user, verification_code=token.otp_code)
    except Exception:
        logger.exception("Failed to send verification email for user_id=%s", user.id)
    return token


def _issue_auth_payload(user: User, message: str) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "message": message,
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def _attach_verification_meta(payload: dict, user: User, token: EmailVerificationToken | None = None) -> dict:
    payload["requires_email_verification"] = not user.is_email_verified
    payload["verification_email"] = user.email
    if token and settings.AUTH_DEBUG_TOKENS:
        payload["debug_verification"] = {"otp_code": token.otp_code}
    return payload


class SignupView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        username = request.data.get("username", "").strip()
        email = request.data.get("email", "").strip()
        phone = request.data.get("phone", "").strip()
        password = request.data.get("password", "")

        existing_user = User.objects.filter(
            Q(username__iexact=username) | Q(email__iexact=email) | Q(phone=phone)
        ).first()
        if existing_user:
            if existing_user.is_deleted or not existing_user.is_active:
                return Response({"detail": "Account is inactive."}, status=status.HTTP_400_BAD_REQUEST)
            if not password or not existing_user.check_password(password):
                return Response(
                    {"detail": "Account already exists. Use login with correct password."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = None
            if not existing_user.is_email_verified:
                token = _send_email_verification_token(existing_user)
            return Response(
                _attach_verification_meta(
                    _issue_auth_payload(existing_user, "Account already exists. Logged in successfully."),
                    existing_user,
                    token,
                ),
                status=status.HTTP_200_OK,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = _send_email_verification_token(user)

        return Response(
            _attach_verification_meta(
                _issue_auth_payload(user, "Signup successful. Logged in successfully."),
                user,
                token,
            ),
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username = request.data.get("username", "")
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            user_payload = response.data.get("user") if isinstance(response.data, dict) else {}
            user_id = user_payload.get("id") if isinstance(user_payload, dict) else None
            token = None
            if user_id:
                user = User.objects.filter(id=user_id, is_deleted=False).first()
                if user:
                    if not user.is_email_verified:
                        token = _send_email_verification_token(user)
                    response.data = _attach_verification_meta(response.data, user, token)
        if settings.DEBUG:
            logger.warning("Login attempt received for '%s' with status %s", username, response.status_code)
        return response


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsActiveAuthenticated]

    def get_object(self):
        return self.request.user


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        verification = (
            EmailVerificationToken.objects.select_related("user")
            .filter(
                user__email__iexact=serializer.validated_data["email"],
                otp_code=serializer.validated_data["otp_code"],
            )
            .first()
        )
        if not verification or not verification.is_valid():
            return Response({"detail": "Verification code is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

        user = verification.user
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified", "updated_at"])

        verification.is_used = True
        verification.save(update_fields=["is_used"])
        try:
            send_registration_success_email(user=user)
        except Exception:
            logger.exception("Failed to send registration success email for user_id=%s", user.id)
        return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.filter(email__iexact=serializer.validated_data["email"], is_deleted=False).first()
        if not user:
            return Response({"message": "If the account exists, a verification email was sent."})

        token = _send_email_verification_token(user)
        response_payload = {"message": "Verification email sent."}
        if settings.AUTH_DEBUG_TOKENS:
            response_payload["debug_verification"] = {"otp_code": token.otp_code}
        return Response(response_payload, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"], is_deleted=False).first()

        if user:
            reset_token = PasswordResetToken.issue_for_user(user)
            try:
                send_password_reset_verification_code_email(user=user, verification_code=reset_token.otp_code)
            except Exception:
                logger.exception("Failed to send password reset email for user_id=%s", user.id)
            response_payload = {"message": "If the account exists, a reset verification code has been sent."}
            if settings.AUTH_DEBUG_TOKENS:
                response_payload["debug_reset"] = {"otp_code": reset_token.otp_code}
            return Response(response_payload)
        return Response({"message": "If the account exists, a reset verification code has been sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reset_token = (
            PasswordResetToken.objects.select_related("user")
            .filter(
                user__email__iexact=serializer.validated_data["email"],
                otp_code=serializer.validated_data["otp_code"],
            )
            .first()
        )
        if not reset_token or not reset_token.is_valid():
            return Response({"detail": "Verification code is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

        user = reset_token.user
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password", "updated_at"])

        reset_token.is_used = True
        reset_token.save(update_fields=["is_used"])
        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)


class AdminUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        scope = self.request.query_params.get("scope", "all").strip().lower()
        payment_status = self.request.query_params.get("payment_status", "").strip().lower()
        queryset = User.objects.filter(is_deleted=False)

        if scope == "verified":
            queryset = queryset.filter(is_email_verified=True)
        elif scope == "unverified":
            queryset = queryset.filter(is_email_verified=False)
        elif scope == "active":
            queryset = queryset.filter(is_active=True)
        elif scope == "inactive":
            queryset = queryset.filter(is_active=False)
        elif scope == "payment_users":
            queryset = queryset.filter(payment_transactions__is_deleted=False)
        elif scope == "non_payment_users":
            queryset = queryset.exclude(payment_transactions__is_deleted=False)

        if payment_status in {"success", "failed", "pending"}:
            queryset = queryset.filter(
                payment_transactions__is_deleted=False,
                payment_transactions__payment_status=payment_status,
            )

        _log_admin_action(self.request.user, "view_users", "User", "list")
        return queryset.distinct().order_by("-created_at")


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUserRole]
    serializer_class = AdminUserUpdateSerializer
    queryset = User.objects.filter(is_deleted=False)
    lookup_url_kwarg = "user_id"

    def get(self, request, *args, **kwargs):
        user = self.get_object()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _log_admin_action(request.user, "update_user", "User", str(user.id), user.email)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class AdminUserSoftDeleteView(APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, user_id: int):
        user = User.objects.filter(id=user_id, is_deleted=False).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("reason", "admin_soft_delete")
        record_soft_delete(user, deleted_by=request.user, reason=reason)
        user.soft_delete()
        _log_admin_action(request.user, "delete_user", "User", str(user.id), user.email)
        return Response({"message": "User soft deleted."}, status=status.HTTP_200_OK)


class AdminUserPaymentHistoryView(generics.ListAPIView):
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        _log_admin_action(self.request.user, "view_user_payments", "User", str(self.kwargs["user_id"]))
        return (
            PaymentTransaction.objects.select_related("user", "course")
            .filter(user_id=self.kwargs["user_id"], is_deleted=False)
            .order_by("-created_at")
        )

