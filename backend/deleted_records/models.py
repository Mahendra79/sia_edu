from django.conf import settings
from django.db import models


class DeletedRecord(models.Model):
    model_name = models.CharField(max_length=120, db_index=True)
    record_id = models.CharField(max_length=120, db_index=True)
    serialized_data = models.JSONField(default=dict)
    reason = models.CharField(max_length=255, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deleted_records",
    )
    deleted_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-deleted_at"]

    def __str__(self) -> str:
        return f"{self.model_name}:{self.record_id}"

