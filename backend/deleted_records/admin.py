from django.contrib import admin

from deleted_records.models import DeletedRecord


@admin.register(DeletedRecord)
class DeletedRecordAdmin(admin.ModelAdmin):
    list_display = ("model_name", "record_id", "deleted_by", "deleted_at")
    list_filter = ("model_name", "deleted_at")
    search_fields = ("model_name", "record_id")

