from __future__ import annotations

import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db.models.fields.files import FieldFile
from django.forms.models import model_to_dict

from deleted_records.models import DeletedRecord

REDACTED_VALUE = "[REDACTED]"
SENSITIVE_KEY_PARTS = (
    "password",
    "token",
    "secret",
    "otp",
    "hash",
    "signature",
    "api_key",
    "private_key",
    "authorization",
)


def is_sensitive_field_name(field_name: str) -> bool:
    normalized = str(field_name).strip().lower()
    return any(part in normalized for part in SENSITIVE_KEY_PARTS)


def redact_sensitive_payload(value):
    if isinstance(value, dict):
        redacted = {}
        for key, item in value.items():
            if is_sensitive_field_name(key):
                redacted[key] = REDACTED_VALUE
            else:
                redacted[key] = redact_sensitive_payload(item)
        return redacted
    if isinstance(value, list):
        return [redact_sensitive_payload(item) for item in value]
    return value


def _normalize_json_value(value):
    """Coerce values unsupported by JSON encoding into stable primitives."""
    if isinstance(value, dict):
        return {key: _normalize_json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_normalize_json_value(item) for item in value]
    if isinstance(value, FieldFile):
        return value.name or ""
    return value


def _to_json_safe_payload(data: dict) -> dict:
    """Normalize model values (Decimal, datetime, UUID, etc.) for JSONField storage."""
    normalized = _normalize_json_value(data)
    return json.loads(json.dumps(normalized, cls=DjangoJSONEncoder))


def record_soft_delete(instance, deleted_by=None, reason: str = "") -> DeletedRecord:
    data = model_to_dict(instance)
    data["id"] = instance.pk
    safe_data = _to_json_safe_payload(redact_sensitive_payload(data))
    return DeletedRecord.objects.create(
        model_name=instance.__class__.__name__,
        record_id=str(instance.pk),
        serialized_data=safe_data,
        reason=reason,
        deleted_by=deleted_by if getattr(deleted_by, "is_authenticated", False) else None,
    )
