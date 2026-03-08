from decimal import Decimal
from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers

from courses.models import Course
from payments.models import PaymentTransaction


def _normalize_origin(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return ""
    return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"


def get_allowed_checkout_origins() -> set[str]:
    origins = {settings.FRONTEND_BASE_URL, *getattr(settings, "CORS_ALLOWED_ORIGINS", [])}
    return {origin for origin in (_normalize_origin(value) for value in origins) if origin}


def validate_checkout_redirect_url(url: str) -> str:
    normalized_origin = _normalize_origin(url)
    if not normalized_origin:
        raise serializers.ValidationError("Redirect URL must include a valid origin.")
    if normalized_origin not in get_allowed_checkout_origins():
        raise serializers.ValidationError("Redirect URL origin is not allowed.")
    return url


class BillingPreviewSerializer(serializers.Serializer):
    course_id = serializers.IntegerField(read_only=True)
    course_title = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_rate_percent = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    currency = serializers.CharField(read_only=True)


class CreateRazorpayOrderSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()

    def validate_course_id(self, value):
        if not Course.objects.filter(id=value, is_deleted=False, is_active=True).exists():
            raise serializers.ValidationError("Course not found.")
        return value

class ConfirmPaymentSerializer(serializers.Serializer):
    transaction_id = serializers.IntegerField(required=False)
    session_id = serializers.CharField(required=False, allow_blank=False)
    razorpay_order_id = serializers.CharField(required=False, allow_blank=False)
    razorpay_payment_id = serializers.CharField(required=False, allow_blank=False)
    razorpay_signature = serializers.CharField(required=False, allow_blank=False)


class PaymentTransactionSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = (
            "id",
            "user",
            "user_email",
            "course",
            "course_title",
            "amount",
            "tax",
            "total",
            "currency",
            "payment_status",
            "razorpay_order_id",
            "razorpay_payment_id",
            "failure_reason",
            "created_at",
        )
        read_only_fields = fields


class AdminPaymentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = ("payment_status", "failure_reason", "amount", "tax", "total", "currency")
        extra_kwargs = {
            "payment_status": {"required": False},
            "failure_reason": {"required": False, "allow_blank": True},
            "amount": {"required": False},
            "tax": {"required": False},
            "total": {"required": False},
            "currency": {"required": False},
        }


def calculate_totals(
    course_price: Decimal,
    tax_rate: Decimal,
    discount_percent: Decimal = Decimal("0.00"),
    final_price: Decimal | None = None,
) -> tuple[Decimal, Decimal, Decimal, Decimal, Decimal]:
    amount = Decimal(str(course_price or 0)).quantize(Decimal("0.01"))
    normalized_final = None if final_price is None else Decimal(str(final_price)).quantize(Decimal("0.01"))

    if normalized_final is not None:
        normalized_final = max(Decimal("0.00"), min(amount, normalized_final))
        discount_amount = (amount - normalized_final).quantize(Decimal("0.01"))
        total = normalized_final
    else:
        normalized_discount = Decimal(str(discount_percent or 0))
        normalized_discount = max(Decimal("0.00"), min(Decimal("100.00"), normalized_discount))
        discount_amount = (amount * normalized_discount / Decimal("100")).quantize(Decimal("0.01"))
        total = (amount - discount_amount).quantize(Decimal("0.01"))

    # GST is included in the final payable total. Extract tax from inclusive amount.
    if tax_rate > Decimal("0.00") and total > Decimal("0.00"):
        subtotal = (total / (Decimal("1.00") + tax_rate)).quantize(Decimal("0.01"))
        tax = (total - subtotal).quantize(Decimal("0.01"))
    else:
        subtotal = total
        tax = Decimal("0.00")
    return amount, discount_amount, subtotal, tax, total
