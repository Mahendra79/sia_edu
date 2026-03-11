from django.urls import path

from payments.views import (
    AdminPaymentDetailView,
    AdminPaymentsView,
    AdminCouponDetailView,
    AdminCouponsView,
    BillingPreviewView,
    CouponValidateView,
    ConfirmPaymentView,
    CreateRazorpayOrderView,
    InvoiceDownloadView,
    MyPaymentHistoryView,
    RazorpayWebhookView,
)

urlpatterns = [
    path("billing/<int:course_id>/", BillingPreviewView.as_view(), name="billing-preview"),
    path("coupon/validate/", CouponValidateView.as_view(), name="coupon-validate"),
    path("create-order/", CreateRazorpayOrderView.as_view(), name="create-razorpay-order"),
    path("create-checkout-session/", CreateRazorpayOrderView.as_view(), name="create-checkout-session"),
    path("confirm/", ConfirmPaymentView.as_view(), name="confirm-payment"),
    path("invoice/<int:payment_id>/", InvoiceDownloadView.as_view(), name="payment-invoice"),
    path("history/me/", MyPaymentHistoryView.as_view(), name="my-payment-history"),
    path("admin/history/", AdminPaymentsView.as_view(), name="admin-payment-history"),
    path("admin/history/<int:payment_id>/", AdminPaymentDetailView.as_view(), name="admin-payment-detail"),
    path("admin/coupons/", AdminCouponsView.as_view(), name="admin-coupons"),
    path("admin/coupons/<int:coupon_id>/", AdminCouponDetailView.as_view(), name="admin-coupon-detail"),
    path("webhook/", RazorpayWebhookView.as_view(), name="razorpay-webhook"),
]
