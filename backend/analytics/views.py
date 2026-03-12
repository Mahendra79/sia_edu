import datetime as dt
from decimal import Decimal
from uuid import UUID

from django.apps import apps
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncMonth
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsAdminUserRole
from analytics.models import AdminActivityLog
from analytics.serializers import AdminActivityLogSerializer
from courses.models import Course
from payments.models import PaymentTransaction

ALLOWED_APP_LABELS = {
    "accounts",
    "analytics",
    "chatbot",
    "courses",
    "deleted_records",
    "payments",
}


def _allowed_models():
    for model in apps.get_models():
        if model._meta.app_label not in ALLOWED_APP_LABELS:
            continue
        yield model


def _model_key(model) -> str:
    return f"{model._meta.app_label}.{model._meta.model_name}"


def _get_model(table_key: str):
    if not table_key or "." not in table_key:
        return None
    app_label, model_name = table_key.split(".", 1)
    if app_label not in ALLOWED_APP_LABELS:
        return None
    try:
        return apps.get_model(app_label, model_name)
    except LookupError:
        return None


def _serialize_choices(choices):
    serialized = []
    for value, label in choices:
        if isinstance(label, (list, tuple)):
            for child_value, child_label in label:
                serialized.append({"value": child_value, "label": str(child_label)})
        else:
            serialized.append({"value": value, "label": str(label)})
    return serialized


def _build_columns(model):
    columns = []
    for field in model._meta.fields:
        if field.many_to_many or field.one_to_many:
            continue
        read_only = (
            field.primary_key
            or not field.editable
            or getattr(field, "auto_created", False)
            or getattr(field, "auto_now", False)
            or getattr(field, "auto_now_add", False)
        )
        columns.append(
            {
                "name": field.name,
                "type": field.get_internal_type(),
                "null": field.null,
                "blank": field.blank,
                "primary_key": field.primary_key,
                "read_only": read_only,
                "is_relation": field.is_relation,
                "related_model": _model_key(field.related_model) if field.is_relation and field.related_model else None,
                "choices": _serialize_choices(field.choices) if field.choices else [],
            }
        )
    return columns


def _serialize_field_value(field, value):
    if value is None:
        return None
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, UUID):
        return str(value)
    return value


def _build_row(model, obj):
    row = {}
    for field in model._meta.fields:
        if field.many_to_many or field.one_to_many:
            continue
        value = field.value_from_object(obj)
        row[field.name] = _serialize_field_value(field, value)
        if field.is_relation:
            related_obj = getattr(obj, field.name, None)
            if related_obj is not None:
                row[f"{field.name}__display"] = str(related_obj)
    row["__pk"] = _serialize_field_value(model._meta.pk, getattr(obj, model._meta.pk.name))
    return row


class AdminDbTablesView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        tables = []
        for model in _allowed_models():
            tables.append(
                {
                    "key": _model_key(model),
                    "label": str(model._meta.verbose_name_plural).title(),
                    "app_label": model._meta.app_label,
                    "model_name": model._meta.model_name,
                    "table_name": model._meta.db_table,
                    "columns": _build_columns(model),
                }
            )
        tables.sort(key=lambda item: (item["app_label"], item["model_name"]))
        return Response({"tables": tables})


class AdminDbTableView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request, table_key: str):
        model = _get_model(table_key)
        if not model:
            return Response({"detail": "Table not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            page = int(request.query_params.get("page", 1))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = int(request.query_params.get("page_size", 25))
        except (TypeError, ValueError):
            page_size = 25
        page = max(page, 1)
        page_size = min(max(page_size, 1), 200)
        offset = (page - 1) * page_size

        fk_fields = [field.name for field in model._meta.fields if field.is_relation and field.many_to_one]
        queryset = model._default_manager.all()
        if fk_fields:
            queryset = queryset.select_related(*fk_fields)

        total = queryset.count()
        order_field = model._meta.pk.name
        rows_qs = queryset.order_by(f"-{order_field}")[offset : offset + page_size]
        rows = [_build_row(model, obj) for obj in rows_qs]

        return Response(
            {
                "table": table_key,
                "columns": _build_columns(model),
                "rows": rows,
                "count": total,
                "page": page,
                "page_size": page_size,
            }
        )

    def patch(self, request, table_key: str, pk: str | None = None):
        model = _get_model(table_key)
        if not model:
            return Response({"detail": "Table not found."}, status=status.HTTP_404_NOT_FOUND)
        if pk is None:
            return Response({"detail": "Record id required."}, status=status.HTTP_400_BAD_REQUEST)

        instance = model._default_manager.filter(pk=pk).first()
        if not instance:
            return Response({"detail": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        columns = {column["name"]: column for column in _build_columns(model)}
        for name, value in (request.data or {}).items():
            if not name or name.startswith("__"):
                continue
            column = columns.get(name)
            if not column or column["read_only"]:
                continue
            field = model._meta.get_field(name)
            try:
                if field.is_relation:
                    if value in ("", None):
                        if field.null:
                            setattr(instance, name, None)
                        continue
                    related_obj = field.related_model._default_manager.filter(pk=value).first()
                    if not related_obj:
                        return Response({"detail": f"Invalid value for {name}."}, status=status.HTTP_400_BAD_REQUEST)
                    setattr(instance, name, related_obj)
                else:
                    if value in ("", None) and field.null:
                        setattr(instance, name, None)
                    else:
                        cleaned = field.clean(value, instance)
                        setattr(instance, name, cleaned)
            except ValidationError as exc:
                return Response({"detail": str(exc.messages[0])}, status=status.HTTP_400_BAD_REQUEST)

        try:
            instance.full_clean()
            instance.save()
        except ValidationError as exc:
            return Response({"detail": str(exc.messages[0])}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"detail": "Integrity error while saving record."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"row": _build_row(model, instance)})

    def delete(self, request, table_key: str, pk: str | None = None):
        model = _get_model(table_key)
        if not model:
            return Response({"detail": "Table not found."}, status=status.HTTP_404_NOT_FOUND)
        if pk is None:
            return Response({"detail": "Record id required."}, status=status.HTTP_400_BAD_REQUEST)

        instance = model._default_manager.filter(pk=pk).first()
        if not instance:
            return Response({"detail": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        instance.delete()
        return Response({"detail": "Record deleted."}, status=status.HTTP_200_OK)

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

