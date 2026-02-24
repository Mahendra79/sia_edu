from django.db import models
from django.conf import settings


class AdminActivityLog(models.Model):
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activity_logs")
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=80)
    target_id = models.CharField(max_length=80, blank=True)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.admin_user.email} - {self.action}"

