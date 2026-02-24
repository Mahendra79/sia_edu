from decimal import Decimal

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Category, Course
from payments.models import PaymentTransaction


@override_settings(
    STRIPE_SECRET_KEY="",
    DEV_PAYMENT_MODE=True,
    FRONTEND_BASE_URL="http://localhost:5173",
    CORS_ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"],
)
class CheckoutSessionSecurityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="checkout_user",
            email="checkout_user@example.com",
            phone="7111111111",
            name="Checkout User",
            password="StrongPass123!",
        )
        self.client.force_authenticate(self.user)
        category = Category.objects.create(name="Payments", description="Payments Category")
        self.course = Course.objects.create(
            category=category,
            title="Secure Checkout Course",
            short_description="Checkout course",
            description="Checkout course description",
            price="150.00",
            is_active=True,
        )
        self.checkout_url = reverse("create-checkout-session")

    def test_rejects_redirect_urls_from_untrusted_origins(self):
        response = self.client.post(
            self.checkout_url,
            {
                "course_id": self.course.id,
                "success_url": "https://evil.example/success?session_id={CHECKOUT_SESSION_ID}",
                "cancel_url": "https://evil.example/failure",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(PaymentTransaction.objects.count(), 0)

    def test_allows_frontend_origin_redirect_urls(self):
        response = self.client.post(
            self.checkout_url,
            {
                "course_id": self.course.id,
                "success_url": "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
                "cancel_url": "http://localhost:5173/failure",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["mode"], "dev")
        self.assertIn("checkout_url", response.data)

        transaction = PaymentTransaction.objects.get(id=response.data["transaction_id"])
        self.assertTrue(transaction.stripe_session_id.startswith("dev_session_"))


@override_settings(
    STRIPE_SECRET_KEY="",
    DEV_PAYMENT_MODE=True,
    DEFAULT_TAX_RATE="0.18",
    FRONTEND_BASE_URL="http://localhost:5173",
    CORS_ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"],
)
class BillingDiscountComputationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="discount_user",
            email="discount_user@example.com",
            phone="7222222222",
            name="Discount User",
            password="StrongPass123!",
        )
        self.client.force_authenticate(self.user)
        category = Category.objects.create(name="Discount Category", description="Discount")
        self.course = Course.objects.create(
            category=category,
            title="Discounted Course",
            short_description="Discount course",
            description="Discount course description",
            price="100.00",
            discount_percent="10.00",
            is_active=True,
        )

    def test_billing_preview_uses_db_discount_and_tax(self):
        response = self.client.get(reverse("billing-preview", kwargs={"course_id": self.course.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["amount"], "100.00")
        self.assertEqual(response.data["discount_percent"], "10.00")
        self.assertEqual(response.data["discount_amount"], "10.00")
        self.assertEqual(response.data["subtotal"], "90.00")
        self.assertEqual(response.data["tax"], "16.20")
        self.assertEqual(response.data["total"], "106.20")

    def test_checkout_session_transaction_uses_discounted_total(self):
        response = self.client.post(
            reverse("create-checkout-session"),
            {
                "course_id": self.course.id,
                "success_url": "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
                "cancel_url": "http://localhost:5173/failure",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        transaction = PaymentTransaction.objects.get(id=response.data["transaction_id"])
        self.assertEqual(transaction.amount, Decimal("100.00"))
        self.assertEqual(transaction.tax, Decimal("16.20"))
        self.assertEqual(transaction.total, Decimal("106.20"))

