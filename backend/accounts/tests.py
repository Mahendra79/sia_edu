from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import EmailVerificationToken, User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthVerificationFlowTests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("signup")
        self.login_url = reverse("login")
        self.verify_email_url = reverse("verify-email")
        self.resend_verification_url = reverse("resend-verification")
        self.password_reset_request_url = reverse("password-reset-request")

    def _create_user(
        self,
        username: str,
        email: str,
        phone: str,
        password: str = "StrongPass123!",
        is_email_verified: bool = False,
    ):
        return User.objects.create_user(
            username=username,
            email=email,
            phone=phone,
            name="Test User",
            password=password,
            is_email_verified=is_email_verified,
        )

    def test_login_allows_unverified_email(self):
        user = self._create_user("unverified", "unverified@example.com", "1000000000", is_email_verified=False)

        response = self.client.post(
            self.login_url,
            {"username": user.username, "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["id"], user.id)

    def test_login_allows_verified_email(self):
        user = self._create_user("verified", "verified@example.com", "1000000001", is_email_verified=True)

        response = self.client.post(
            self.login_url,
            {"username": user.email, "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["id"], user.id)

    def test_signup_issues_tokens_for_new_user(self):
        response = self.client.post(
            self.signup_url,
            {
                "name": "Signup User",
                "username": "signup_user",
                "email": "signup@example.com",
                "phone": "1000000002",
                "password": "StrongPass123!",
                "confirm_password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "signup@example.com")

        user = User.objects.get(email="signup@example.com")
        self.assertFalse(user.is_email_verified)
        self.assertEqual(EmailVerificationToken.objects.filter(user=user, is_used=False).count(), 1)
        self.assertTrue(response.data["requires_email_verification"])
        self.assertEqual(response.data["verification_email"], "signup@example.com")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("verification code", mail.outbox[0].subject.lower())
        self.assertEqual(len(mail.outbox[0].alternatives), 1)
        self.assertIn("text/html", mail.outbox[0].alternatives[0][1])
        self.assertIn("Verification Code", mail.outbox[0].alternatives[0][0])
        self.assertNotIn("Use OTP", mail.outbox[0].alternatives[0][0])

    def test_signup_existing_user_with_matching_password_logs_in(self):
        user = self._create_user("existing_user", "existing@example.com", "1000000003", is_email_verified=False)

        response = self.client.post(
            self.signup_url,
            {
                "name": "Existing User",
                "username": "existing_user",
                "email": "existing@example.com",
                "phone": "1000000003",
                "password": "StrongPass123!",
                "confirm_password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["id"], user.id)
        self.assertTrue(response.data["requires_email_verification"])
        self.assertEqual(EmailVerificationToken.objects.filter(user=user, is_used=False).count(), 1)

    def test_login_unverified_user_issues_verification_token(self):
        user = self._create_user("needsverify", "needsverify@example.com", "1000000004", is_email_verified=False)
        self.assertEqual(EmailVerificationToken.objects.filter(user=user).count(), 0)

        response = self.client.post(
            self.login_url,
            {"username": user.username, "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["requires_email_verification"])
        self.assertEqual(response.data["verification_email"], user.email)
        self.assertEqual(EmailVerificationToken.objects.filter(user=user, is_used=False).count(), 1)

    def test_resend_verification_issues_token_for_existing_user(self):
        user = self._create_user("resenduser", "resend@example.com", "1000000005", is_email_verified=False)
        response = self.client.post(self.resend_verification_url, {"email": user.email}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EmailVerificationToken.objects.filter(user=user, is_used=False).count(), 1)

    def test_verify_email_marks_user_verified(self):
        user = self._create_user("verifyuser", "verify@example.com", "1000000006", is_email_verified=False)
        token = EmailVerificationToken.issue_for_user(user)

        response = self.client.post(
            self.verify_email_url,
            {"email": user.email, "otp_code": token.otp_code},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        token.refresh_from_db()
        self.assertTrue(user.is_email_verified)
        self.assertTrue(token.is_used)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("registration successful", mail.outbox[0].subject.lower())
        self.assertEqual(len(mail.outbox[0].alternatives), 1)
        self.assertIn("Registration Successful", mail.outbox[0].alternatives[0][0])

    def test_password_reset_request_sends_verification_code_html_email(self):
        user = self._create_user("resetuser", "reset@example.com", "1000000007", is_email_verified=True)
        response = self.client.post(
            self.password_reset_request_url,
            {"email": user.email},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("password reset verification code", mail.outbox[0].subject.lower())
        self.assertEqual(len(mail.outbox[0].alternatives), 1)
        self.assertIn("Verification Code", mail.outbox[0].alternatives[0][0])

    def test_signup_rejects_invalid_username_characters(self):
        response = self.client.post(
            self.signup_url,
            {
                "name": "Invalid Username",
                "username": "bad*name",
                "email": "invalid-username@example.com",
                "phone": "1000000999",
                "password": "StrongPass123!",
                "confirm_password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertEqual(
            response.data["username"][0],
            "Username can only contain letters, numbers, and @/./+/-/_ characters.",
        )

    def test_signup_preflight_allows_render_frontend_origin(self):
        response = self.client.options(
            self.signup_url,
            HTTP_ORIGIN="https://siasoftwareinnovationseducation.onrender.com",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.get("Access-Control-Allow-Origin"),
            "https://siasoftwareinnovationseducation.onrender.com",
        )


class ProfileValidationTests(APITestCase):
    def setUp(self):
        self.profile_url = reverse("profile")
        self.user = User.objects.create_user(
            username="primary_user",
            email="primary@example.com",
            phone="1000001000",
            name="Primary User",
            password="StrongPass123!",
            is_email_verified=True,
        )
        self.other_user = User.objects.create_user(
            username="taken_user",
            email="taken@example.com",
            phone="1000001001",
            name="Taken User",
            password="StrongPass123!",
            is_email_verified=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_profile_update_rejects_existing_username(self):
        response = self.client.patch(
            self.profile_url,
            {"username": self.other_user.username},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertEqual(response.data["username"][0], "Username already exists.")

    def test_profile_update_rejects_invalid_username_characters(self):
        response = self.client.patch(
            self.profile_url,
            {"username": "bad*name"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertEqual(
            response.data["username"][0],
            "Username can only contain letters, numbers, and @/./+/-/_ characters.",
        )

