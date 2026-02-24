from django.urls import path

from payments.views import (
    AdminPaymentDetailView,
    AdminPaymentsView,
    BillingPreviewView,
    ConfirmPaymentView,
    CreateCheckoutSessionView,
    MyPaymentHistoryView,
    StripeWebhookView,
)

urlpatterns = [
    path("billing/<int:course_id>/", BillingPreviewView.as_view(), name="billing-preview"),
    path("create-checkout-session/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("confirm/", ConfirmPaymentView.as_view(), name="confirm-payment"),
    path("history/me/", MyPaymentHistoryView.as_view(), name="my-payment-history"),
    path("admin/history/", AdminPaymentsView.as_view(), name="admin-payment-history"),
    path("admin/history/<int:payment_id>/", AdminPaymentDetailView.as_view(), name="admin-payment-detail"),
    path("webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
