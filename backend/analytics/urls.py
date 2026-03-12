from django.urls import path

from analytics.views import (
    AdminActivityLogsView,
    AdminDbTableView,
    AdminDbTablesView,
    AnalyticsDashboardView,
    AnalyticsSummaryView,
)

urlpatterns = [
    path("summary/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("dashboard/", AnalyticsDashboardView.as_view(), name="analytics-dashboard"),
    path("activity-logs/", AdminActivityLogsView.as_view(), name="analytics-activity-logs"),
    path("admin/db/tables/", AdminDbTablesView.as_view(), name="admin-db-tables"),
    path("admin/db/table/<path:table_key>/rows/", AdminDbTableView.as_view(), name="admin-db-table"),
    path("admin/db/table/<path:table_key>/row/<path:pk>/", AdminDbTableView.as_view(), name="admin-db-table-row"),
]
