from django.urls import path

from deleted_records.views import DeletedRecordsListView

urlpatterns = [
    path("", DeletedRecordsListView.as_view(), name="deleted-records-list"),
]
