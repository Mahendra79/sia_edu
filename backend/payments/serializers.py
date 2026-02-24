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
    discount_percent = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    currency = serializers.CharField(read_only=True)


class CreateCheckoutSessionSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    success_url = serializers.URLField(required=False)
    cancel_url = serializers.URLField(required=False)

    def validate_course_id(self, value):
        if not Course.objects.filter(id=value, is_deleted=False, is_active=True).exists():
            raise serializers.ValidationError("Course not found.")
        return value

    def validate_success_url(self, value):
        return validate_checkout_redirect_url(value)

    def validate_cancel_url(self, value):
        return validate_checkout_redirect_url(value)


class ConfirmPaymentSerializer(serializers.Serializer):
    session_id = serializers.CharField()


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
            "stripe_session_id",
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
) -> tuple[Decimal, Decimal, Decimal, Decimal, Decimal]:
    amount = Decimal(str(course_price or 0)).quantize(Decimal("0.01"))
    normalized_discount = Decimal(str(discount_percent or 0))
    normalized_discount = max(Decimal("0.00"), min(Decimal("100.00"), normalized_discount))

    discount_amount = (amount * normalized_discount / Decimal("100")).quantize(Decimal("0.01"))
    subtotal = (amount - discount_amount).quantize(Decimal("0.01"))
    tax = (subtotal * tax_rate).quantize(Decimal("0.01"))
    total = (subtotal + tax).quantize(Decimal("0.01"))
    return amount, discount_amount, subtotal, tax, total
