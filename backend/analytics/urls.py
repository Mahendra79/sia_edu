from django.urls import path

from analytics.views import AdminActivityLogsView, AnalyticsDashboardView, AnalyticsSummaryView

urlpatterns = [
    path("summary/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("dashboard/", AnalyticsDashboardView.as_view(), name="analytics-dashboard"),
    path("activity-logs/", AdminActivityLogsView.as_view(), name="analytics-activity-logs"),
]
