from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Category, Course, Enrollment
from chatbot.services import build_chat_context


class _MockGroqResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.text = str(payload)

    def json(self):
        return self._payload


class ChatbotApiTests(APITestCase):
    def setUp(self):
        self.url = reverse("chatbot-message")
        self.eval_url = reverse("chatbot-evaluate")
        self.category = Category.objects.create(name="AI Core", description="AI Core")
        self.course = Course.objects.create(
            category=self.category,
            title="Applied Machine Learning",
            short_description="Learn practical ML for production systems.",
            description="Detailed curriculum for supervised and unsupervised workflows.",
            duration_days=28,
            price="120.00",
            discount_percent="20.00",
            is_active=True,
        )

    @patch("chatbot.services.requests.post")
    def test_rejects_non_education_query_without_external_call(self, mock_post):
        response = self.client.post(self.url, {"message": "Tell me weather and cricket score"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["provider"], "policy")
        self.assertEqual(response.data["scope"], "education_only")
        mock_post.assert_not_called()

    @patch("chatbot.services.requests.post")
    def test_greeting_returns_policy_greeting_without_external_call(self, mock_post):
        response = self.client.post(self.url, {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["provider"], "policy")
        self.assertEqual(response.data["model"], "greeting")
        self.assertIn("education", response.data["reply"])
        mock_post.assert_not_called()

    @patch("chatbot.services.requests.post")
    @override_settings(GROQ_API_KEY="gsk_test_key")
    def test_education_query_uses_groq_and_returns_reply(self, mock_post):
        mock_post.return_value = _MockGroqResponse(
            {
                "choices": [
                    {
                        "message": {
                            "content": "Start with Statistics, then move to supervised ML and model evaluation."
                        }
                    }
                ]
            }
        )

        response = self.client.post(
            self.url,
            {
                "message": "How should I start machine learning?",
                "history": [{"role": "user", "content": "I am a beginner in AI."}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["provider"], "groq")
        self.assertIn("Statistics", response.data["reply"])

    @patch("chatbot.services.requests.post")
    @override_settings(GROQ_API_KEY="gsk_test_key")
    def test_career_query_uses_local_intent_without_external_call(self, mock_post):
        response = self.client.post(
            self.url,
            {"message": "career path for data science and how improve"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["provider"], "policy")
        self.assertIn("Career Path", response.data["reply"])
        mock_post.assert_not_called()

    @patch("chatbot.services.requests.post")
    @override_settings(GROQ_API_KEY="gsk_test_key")
    def test_course_access_public_for_non_purchased_user(self, mock_post):
        learner = User.objects.create_user(
            username="learner_public_chat",
            email="learner_public_chat@example.com",
            phone="7991000001",
            name="Public Learner",
            password="StrongPass123!",
        )
        self.client.force_authenticate(learner)
        mock_post.return_value = _MockGroqResponse(
            {"choices": [{"message": {"content": "You can review the public syllabus and overview first."}}]}
        )

        response = self.client.post(
            self.url,
            {"message": "Explain this course", "course_id": self.course.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["course_access"], "public")

    @patch("chatbot.services.requests.post")
    @override_settings(GROQ_API_KEY="gsk_test_key")
    def test_course_access_full_for_purchased_user(self, mock_post):
        learner = User.objects.create_user(
            username="learner_full_chat",
            email="learner_full_chat@example.com",
            phone="7991000002",
            name="Purchased Learner",
            password="StrongPass123!",
        )
        Enrollment.objects.create(
            user=learner,
            course=self.course,
            payment_status="success",
            status="enrolled",
            is_deleted=False,
        )
        self.client.force_authenticate(learner)
        mock_post.return_value = _MockGroqResponse(
            {"choices": [{"message": {"content": "Module 1 covers data prep and feature engineering."}}]}
        )

        response = self.client.post(
            self.url,
            {"message": "What will I learn in this purchased course?", "course_id": self.course.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["course_access"], "full")

    def test_build_context_uses_history_course_ids_for_follow_up_queries(self):
        course_two = Course.objects.create(
            category=self.category,
            title="Data Visualization and Storytelling",
            short_description="Communicate analytical insights effectively.",
            description="Charts, narratives, and executive storytelling practice.",
            duration_days=21,
            price="99.00",
            discount_percent="15.00",
            is_active=True,
        )
        history = [
            {
                "role": "assistant",
                "content": (
                    f"You can begin with Course #{self.course.id} and Course #{course_two.id}.\n"
                    f"Sources: course:{self.course.id}, course:{course_two.id}"
                ),
            }
        ]

        context = build_chat_context(
            message="on this how the career and what details",
            user=None,
            course_id=None,
            history=history,
        )
        self.assertIn(f"course:{self.course.id}", context.sources)
        self.assertIn(f"course:{course_two.id}", context.sources)
        self.assertIn("Course:", context.context_text)

    @patch("chatbot.services.requests.post")
    def test_history_payload_accepts_long_content_without_400(self, mock_post):
        response = self.client.post(
            self.url,
            {
                "message": "help with data science roadmap",
                "history": [
                    {"role": "assistant", "content": "a" * 2000},
                    {"role": "user", "content": "b" * 1800},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_post.assert_not_called()

    @patch("chatbot.services.requests.post")
    @override_settings(GROQ_API_KEY="gsk_test_key")
    def test_message_response_contains_retrieval_metadata(self, mock_post):
        mock_post.return_value = _MockGroqResponse(
            {
                "choices": [
                    {
                        "message": {
                            "content": "You can start with Python foundations and then proceed to supervised learning."
                        }
                    }
                ]
            }
        )
        response = self.client.post(self.url, {"message": "How to start machine learning?"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("retrieval_mode", response.data)
        self.assertIn("retrieval_hits", response.data)
        self.assertIn("latency_ms", response.data)
        self.assertEqual(response.data["retrieval_mode"], "lexical_bm25_rag")
        self.assertGreaterEqual(response.data["retrieval_hits"], 1)

    @patch("chatbot.services.requests.post")
    def test_chatbot_evaluation_requires_admin(self, mock_post):
        learner = User.objects.create_user(
            username="non_admin_eval",
            email="non_admin_eval@example.com",
            phone="7991000010",
            name="Learner Eval",
            password="StrongPass123!",
        )
        self.client.force_authenticate(learner)
        response = self.client.post(self.eval_url, {"use_model": False, "max_cases": 4}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_post.assert_not_called()

    @patch("chatbot.services.requests.post")
    def test_chatbot_evaluation_runs_for_admin(self, mock_post):
        admin = User.objects.create_user(
            username="admin_eval",
            email="admin_eval@example.com",
            phone="7991000011",
            name="Admin Eval",
            password="StrongPass123!",
            is_staff=True,
        )
        self.client.force_authenticate(admin)
        response = self.client.post(self.eval_url, {"use_model": False, "max_cases": 4}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("summary", response.data)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["summary"]["total_cases"], 4)
        self.assertTrue(len(response.data["results"]) == 4)
        mock_post.assert_not_called()
