from decimal import Decimal, InvalidOperation
from uuid import uuid4

import stripe
from django.conf import settings
from django.utils.dateparse import parse_date
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsActiveAuthenticated, IsAdminUserRole
from analytics.models import AdminActivityLog
from courses.models import Course, Enrollment
from deleted_records.services import record_soft_delete
from payments.models import PaymentTransaction
from payments.serializers import (
    AdminPaymentUpdateSerializer,
    BillingPreviewSerializer,
    ConfirmPaymentSerializer,
    CreateCheckoutSessionSerializer,
    PaymentTransactionSerializer,
    calculate_totals,
    validate_checkout_redirect_url,
)


def _log_admin_action(user, action: str, target_type: str, target_id: str, details: str = ""):
    if user and user.is_authenticated and user.is_admin:
        AdminActivityLog.objects.create(
            admin_user=user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )


def _stripe_ready() -> bool:
    if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY.strip() == "sk_test_replace_me":
        return False
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return True


def _tax_rate() -> Decimal:
    try:
        return Decimal(str(settings.DEFAULT_TAX_RATE))
    except InvalidOperation:
        return Decimal("0.00")


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
        )
        data = {
            "course_id": course.id,
            "course_title": course.title,
            "amount": amount,
            "discount_percent": course.discount_percent,
            "discount_amount": discount_amount,
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "currency": settings.STRIPE_CURRENCY,
        }
        return Response(BillingPreviewSerializer(data).data)


