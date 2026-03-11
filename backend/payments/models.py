from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupons",
        help_text="Leave empty for a global coupon.",
    )
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    per_user_limit = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["is_active", "valid_from", "valid_until"]),
        ]

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        scope = self.course.title if self.course_id else "Global"
        return f"{self.code} ({scope})"


class CouponRedemption(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.PROTECT, related_name="redemptions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coupon_redemptions")
    course = models.ForeignKey("courses.Course", on_delete=models.PROTECT, related_name="coupon_redemptions")
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-redeemed_at"]
        indexes = [
            models.Index(fields=["coupon", "user"]),
            models.Index(fields=["user", "course"]),
        ]

    def __str__(self) -> str:
        return f"{self.coupon.code} -> {self.user_id} ({self.course_id})"


class PaymentTransaction(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payment_transactions")
    course = models.ForeignKey("courses.Course", on_delete=models.PROTECT, related_name="payment_transactions")
    enrollment = models.ForeignKey(
        "courses.Enrollment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_transactions",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="inr")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending", db_index=True)
    razorpay_order_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    razorpay_payment_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=255, null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["payment_status"]),
            models.Index(fields=["razorpay_order_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} - {self.course.title} ({self.payment_status})"

