from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import EmailVerificationToken, PasswordResetToken, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("id", "username", "email", "name", "phone", "is_staff", "is_email_verified", "is_deleted")
    list_filter = ("is_staff", "is_superuser", "is_email_verified", "is_deleted")
    search_fields = ("username", "email", "name", "phone")
    ordering = ("-created_at",)
    fieldsets = UserAdmin.fieldsets + (
        ("SIA EDU", {"fields": ("name", "phone", "is_email_verified", "is_deleted", "deleted_at")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("SIA EDU", {"fields": ("name", "email", "phone")}),
    )


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "expires_at", "is_used", "created_at")
    list_filter = ("is_used", "expires_at")
    search_fields = ("user__email", "user__username")


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "expires_at", "is_used", "created_at")
    list_filter = ("is_used", "expires_at")
    search_fields = ("user__email", "user__username")