class CreateCheckoutSessionView(APIView):
    permission_classes = [IsActiveAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"

    def post(self, request):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
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
        )

        pricing_snapshot = {
            "amount": str(amount),
            "discount_percent": str(course.discount_percent),
            "discount_amount": str(discount_amount),
            "subtotal": str(subtotal),
            "tax": str(tax),
            "total": str(total),
            "currency": settings.STRIPE_CURRENCY,
        }

        frontend_url = settings.FRONTEND_BASE_URL.rstrip("/")
        success_url = serializer.validated_data.get("success_url") or f"{frontend_url}/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = serializer.validated_data.get("cancel_url") or f"{frontend_url}/failure"
        try:
            success_url = validate_checkout_redirect_url(success_url)
            cancel_url = validate_checkout_redirect_url(cancel_url)
        except serializers.ValidationError:
            return Response({"detail": "Checkout redirect URL is not allowed."}, status=status.HTTP_400_BAD_REQUEST)

        transaction = PaymentTransaction.objects.create(
            user=request.user,
            course=course,
            amount=amount,
            tax=tax,
            total=total,
            currency=settings.STRIPE_CURRENCY,
            payment_status="pending",
            metadata={"pricing": pricing_snapshot},
        )

        if not _stripe_ready():
            if settings.DEV_PAYMENT_MODE:
                session_id = f"dev_session_{transaction.id}_{uuid4().hex[:8]}"
                checkout_url = success_url.replace("{CHECKOUT_SESSION_ID}", session_id)
                transaction.stripe_session_id = session_id
                transaction.metadata = {
                    **transaction.metadata,
                    "mode": "dev_payment",
                    "checkout_url": checkout_url,
                }
                transaction.save(update_fields=["stripe_session_id", "metadata", "updated_at"])
                return Response(
                    {
                        "checkout_url": checkout_url,
                        "session_id": session_id,
                        "transaction_id": transaction.id,
                        "mode": "dev",
                    },
                    status=status.HTTP_201_CREATED,
                )
            transaction.payment_status = "failed"
            transaction.failure_reason = "Stripe key is not configured."
            transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
            return Response({"detail": "Stripe is not configured on server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": settings.STRIPE_CURRENCY,
                            "product_data": {
                                "name": course.title,
                                "description": course.short_description,
                            },
                            "unit_amount": int(total * Decimal("100")),
                        },
                        "quantity": 1,
                    }
                ],
                metadata={
                    "transaction_id": str(transaction.id),
                    "user_id": str(request.user.id),
                    "course_id": str(course.id),
                },
                success_url=success_url,
                cancel_url=cancel_url,
            )
        except stripe.error.StripeError as exc:
            transaction.payment_status = "failed"
            transaction.failure_reason = str(exc)
            transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
            return Response({"detail": "Unable to create checkout session."}, status=status.HTTP_400_BAD_REQUEST)

        transaction.stripe_session_id = session.id
        transaction.metadata = {
            **transaction.metadata,
            "checkout_url": session.url,
        }
        transaction.save(update_fields=["stripe_session_id", "metadata", "updated_at"])

        return Response(
            {
                "checkout_url": session.url,
                "session_id": session.id,
                "transaction_id": transaction.id,
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
        session_id = serializer.validated_data["session_id"]

        transaction = PaymentTransaction.objects.select_related("course", "user").filter(
            stripe_session_id=session_id,
            user=request.user,
        ).first()
        if not transaction:
            return Response({"detail": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

        if transaction.payment_status == "success":
            return Response({"status": "success"}, status=status.HTTP_200_OK)

        if not _stripe_ready():
            if settings.DEV_PAYMENT_MODE and session_id.startswith("dev_session_"):
                transaction.payment_status = "success"
                transaction.failure_reason = ""
                transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
                _create_or_update_enrollment(transaction)
                return Response({"status": "success", "mode": "dev"}, status=status.HTTP_200_OK)
            return Response({"detail": "Stripe is not configured on server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError:
            return Response({"detail": "Unable to verify payment."}, status=status.HTTP_400_BAD_REQUEST)

        if session.payment_status == "paid":
            transaction.payment_status = "success"
            transaction.stripe_payment_intent = session.payment_intent
            transaction.failure_reason = ""
            transaction.save(update_fields=["payment_status", "stripe_payment_intent", "failure_reason", "updated_at"])
            _create_or_update_enrollment(transaction)
            return Response({"status": "success"}, status=status.HTTP_200_OK)

        transaction.payment_status = "failed"
        transaction.failure_reason = "Payment not completed."
        transaction.save(update_fields=["payment_status", "failure_reason", "updated_at"])
        Enrollment.objects.update_or_create(
            user=request.user,
            course=transaction.course,
            defaults={"payment_status": "failed", "status": "cancelled"},
        )
        return Response({"status": "failed"}, status=status.HTTP_400_BAD_REQUEST)


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "webhook"
    authentication_classes = []

    def post(self, request):
        if not _stripe_ready() or not settings.STRIPE_WEBHOOK_SECRET:
            return Response({"detail": "Stripe webhook is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        payload = request.body
        signature = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        try:
            event = stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response({"detail": "Invalid webhook signature."}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get("type")
        data_object = event["data"]["object"]

        if event_type == "checkout.session.completed":
            session_id = data_object.get("id")
            transaction = PaymentTransaction.objects.select_related("user", "course").filter(
                stripe_session_id=session_id
            ).first()
            if transaction:
                transaction.payment_status = "success"
                transaction.stripe_payment_intent = data_object.get("payment_intent")
                transaction.failure_reason = ""
                transaction.save(
                    update_fields=["payment_status", "stripe_payment_intent", "failure_reason", "updated_at"]
                )
                _create_or_update_enrollment(transaction)

        if event_type in {"checkout.session.async_payment_failed", "payment_intent.payment_failed"}:
            transaction_id = None
            metadata = data_object.get("metadata") or {}
            if metadata.get("transaction_id"):
                transaction_id = metadata["transaction_id"]

            transaction = None
            if transaction_id:
                transaction = PaymentTransaction.objects.filter(id=transaction_id).first()
            if not transaction and data_object.get("id"):
                transaction = PaymentTransaction.objects.filter(stripe_session_id=data_object["id"]).first()

            if transaction:
                transaction.payment_status = "failed"
                transaction.failure_reason = "Payment failed from webhook."
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

