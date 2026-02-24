from rest_framework import serializers

from deleted_records.models import DeletedRecord
from deleted_records.services import redact_sensitive_payload


class DeletedRecordSerializer(serializers.ModelSerializer):
    deleted_by_email = serializers.SerializerMethodField()
    serialized_data = serializers.SerializerMethodField()

    class Meta:
        model = DeletedRecord
        fields = (
            "id",
            "model_name",
            "record_id",
            "serialized_data",
            "reason",
            "deleted_by",
            "deleted_by_email",
            "deleted_at",
        )

    def get_deleted_by_email(self, obj):
        return obj.deleted_by.email if obj.deleted_by else None

    def get_serialized_data(self, obj):
        return redact_sensitive_payload(obj.serialized_data)
