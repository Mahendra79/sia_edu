from decimal import Decimal, InvalidOperation
import re
from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers

from courses.models import Course
from payments.models import Coupon, PaymentTransaction

COUPON_CODE_PATTERN = re.compile(r"^[A-Z0-9-]{2,50}$")


def normalize_coupon_code(value: str) -> str:
    if value is None:
        return ""
    return str(value).strip().upper()


def validate_coupon_code_format(value: str) -> str:
    normalized = normalize_coupon_code(value)
    if not normalized:
        raise serializers.ValidationError("Coupon code is required.")
    if not COUPON_CODE_PATTERN.match(normalized):
        raise serializers.ValidationError("Coupon code format is invalid.")
    return normalized


def validate_decimal_precision(value: Decimal, field_name: str = "amount") -> Decimal:
    try:
        normalized = Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise serializers.ValidationError(f"{field_name} must be a valid decimal.")
    quantized = normalized.quantize(Decimal("0.01"))
    if quantized != normalized:
        raise serializers.ValidationError(f"{field_name} must have at most 2 decimal places.")
    return quantized


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
    coupon_code = serializers.CharField(read_only=True)
    coupon_discount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_rate_percent = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    currency = serializers.CharField(read_only=True)


class CreateRazorpayOrderSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    coupon_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_course_id(self, value):
        if not Course.objects.filter(id=value, is_deleted=False, is_active=True).exists():
            raise serializers.ValidationError("Course not found.")
        return value

    def validate_coupon_code(self, value):
        if value in (None, ""):
            return ""
        return validate_coupon_code_format(value)


class CouponValidateSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    code = serializers.CharField()

    def validate_course_id(self, value):
        if not Course.objects.filter(id=value, is_deleted=False, is_active=True).exists():
            raise serializers.ValidationError("Course not found.")
        return value

    def validate_code(self, value):
        return validate_coupon_code_format(value)


class CouponSerializer(serializers.ModelSerializer):
    code = serializers.CharField()
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "course",
            "course_title",
            "discount_amount",
            "max_uses",
            "per_user_limit",
            "used_count",
            "valid_from",
            "valid_until",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("used_count", "created_at", "updated_at")
        extra_kwargs = {
            "course": {"required": False, "allow_null": True},
        }

    def validate_code(self, value):
        return validate_coupon_code_format(value)

    def validate_discount_amount(self, value):
        normalized = validate_decimal_precision(value, field_name="discount_amount")
        if normalized <= Decimal("0.00"):
            raise serializers.ValidationError("discount_amount must be greater than 0.")
        return normalized

    def validate(self, attrs):
        valid_from = attrs.get("valid_from")
        valid_until = attrs.get("valid_until")
        if self.instance:
            if valid_from is None:
                valid_from = self.instance.valid_from
            if valid_until is None:
                valid_until = self.instance.valid_until
        if valid_from and valid_until and valid_until < valid_from:
            raise serializers.ValidationError("valid_until must be after valid_from.")
        return attrs


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
