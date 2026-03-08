import hashlib
import hmac
import json
import logging
from decimal import Decimal, InvalidOperation
from uuid import uuid4

from django.conf import settings
from django.utils.dateparse import parse_date
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.http import HttpResponse

from accounts.permissions import IsActiveAuthenticated, IsAdminUserRole
from accounts.email_service import send_payment_success_email
from analytics.models import AdminActivityLog
from courses.models import Course, Enrollment
from deleted_records.services import record_soft_delete
from payments.invoice import build_invoice_pdf
from payments.models import PaymentTransaction
from payments.serializers import (
    AdminPaymentUpdateSerializer,
    BillingPreviewSerializer,
    ConfirmPaymentSerializer,
    CreateRazorpayOrderSerializer,
    PaymentTransactionSerializer,
    calculate_totals,
)

logger = logging.getLogger(__name__)


def _log_admin_action(user, action: str, target_type: str, target_id: str, details: str = ""):
    if user and user.is_authenticated and user.is_admin:
        AdminActivityLog.objects.create(
            admin_user=user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )


def _use_real_gateway() -> bool:
    # Requested behavior:
    # DEV_PAYMENT_MODE=False -> local testing/mock flow
    # DEV_PAYMENT_MODE=True -> real Razorpay flow
    return bool(settings.DEV_PAYMENT_MODE)


def _has_razorpay_credentials() -> bool:
    return bool(settings.RAZORPAY_KEY_ID.strip() and settings.RAZORPAY_KEY_SECRET.strip())


def _razorpay_client():
    try:
        import razorpay
    except ImportError:
        return None

    key_id = settings.RAZORPAY_KEY_ID.strip()
    key_secret = settings.RAZORPAY_KEY_SECRET.strip()
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))


def _tax_rate() -> Decimal:
    try:
        configured_rate = Decimal(str(settings.DEFAULT_TAX_RATE))
    except InvalidOperation:
        configured_rate = Decimal("0.18")
    if configured_rate <= Decimal("0.00"):
        return Decimal("0.18")
    return configured_rate


def _tax_rate_percent() -> Decimal:
    return (_tax_rate() * Decimal("100")).quantize(Decimal("0.01"))


def _create_or_update_enrollment(transaction: PaymentTransaction):
    enrollment, _ = Enrollment.objects.get_or_create(
        user=transaction.user,
        course=transaction.course,
        defaults={"status": "enrolled", "payment_status": "success"},
    )
    if enrollment.payment_status != "success":
        enrollment.payment_status = "success"
        enrollment.status = "enrolled"
        enrollment.save(update_fields=["payment_status", "status", "updated_at"])
    transaction.enrollment = enrollment
    transaction.save(update_fields=["enrollment", "updated_at"])


def _send_payment_success_email_once(transaction: PaymentTransaction):
    metadata = transaction.metadata or {}
    if metadata.get("success_email_sent"):
        return
    try:
        invoice_pdf = build_invoice_pdf(transaction)
        send_payment_success_email(transaction=transaction, invoice_pdf=invoice_pdf)
        transaction.metadata = {
            **metadata,
            "success_email_sent": True,
        }
        transaction.save(update_fields=["metadata", "updated_at"])
    except Exception:
        logger.exception("Failed to send payment success email for transaction %s", transaction.id)


class BillingPreviewView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def get(self, request, course_id: int):
        course = Course.objects.filter(id=course_id, is_deleted=False, is_active=True).first()
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        amount, discount_amount, subtotal, tax, total = calculate_totals(
            course.price,
            _tax_rate(),
            course.discount_percent,
            course.final_price,
        )
        if amount > Decimal("0.00"):
            discount_percent = ((discount_amount * Decimal("100")) / amount).quantize(Decimal("0.01"))
        else:
            discount_percent = Decimal("0.00")
        data = {
            "course_id": course.id,
            "course_title": course.title,
            "amount": amount,
            "final_price": total,
            "discount_percent": discount_percent,
            "discount_amount": discount_amount,
            "subtotal": subtotal,
            "tax_rate_percent": _tax_rate_percent(),
            "tax": tax,
            "total": total,
            "currency": settings.RAZORPAY_CURRENCY,
        }
        return Response(BillingPreviewSerializer(data).data)


