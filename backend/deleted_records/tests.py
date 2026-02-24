import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Category, Course
from deleted_records.models import DeletedRecord
from deleted_records.services import REDACTED_VALUE, record_soft_delete


TEST_MEDIA_ROOT = tempfile.mkdtemp(prefix="deleted-records-tests-")


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class DeletedRecordsSecurityTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="deleted_admin",
            email="deleted_admin@example.com",
            phone="7333333333",
            name="Deleted Admin",
            password="StrongPass123!",
            is_staff=True,
        )
        self.target_user = User.objects.create_user(
            username="target_user",
            email="target_user@example.com",
            phone="7333333334",
            name="Target User",
            password="StrongPass123!",
        )
        self.deleted_records_url = reverse("deleted-records-list")
        self.test_category = Category.objects.create(name="Test Category", description="Category for tests")

    def test_record_soft_delete_redacts_sensitive_user_fields(self):
        record = record_soft_delete(self.target_user, deleted_by=self.admin_user, reason="test_redaction")

        self.assertEqual(record.serialized_data["password"], REDACTED_VALUE)
        self.assertEqual(record.serialized_data["email"], "target_user@example.com")
        self.assertEqual(record.serialized_data["id"], self.target_user.id)

    def test_deleted_records_api_masks_sensitive_payload_values(self):
        DeletedRecord.objects.create(
            model_name="SecurityEvent",
            record_id="abc123",
            serialized_data={
                "email": "audit@example.com",
                "password": "plaintext",
                "nested": {"refresh_token": "xyz", "safe_field": "kept"},
            },
            reason="manual_test",
            deleted_by=self.admin_user,
        )

        self.client.force_authenticate(self.admin_user)
        response = self.client.get(self.deleted_records_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data["results"][0]["serialized_data"]
        self.assertEqual(payload["password"], REDACTED_VALUE)
        self.assertEqual(payload["nested"]["refresh_token"], REDACTED_VALUE)
        self.assertEqual(payload["nested"]["safe_field"], "kept")

    def test_record_soft_delete_serializes_image_field_value(self):
        course = Course.objects.create(
            category=self.test_category,
            title="Image Course",
            short_description="Image course",
            description="Course with image",
            price="49.00",
            image=SimpleUploadedFile("course.png", b"fake-image-bytes", content_type="image/png"),
        )

        record = record_soft_delete(course, deleted_by=self.admin_user, reason="course_with_image")
        self.assertIn("image", record.serialized_data)
        self.assertIsInstance(record.serialized_data["image"], str)
        self.assertTrue(record.serialized_data["image"].startswith("courses/images/"))

