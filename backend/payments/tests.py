from decimal import Decimal

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Category, Course
from payments.models import PaymentTransaction


@override_settings(
    DEV_PAYMENT_MODE=False,
    RAZORPAY_CURRENCY="inr",
    DEFAULT_TAX_RATE="0.18",
)
class RazorpayOrderTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="payment_user",
            email="payment_user@example.com",
            phone="7111111111",
            name="Payment User",
            password="StrongPass123!",
        )
        self.client.force_authenticate(self.user)
        category = Category.objects.create(name="Payments", description="Payments Category")
        self.course = Course.objects.create(
            category=category,
            title="Razorpay Course",
            short_description="Checkout course",
            description="Checkout course description",
            price="100.00",
            discount_percent="10.00",
            is_active=True,
        )

    def test_create_order_in_local_mock_mode(self):
        response = self.client.post(reverse("create-razorpay-order"), {"course_id": self.course.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["mode"], "dev")
        self.assertTrue(str(response.data["order_id"]).startswith("dev_order_"))

    def test_billing_preview_calculates_tax_inclusive_total(self):
        response = self.client.get(reverse("billing-preview", kwargs={"course_id": self.course.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["amount"], "100.00")
        self.assertEqual(response.data["discount_amount"], "10.00")
        self.assertEqual(response.data["final_price"], "90.00")
        self.assertEqual(response.data["total"], "90.00")
        self.assertEqual(response.data["tax_rate_percent"], "18.00")

    def test_confirm_payment_marks_success_in_local_mock_mode(self):
        order_response = self.client.post(reverse("create-razorpay-order"), {"course_id": self.course.id}, format="json")
        tx_id = order_response.data["transaction_id"]
        response = self.client.post(reverse("confirm-payment"), {"transaction_id": tx_id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        transaction = PaymentTransaction.objects.get(id=tx_id)
        self.assertEqual(transaction.payment_status, "success")
        self.assertEqual(transaction.total, Decimal("90.00"))


@override_settings(
    DEV_PAYMENT_MODE=True,
    RAZORPAY_KEY_ID="",
    RAZORPAY_KEY_SECRET="",
    RAZORPAY_CURRENCY="inr",
)
class RazorpayLiveModeValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="payment_live_user",
            email="payment_live_user@example.com",
            phone="7222222222",
            name="Payment Live User",
            password="StrongPass123!",
        )
        self.client.force_authenticate(self.user)
        category = Category.objects.create(name="Payments Live", description="Payments Live Category")
        self.course = Course.objects.create(
            category=category,
            title="Razorpay Live Course",
            short_description="Checkout live course",
            description="Checkout live course description",
            price="100.00",
            discount_percent="0.00",
            is_active=True,
        )

    def test_create_order_returns_503_when_live_mode_missing_credentials(self):
        response = self.client.post(reverse("create-razorpay-order"), {"course_id": self.course.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("Razorpay is not configured", response.data["detail"])