class CreateRazorpayOrderView(APIView):
    permission_classes = [IsActiveAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"

    def post(self, request):
        serializer = CreateRazorpayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = Course.objects.filter(id=serializer.validated_data["course_id"], is_deleted=False, is_active=True).first()
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        if Enrollment.objects.filter(user=request.user, course=course, payment_status="success", is_deleted=False).exists():
            return Response({"detail": "You are already enrolled in this course."}, status=status.HTTP_400_BAD_REQUEST)

        amount, discount_amount, subtotal, tax, total = calculate_totals(
            course.price,
            _tax_rate(),
            course.discount_percent,
            course.final_price,
        )
        if amount > Decimal("0.00"):
            discount_percent = ((discount_amount * Decimal("100")) / amount).quantize(Decimal("0.01"))
        else:
            discount_percent = Decimal("0.00")

        pricing_snapshot = {
            "amount": str(amount),
            "final_price": str(total),
            "discount_percent": str(discount_percent),
            "discount_amount": str(discount_amount),
            "subtotal": str(subtotal),
            "tax_rate_percent": str(_tax_rate_percent()),
            "tax": str(tax),
            "total": str(total),
            "currency": settings.RAZORPAY_CURRENCY,
        }

        transaction = PaymentTransaction.objects.create(
            user=request.user,
            course=course,
            amount=amount,
            tax=tax,
            total=total,
            currency=settings.RAZORPAY_CURRENCY,
            payment_status="pending",
            metadata={"pricing": pricing_snapshot},
        )

        # Local testing mode (DEV_PAYMENT_MODE=False) OR missing credentials:
        # no real gateway call, always return mock order for local testing.
        if (not _use_real_gateway()) or (not _has_razorpay_credentials()):
            dev_order_id = f"dev_order_{transaction.id}_{uuid4().hex[:8]}"
            transaction.razorpay_order_id = dev_order_id
            transaction.metadata = {
                **transaction.metadata,
                "mode": "dev_payment",
                "fallback_reason": "local_mode_or_missing_credentials",
            }
            transaction.save(update_fields=["razorpay_order_id", "metadata", "updated_at"])
            return Response(
                {
                    "mode": "dev",
                    "transaction_id": transaction.id,
                    "order_id": dev_order_id,
                    "amount": int(total * Decimal("100")),
                    "currency": settings.RAZORPAY_CURRENCY,
                    "course_title": course.title,
                },
                status=status.HTTP_201_CREATED,
            )

        client = _razorpay_client()
        if not client:
            # Defensive fallback (should already be handled above).
            dev_order_id = f"dev_order_{transaction.id}_{uuid4().hex[:8]}"
            transaction.razorpay_order_id = dev_order_id
            transaction.metadata = {
                **transaction.metadata,
                "mode": "dev_payment",
                "fallback_reason": "razorpay_client_unavailable",
            }
            transaction.save(update_fields=["razorpay_order_id", "metadata", "updated_at"])
            return Response(
                {
                    "mode": "dev",
                    "transaction_id": transaction.id,
                    "order_id": dev_order_id,
                    "amount": int(total * Decimal("100")),
                    "currency": settings.RAZORPAY_CURRENCY,
                    "course_title": course.title,
                },
                status=status.HTTP_201_CREATED,
            )

        try:
            order = client.order.create(
                {
                    "amount": int(total * Decimal("100")),
                    "currency": settings.RAZORPAY_CURRENCY.upper(),
                    "receipt": f"sia_txn_{transaction.id}",
                    "notes": {
                        "transaction_id": str(transaction.id),
                        "course_id": str(course.id),
                        "user_id": str(request.user.id),
                    },
                }
            )
        except Exception as exc:
            transaction.payment_status = "failed"
            transaction.failure_reason = str(exc)
            transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
            return Response({"detail": "Unable to create Razorpay order."}, status=status.HTTP_400_BAD_REQUEST)

        transaction.razorpay_order_id = order.get("id")
        transaction.metadata = {
            **transaction.metadata,
            "gateway_order": order,
        }
        transaction.save(update_fields=["razorpay_order_id", "metadata", "updated_at"])

        return Response(
            {
                "mode": "live",
                "transaction_id": transaction.id,
                "key_id": settings.RAZORPAY_KEY_ID,
                "order_id": order.get("id"),
                "amount": order.get("amount"),
                "currency": order.get("currency"),
                "course_title": course.title,
                "description": course.short_description,
                "prefill": {
                    "name": request.user.name or request.user.username,
                    "email": request.user.email,
                    "contact": request.user.phone or "",
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ConfirmPaymentView(APIView):
    permission_classes = [IsActiveAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"

    def post(self, request):
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        transaction = None
        transaction_id = serializer.validated_data.get("transaction_id")
        legacy_session_id = serializer.validated_data.get("session_id")
        provided_order_id = serializer.validated_data.get("razorpay_order_id")

        if transaction_id:
            transaction = PaymentTransaction.objects.select_related("course", "user").filter(
                id=transaction_id,
                user=request.user,
            ).first()
        elif provided_order_id:
            transaction = PaymentTransaction.objects.select_related("course", "user").filter(
                razorpay_order_id=provided_order_id,
                user=request.user,
            ).first()
        elif legacy_session_id:
            transaction = PaymentTransaction.objects.select_related("course", "user").filter(
                razorpay_order_id=legacy_session_id,
                user=request.user,
            ).first()

        # Local compatibility fallback for older frontend flows.
        if not transaction and not _use_real_gateway():
            transaction = (
                PaymentTransaction.objects.select_related("course", "user")
                .filter(user=request.user, payment_status="pending", is_deleted=False)
                .order_by("-created_at")
                .first()
            )

        if not transaction:
            return Response({"detail": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

        if transaction.payment_status == "success":
            _send_payment_success_email_once(transaction)
            return Response({"status": "success"}, status=status.HTTP_200_OK)

        # If order creation fell back to dev mode (e.g. missing gateway credentials),
        # allow local-style confirmation even when DEV_PAYMENT_MODE is true.
        transaction_mode = str((transaction.metadata or {}).get("mode", "")).strip().lower()
        is_dev_fallback_transaction = transaction_mode == "dev_payment" or str(transaction.razorpay_order_id or "").startswith("dev_order_")

        if is_dev_fallback_transaction:
            transaction.payment_status = "success"
            transaction.failure_reason = ""
            transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
            _create_or_update_enrollment(transaction)
            _send_payment_success_email_once(transaction)
            return Response({"status": "success", "mode": "dev-fallback"}, status=status.HTTP_200_OK)

        # Local testing mode (DEV_PAYMENT_MODE=False): mark success directly.
        if not _use_real_gateway():
            transaction.payment_status = "success"
            transaction.failure_reason = ""
            transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
            _create_or_update_enrollment(transaction)
            _send_payment_success_email_once(transaction)
            return Response({"status": "success", "mode": "dev"}, status=status.HTTP_200_OK)

        order_id = serializer.validated_data.get("razorpay_order_id", "")
        payment_id = serializer.validated_data.get("razorpay_payment_id", "")
        signature = serializer.validated_data.get("razorpay_signature", "")

        if not order_id or not payment_id or not signature:
            return Response({"detail": "Missing Razorpay payment details."}, status=status.HTTP_400_BAD_REQUEST)
        if transaction.razorpay_order_id and transaction.razorpay_order_id != order_id:
            return Response({"detail": "Razorpay order mismatch."}, status=status.HTTP_400_BAD_REQUEST)

        secret = settings.RAZORPAY_KEY_SECRET.strip()
        if not secret:
            return Response({"detail": "Razorpay secret is not configured on server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        signed_payload = f"{order_id}|{payment_id}".encode("utf-8")
        expected_signature = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_signature, signature):
            transaction.payment_status = "failed"
            transaction.failure_reason = "Invalid Razorpay signature."
            transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
            Enrollment.objects.update_or_create(
                user=request.user,
                course=transaction.course,
                defaults={"payment_status": "failed", "status": "cancelled"},
            )
            return Response({"status": "failed"}, status=status.HTTP_400_BAD_REQUEST)

        transaction.payment_status = "success"
        transaction.razorpay_order_id = order_id
        transaction.razorpay_payment_id = payment_id
        transaction.razorpay_signature = signature
        transaction.failure_reason = ""
        transaction.save(
            update_fields=[
                "payment_status",
                "razorpay_order_id",
                "razorpay_payment_id",
                "razorpay_signature",
                "failure_reason",
                "updated_at",
            ]
        )
        _create_or_update_enrollment(transaction)
        _send_payment_success_email_once(transaction)
        return Response({"status": "success"}, status=status.HTTP_200_OK)


class InvoiceDownloadView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def get(self, request, payment_id: int):
        transaction = (
            PaymentTransaction.objects.select_related("user", "course")
            .filter(id=payment_id, is_deleted=False, payment_status="success")
            .first()
        )
        if not transaction:
            return Response({"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)

        if (not request.user.is_admin) and transaction.user_id != request.user.id:
            return Response({"detail": "You are not allowed to access this invoice."}, status=status.HTTP_403_FORBIDDEN)

        pdf_bytes = build_invoice_pdf(transaction)
        inline = str(request.query_params.get("inline", "0")).lower() in {"1", "true", "yes"}
        disposition = "inline" if inline else "attachment"
        filename = f"{transaction.id}_invoice.pdf"

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
        return response


class RazorpayWebhookView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "webhook"
    authentication_classes = []

    def post(self, request):
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET.strip()
        if not webhook_secret:
            return Response({"detail": "Razorpay webhook is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        payload = request.body
        signature = request.META.get("HTTP_X_RAZORPAY_SIGNATURE", "")
        expected_signature = hmac.new(webhook_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_signature, signature):
            return Response({"detail": "Invalid webhook signature."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = json.loads(payload.decode("utf-8"))
        except ValueError:
            return Response({"detail": "Invalid webhook payload."}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get("event")
        payment_entity = ((event.get("payload") or {}).get("payment") or {}).get("entity") or {}
        order_id = payment_entity.get("order_id")
        payment_id = payment_entity.get("id")

        if not order_id:
            return Response({"received": True}, status=status.HTTP_200_OK)

        transaction = PaymentTransaction.objects.select_related("user", "course").filter(razorpay_order_id=order_id).first()
        if not transaction:
            return Response({"received": True}, status=status.HTTP_200_OK)

        if event_type == "payment.captured":
            transaction.payment_status = "success"
            transaction.razorpay_payment_id = payment_id
            transaction.failure_reason = ""
            transaction.save(update_fields=["payment_status", "razorpay_payment_id", "failure_reason", "updated_at"])
            _create_or_update_enrollment(transaction)
            _send_payment_success_email_once(transaction)

        if event_type in {"payment.failed", "order.paid"} and payment_entity.get("status") == "failed":
            transaction.payment_status = "failed"
            transaction.failure_reason = "Payment failed from Razorpay webhook."
            transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
            Enrollment.objects.update_or_create(
                user=transaction.user,
                course=transaction.course,
                defaults={"payment_status": "failed", "status": "cancelled"},
            )

        return Response({"received": True}, status=status.HTTP_200_OK)


class MyPaymentHistoryView(generics.ListAPIView):
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsActiveAuthenticated]

    def get_queryset(self):
        queryset = (
            PaymentTransaction.objects.select_related("course", "user")
            .filter(user=self.request.user, is_deleted=False)
            .order_by("-created_at")
        )
        status_filter = self.request.query_params.get("status")
        course_id = self.request.query_params.get("course")
        date_from = parse_date(self.request.query_params.get("date_from", ""))
        date_to = parse_date(self.request.query_params.get("date_to", ""))

        if status_filter in {"success", "failed", "pending"}:
            queryset = queryset.filter(payment_status=status_filter)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        return queryset


class AdminPaymentsView(generics.ListAPIView):
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        queryset = PaymentTransaction.objects.select_related("course", "user").filter(is_deleted=False)
        status_filter = self.request.query_params.get("status")
        course_id = self.request.query_params.get("course")
        date_from = parse_date(self.request.query_params.get("date_from", ""))
        date_to = parse_date(self.request.query_params.get("date_to", ""))

        if status_filter in {"success", "failed", "pending"}:
            queryset = queryset.filter(payment_status=status_filter)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        _log_admin_action(self.request.user, "view_payments", "PaymentTransaction", "list")
        return queryset.order_by("-created_at")


class AdminPaymentDetailView(APIView):
    permission_classes = [IsAdminUserRole]

    @staticmethod
    def _get_transaction(payment_id: int):
        return PaymentTransaction.objects.select_related("course", "user").filter(id=payment_id, is_deleted=False).first()

    def patch(self, request, payment_id: int):
        transaction = self._get_transaction(payment_id)
        if not transaction:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminPaymentUpdateSerializer(transaction, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        new_status = serializer.validated_data.get("payment_status")
        if new_status == "success":
            _create_or_update_enrollment(transaction)
            _send_payment_success_email_once(transaction)
        elif new_status == "failed":
            Enrollment.objects.update_or_create(
                user=transaction.user,
                course=transaction.course,
                defaults={"payment_status": "failed", "status": "cancelled"},
            )
        elif new_status == "pending":
            Enrollment.objects.update_or_create(
                user=transaction.user,
                course=transaction.course,
                defaults={"payment_status": "pending", "status": "enrolled"},
            )

        _log_admin_action(request.user, "update_payment", "PaymentTransaction", str(transaction.id), transaction.payment_status)
        return Response(PaymentTransactionSerializer(transaction).data, status=status.HTTP_200_OK)

    def delete(self, request, payment_id: int):
        transaction = self._get_transaction(payment_id)
        if not transaction:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("reason", "admin_soft_delete_payment")
        record_soft_delete(transaction, deleted_by=request.user, reason=reason)
        transaction.is_deleted = True
        transaction.save(update_fields=["is_deleted", "updated_at"])
        _log_admin_action(request.user, "delete_payment", "PaymentTransaction", str(transaction.id), reason)
        return Response({"message": "Payment soft deleted."}, status=status.HTTP_200_OK)
