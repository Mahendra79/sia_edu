from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncMonth
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsAdminUserRole
from analytics.models import AdminActivityLog
from analytics.serializers import AdminActivityLogSerializer
from courses.models import Course
from payments.models import PaymentTransaction


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        revenue_total = (
            PaymentTransaction.objects.filter(payment_status="success", is_deleted=False).aggregate(total=Sum("total"))[
                "total"
            ]
            or 0
        )
        users_total = User.objects.filter(is_deleted=False).count()
        courses_total = Course.objects.filter(is_deleted=False).count()
        payment_users_total = (
            PaymentTransaction.objects.filter(payment_status="success", is_deleted=False)
            .values("user_id")
            .distinct()
            .count()
        )

        revenue_monthly_qs = (
            PaymentTransaction.objects.filter(payment_status="success", is_deleted=False)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(amount=Sum("total"), transactions=Count("id"))
            .order_by("month")
        )
        revenue_monthly = [
            {
                "month": item["month"].strftime("%Y-%m"),
                "amount": float(item["amount"] or 0),
                "transactions": item["transactions"],
            }
            for item in revenue_monthly_qs
        ]

        users_monthly_qs = (
            User.objects.filter(is_deleted=False)
            .annotate(month=TruncMonth("date_joined"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        users_monthly = [
            {"month": item["month"].strftime("%Y-%m"), "count": item["count"]}
            for item in users_monthly_qs
        ]

        return Response(
            {
                "revenue_summary": float(revenue_total),
                "total_users": users_total,
                "total_courses": courses_total,
                "payment_users": payment_users_total,
                "monthly_revenue": revenue_monthly,
                "monthly_users": users_monthly,
            }
        )


class AnalyticsDashboardView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        users_qs = User.objects.filter(is_deleted=False)
        courses_qs = Course.objects.filter(is_deleted=False)
        payments_qs = PaymentTransaction.objects.filter(is_deleted=False, course__is_deleted=False)
        successful_payments_qs = payments_qs.filter(payment_status="success")

        total_revenue = successful_payments_qs.aggregate(total=Sum("total"))["total"] or 0
        average_order_value = successful_payments_qs.aggregate(avg=Avg("total"))["avg"] or 0

        payment_users_total = successful_payments_qs.values("user_id").distinct().count()
        purchased_courses_total = successful_payments_qs.values("course_id").distinct().count()

        payment_status_counts = {
            item["payment_status"]: item["count"]
            for item in payments_qs.values("payment_status").annotate(count=Count("id"))
        }

        monthly_revenue_qs = (
            successful_payments_qs.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(amount=Sum("total"))
            .order_by("month")
        )
        monthly_revenue = [
            {
                "month": item["month"].strftime("%Y-%m"),
                "amount": float(item["amount"] or 0),
            }
            for item in monthly_revenue_qs
        ]

        users_monthly_qs = (
            users_qs.annotate(month=TruncMonth("date_joined"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        monthly_users = [
            {
                "month": item["month"].strftime("%Y-%m"),
                "count": item["count"],
            }
            for item in users_monthly_qs
        ]

        top_courses_qs = (
            successful_payments_qs.values("course_id", "course__title")
            .annotate(count=Count("id"))
            .order_by("-count", "course__title")[:8]
        )
        top_courses = [
            {
                "course_id": item["course_id"],
                "title": item["course__title"] or f"Course #{item['course_id']}",
                "count": item["count"],
            }
            for item in top_courses_qs
        ]

        return Response(
            {
                "metrics": {
                    "total_users": users_qs.count(),
                    "verified_users": users_qs.filter(is_email_verified=True).count(),
                    "payment_users": payment_users_total,
                    "total_courses": courses_qs.count(),
                    "purchased_courses": purchased_courses_total,
                    "total_revenue": float(total_revenue),
                    "avg_order_value": float(average_order_value),
                    "success_count": payment_status_counts.get("success", 0),
                    "failed_count": payment_status_counts.get("failed", 0),
                    "pending_count": payment_status_counts.get("pending", 0),
                },
                "monthly_revenue": monthly_revenue,
                "monthly_users": monthly_users,
                "payment_status_breakdown": {
                    "success": payment_status_counts.get("success", 0),
                    "failed": payment_status_counts.get("failed", 0),
                    "pending": payment_status_counts.get("pending", 0),
                },
                "top_courses": top_courses,
            }
        )


class AdminActivityLogsView(generics.ListAPIView):
    permission_classes = [IsAdminUserRole]
    serializer_class = AdminActivityLogSerializer
    queryset = AdminActivityLog.objects.select_related("admin_user").all()

