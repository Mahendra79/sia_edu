from django.urls import path

from accounts.views import (
    AdminUserDetailView,
    AdminUserPaymentHistoryView,
    AdminUserSoftDeleteView,
    AdminUsersView,
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProfileView,
    RefreshTokenView,
    ResendVerificationView,
    SignupView,
    VerifyEmailView,
)

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="resend-verification"),
    path("password-reset/request/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("admin/users/", AdminUsersView.as_view(), name="admin-users"),
    path("admin/users/<int:user_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("admin/users/<int:user_id>/soft-delete/", AdminUserSoftDeleteView.as_view(), name="admin-user-soft-delete"),
    path(
        "admin/users/<int:user_id>/payments/",
        AdminUserPaymentHistoryView.as_view(),
        name="admin-user-payments",
    ),
]
