from rest_framework import serializers

from analytics.models import AdminActivityLog


class AdminActivityLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source="admin_user.email", read_only=True)

    class Meta:
        model = AdminActivityLog
        fields = ("id", "admin_user", "admin_email", "action", "target_type", "target_id", "details", "created_at")
