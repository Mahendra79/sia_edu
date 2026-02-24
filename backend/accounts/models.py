from __future__ import annotations

import uuid
from datetime import timedelta
import secrets

from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.utils import timezone


class CustomUserManager(UserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        return super().create_user(username=username, email=email, password=password, **extra_fields)


class User(AbstractUser):
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, unique=True)
    avatar = models.ImageField(upload_to="users/avatars/", blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    REQUIRED_FIELDS = ["email", "name", "phone"]

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["is_deleted"]),
        ]

    @property
    def is_admin(self) -> bool:
        return self.is_staff or self.is_superuser

    def soft_delete(self):
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "is_active", "deleted_at", "updated_at"])


class BaseUserToken(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    otp_code = models.CharField(max_length=6, db_index=True, default="000000")
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

    def is_valid(self) -> bool:
        return (not self.is_used) and timezone.now() < self.expires_at

    @staticmethod
    def generate_otp_code() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"


class EmailVerificationToken(BaseUserToken):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_tokens")

    @staticmethod
    def issue_for_user(user: User, hours_valid: int = 24) -> "EmailVerificationToken":
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)
        return EmailVerificationToken.objects.create(
            user=user,
            otp_code=BaseUserToken.generate_otp_code(),
            expires_at=timezone.now() + timedelta(hours=hours_valid),
        )


class PasswordResetToken(BaseUserToken):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")

    @staticmethod
    def issue_for_user(user: User, hours_valid: int = 1) -> "PasswordResetToken":
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        return PasswordResetToken.objects.create(
            user=user,
            otp_code=BaseUserToken.generate_otp_code(),
            expires_at=timezone.now() + timedelta(hours=hours_valid),
        )

