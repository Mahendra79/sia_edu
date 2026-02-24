from datetime import datetime
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Category, Course
from payments.models import PaymentTransaction


class AnalyticsSummaryTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="analytics_admin",
            email="analytics_admin@example.com",
            phone="7222222222",
            name="Analytics Admin",
            password="StrongPass123!",
            is_staff=True,
        )
        self.standard_user = User.objects.create_user(
            username="analytics_user",
            email="analytics_user@example.com",
            phone="7222222223",
            name="Analytics User",
            password="StrongPass123!",
        )
        self.deleted_user = User.objects.create_user(
            username="analytics_deleted",
            email="analytics_deleted@example.com",
            phone="7222222224",
            name="Deleted User",
            password="StrongPass123!",
            is_deleted=True,
        )
        category = Category.objects.create(name="Analytics", description="Analytics")
        self.course = Course.objects.create(
            category=category,
            title="Analytics Course",
            short_description="Analytics short",
            description="Analytics description",
            price="120.00",
        )
        self.deleted_course = Course.objects.create(
            category=category,
            title="Deleted Analytics Course",
            short_description="Deleted",
            description="Deleted description",
            price="80.00",
            is_deleted=True,
        )
        self.summary_url = reverse("analytics-summary")
        self.dashboard_url = reverse("analytics-dashboard")
        self.second_course = Course.objects.create(
            category=category,
            title="Analytics Course 2",
            short_description="Analytics short 2",
            description="Analytics description 2",
            price="90.00",
        )

    def _create_payment(self, *, amount: str, status_value: str, month: int, is_deleted: bool = False, course=None):
        payment = PaymentTransaction.objects.create(
            user=self.standard_user,
            course=course or self.course,
            amount=Decimal(amount),
            tax=Decimal("0.00"),
            total=Decimal(amount),
            currency="usd",
            payment_status=status_value,
            is_deleted=is_deleted,
        )
        created_at = timezone.make_aware(datetime(2025, month, 15, 8, 30, 0))
        PaymentTransaction.objects.filter(id=payment.id).update(created_at=created_at)

    def test_admin_summary_returns_expected_totals_and_monthly_breakdown(self):
        self._create_payment(amount="100.00", status_value="success", month=1)
        self._create_payment(amount="50.00", status_value="success", month=2)
        self._create_payment(amount="35.00", status_value="failed", month=2)
        self._create_payment(amount="999.00", status_value="success", month=2, is_deleted=True)

        self.client.force_authenticate(self.admin_user)
        response = self.client.get(self.summary_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["revenue_summary"], 150.0)
        self.assertEqual(response.data["total_users"], 2)
        self.assertEqual(response.data["total_courses"], 2)
        self.assertEqual(response.data["payment_users"], 1)

        monthly_revenue = {item["month"]: item["amount"] for item in response.data["monthly_revenue"]}
        self.assertEqual(monthly_revenue["2025-01"], 100.0)
        self.assertEqual(monthly_revenue["2025-02"], 50.0)

    def test_non_admin_user_cannot_access_summary(self):
        self.client.force_authenticate(self.standard_user)
        response = self.client.get(self.summary_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_returns_aggregated_metrics_for_mis_reports(self):
        self._create_payment(amount="100.00", status_value="success", month=1, course=self.course)
        self._create_payment(amount="60.00", status_value="success", month=2, course=self.second_course)
        self._create_payment(amount="30.00", status_value="failed", month=2, course=self.course)
        self._create_payment(amount="20.00", status_value="pending", month=2, course=self.second_course)
        self._create_payment(amount="999.00", status_value="success", month=2, is_deleted=True, course=self.second_course)
        self._create_payment(amount="500.00", status_value="success", month=2, course=self.deleted_course)

        self.client.force_authenticate(self.admin_user)
        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        metrics = response.data["metrics"]
        self.assertEqual(metrics["total_users"], 2)
        self.assertEqual(metrics["verified_users"], 0)
        self.assertEqual(metrics["total_courses"], 2)
        self.assertEqual(metrics["payment_users"], 1)
        self.assertEqual(metrics["purchased_courses"], 2)
        self.assertEqual(metrics["total_revenue"], 160.0)
        self.assertEqual(metrics["avg_order_value"], 80.0)
        self.assertEqual(metrics["success_count"], 2)
        self.assertEqual(metrics["failed_count"], 1)
        self.assertEqual(metrics["pending_count"], 1)

        monthly_revenue = {item["month"]: item["amount"] for item in response.data["monthly_revenue"]}
        self.assertEqual(monthly_revenue["2025-01"], 100.0)
        self.assertEqual(monthly_revenue["2025-02"], 60.0)

        status_breakdown = response.data["payment_status_breakdown"]
        self.assertEqual(status_breakdown["success"], 2)
        self.assertEqual(status_breakdown["failed"], 1)
        self.assertEqual(status_breakdown["pending"], 1)

        top_courses = response.data["top_courses"]
        top_course_titles = {item["title"] for item in top_courses}
        self.assertIn(self.course.title, top_course_titles)
        self.assertIn(self.second_course.title, top_course_titles)

    def test_non_admin_user_cannot_access_dashboard(self):
        self.client.force_authenticate(self.standard_user)
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

