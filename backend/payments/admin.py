from django.contrib import admin

from payments.models import Coupon, CouponRedemption, PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "course", "total", "payment_status", "currency", "created_at")
    list_filter = ("payment_status", "currency", "created_at")
    search_fields = ("user__email", "course__title", "razorpay_order_id", "razorpay_payment_id")


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "course", "discount_amount", "max_uses", "per_user_limit", "used_count", "is_active")
    list_filter = ("is_active", "course", "valid_from", "valid_until")
    search_fields = ("code", "course__title")


@admin.register(CouponRedemption)
class CouponRedemptionAdmin(admin.ModelAdmin):
    list_display = ("coupon", "user", "course", "redeemed_at")
    list_filter = ("coupon", "redeemed_at")
    search_fields = ("coupon__code", "user__email", "course__title")

