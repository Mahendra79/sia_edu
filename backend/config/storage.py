from __future__ import annotations

import mimetypes
import posixpath
from uuid import uuid4

import requests
from django.conf import settings
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible
class SupabaseStorage(Storage):
    def __init__(self):
        self.supabase_url = str(getattr(settings, "SUPABASE_URL", "")).rstrip("/")
        self.bucket = str(getattr(settings, "SUPABASE_BUCKET", "")).strip()
        self.service_key = str(getattr(settings, "SUPABASE_SERVICE_KEY", "")).strip()
        self.public_url = str(getattr(settings, "SUPABASE_PUBLIC_URL", "")).rstrip("/")
        self.timeout = int(getattr(settings, "SUPABASE_STORAGE_TIMEOUT", 20))

        if not self.supabase_url or not self.bucket or not self.service_key or not self.public_url:
            raise RuntimeError("Supabase storage is not configured. Check SUPABASE_* settings.")

    def _build_object_url(self, name: str) -> str:
        return f"{self.supabase_url}/storage/v1/object/{self.bucket}/{name.lstrip('/')}"

    def _unique_name(self, name: str) -> str:
        directory, filename = posixpath.split(name)
        base, ext = posixpath.splitext(filename)
        unique_name = f"{uuid4().hex}{ext}"
        return posixpath.join(directory, unique_name) if directory else unique_name

    def _save(self, name, content):
        name = self.get_valid_name(name)
        name = posixpath.normpath(str(name).replace("\\", "/")).lstrip("./")
        name = self._unique_name(name)
        content.open("rb")
        try:
            data = content.read()
        finally:
            content.close()

        content_type = getattr(content, "content_type", None) or mimetypes.guess_type(name)[0] or "application/octet-stream"
        headers = {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
            "Content-Type": content_type,
        }

        response = requests.post(
            self._build_object_url(name),
            headers=headers,
            params={"upsert": "true"},
            data=data,
            timeout=self.timeout,
        )
        if response.status_code not in {200, 201}:
            raise RuntimeError(f"Supabase upload failed: {response.status_code} {response.text}")
        return name

    def delete(self, name):
        headers = {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
        }
        response = requests.delete(self._build_object_url(name), headers=headers, timeout=self.timeout)
        if response.status_code not in {200, 202, 204}:
            raise RuntimeError(f"Supabase delete failed: {response.status_code} {response.text}")

    def exists(self, name):
        return False

    def url(self, name):
        return f"{self.public_url}/{name.lstrip('/')}"
