from unittest.mock import Mock, patch

from django.test import override_settings, SimpleTestCase
from django.core.cache import cache
from django.urls import reverse
from chatbot.llm_manager import GeminiKeyRotationManager
from chatbot import services as chatbot_services
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Category, Course, Enrollment
from chatbot.services import (
    ChatContext,
    ChatbotConfigError,
    build_chat_context,
    create_inference_diagnostics,
    evaluate_chatbot_suite,
)


class _MockGroqResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.text = str(payload)

    def json(self):
        return self._payload


class EmbeddingDeviceTests(SimpleTestCase):
    def test_model_uses_cpu_and_caches_it(self):
        cpu_model = Mock()
        with (
            patch.object(chatbot_services, "_embeddings_model", None),
            patch.object(chatbot_services, "_embeddings_device", None),
            patch.object(chatbot_services, "_create_embeddings_model", return_value=cpu_model) as create_model,
        ):
            self.assertIs(chatbot_services._get_embeddings_model(), cpu_model)
            self.assertIs(chatbot_services._get_embeddings_model(), cpu_model)

            create_model.assert_called_once_with()
            self.assertEqual(chatbot_services._embeddings_device, "cpu")


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

    def test_chat_diagnostics_are_restricted_to_admin_users(self):
        learner = User.objects.create_user(
            username="diagnostic_learner",
            email="diagnostic_learner@example.com",
            phone="7991000014",
            name="Diagnostic Learner",
            password="StrongPass123!",
        )
        self.client.force_authenticate(learner)
        learner_response = self.client.post(self.url, {"message": "hello"}, format="json")
        self.assertEqual(learner_response.status_code, status.HTTP_200_OK)
        self.assertNotIn("diagnostics", learner_response.data)

        admin = User.objects.create_user(
            username="diagnostic_admin",
            email="diagnostic_admin@example.com",
            phone="7991000015",
            name="Diagnostic Admin",
            password="StrongPass123!",
            is_staff=True,
        )
        self.client.force_authenticate(admin)
        admin_response = self.client.post(self.url, {"message": "hello"}, format="json")
        self.assertEqual(admin_response.status_code, status.HTTP_200_OK)
        self.assertIn("diagnostics", admin_response.data)
        self.assertIn("total_inference_ms", admin_response.data["diagnostics"]["latency_ms"])
        self.assertEqual(admin_response.data["diagnostics"]["llm"]["api_calls"], 0)

    def test_stream_endpoint_is_removed(self):
        response = self.client.post("/api/chatbot/message/stream/", {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @override_settings(CHATBOT_LLM_PROVIDER="groq")
    @patch("chatbot.views.build_chat_context")
    @patch("chatbot.views.generate_reply", return_value="A compatible JSON response.")
    def test_existing_json_message_endpoint_remains_available(self, mock_generate_reply, mock_context):
        learner = User.objects.create_user(
            username="json_compatibility_learner",
            email="json_compatibility_learner@example.com",
            phone="7991000020",
            name="JSON Compatibility Learner",
            password="StrongPass123!",
        )
        self.client.force_authenticate(learner)
        mock_context.return_value = ChatContext(
            course_access="none",
            focused_course_id=None,
            retrieval_mode="none",
            retrieval_hits=0,
            context_text="No context",
            sources=[],
        )

        response = self.client.post(
            self.url,
            {"message": "Explain gradient descent in machine learning"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reply"], "A compatible JSON response.")
        self.assertEqual(response.data["provider"], "groq")
        mock_generate_reply.assert_called_once()

    @patch("chatbot.views.generate_reply", side_effect=ChatbotConfigError("provider unavailable"))
    def test_admin_diagnostics_report_llm_fallback(self, mock_generate):
        admin = User.objects.create_user(
            username="diagnostic_fallback_admin",
            email="diagnostic_fallback_admin@example.com",
            phone="7991000017",
            name="Diagnostic Fallback Admin",
            password="StrongPass123!",
            is_staff=True,
        )
        self.client.force_authenticate(admin)

        response = self.client.post(
            self.url,
            {"message": "Explain gradient descent in machine learning"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["diagnostics"]["llm"]["fallback_used"])
        self.assertEqual(response.data["diagnostics"]["llm"]["status"], "error")
        self.assertEqual(response.data["provider"], "fallback")
        mock_generate.assert_called_once()

    @patch("chatbot.services._get_embeddings_model", return_value=None)
    def test_context_diagnostics_include_selected_lexical_chunks(self, mock_embeddings):
        admin = User.objects.create_user(
            username="diagnostic_retrieval_admin",
            email="diagnostic_retrieval_admin@example.com",
            phone="7991000016",
            name="Diagnostic Retrieval Admin",
            password="StrongPass123!",
            is_staff=True,
        )
        diagnostics = create_inference_diagnostics(provider="groq", model="test-model")

        context = build_chat_context(
            message="Applied Machine Learning curriculum and prerequisites",
            user=admin,
            course_id=None,
            diagnostics=diagnostics,
        )

        self.assertGreater(context.retrieval_hits, 0)
        self.assertEqual(diagnostics["retrieval"]["backend"], "lexical_bm25")
        self.assertEqual(len(diagnostics["retrieval"]["chunks"]), context.retrieval_hits)
        self.assertEqual(diagnostics["retrieval"]["chunks"][0]["rank"], 1)
        self.assertTrue(diagnostics["retrieval"]["chunks"][0]["chunk_id"])
        self.assertTrue(diagnostics["retrieval"]["chunks"][0]["source_document"])
        self.assertFalse(diagnostics["retrieval"]["chunks"][0]["passed_to_llm"])
        mock_embeddings.assert_not_called()

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

    @patch("chatbot.views.evaluate_chatbot_suite")
    def test_chatbot_evaluation_requires_admin(self, mock_evaluate):
        learner = User.objects.create_user(
            username="non_admin_eval",
            email="non_admin_eval@example.com",
            phone="7991000010",
            name="Learner Eval",
            password="StrongPass123!",
        )
        self.client.force_authenticate(learner)
        response = self.client.post(self.eval_url, {"provider": "gemini", "max_cases": 4}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_evaluate.assert_not_called()

    @patch("chatbot.views.evaluate_chatbot_suite")
    def test_chatbot_evaluation_runs_for_admin(self, mock_evaluate):
        admin = User.objects.create_user(
            username="admin_eval",
            email="admin_eval@example.com",
            phone="7991000011",
            name="Admin Eval",
            password="StrongPass123!",
            is_staff=True,
        )
        mock_evaluate.return_value = {
            "summary": {"total_cases": 4},
            "results": [{} for _ in range(4)],
        }
        self.client.force_authenticate(admin)
        response = self.client.post(self.eval_url, {"provider": "groq", "max_cases": 4}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("summary", response.data)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["summary"]["total_cases"], 4)
        self.assertTrue(len(response.data["results"]) == 4)
        mock_evaluate.assert_called_once_with(user=admin, provider="groq", max_cases=4)

    def test_chatbot_evaluation_rejects_non_online_provider(self):
        admin = User.objects.create_user(
            username="admin_eval_provider",
            email="admin_eval_provider@example.com",
            phone="7991000012",
            name="Admin Eval Provider",
            password="StrongPass123!",
            is_staff=True,
        )
        self.client.force_authenticate(admin)
        response = self.client.post(self.eval_url, {"provider": "local"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("chatbot.views.evaluate_chatbot_suite", side_effect=ChatbotConfigError("GROQ_API_KEY is not configured."))
    def test_chatbot_evaluation_surfaces_provider_configuration_error(self, mock_evaluate):
        admin = User.objects.create_user(
            username="admin_eval_config",
            email="admin_eval_config@example.com",
            phone="7991000013",
            name="Admin Eval Config",
            password="StrongPass123!",
            is_staff=True,
        )
        self.client.force_authenticate(admin)
        response = self.client.post(self.eval_url, {"provider": "groq"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["detail"], "GROQ_API_KEY is not configured.")
        mock_evaluate.assert_called_once()


class ChatbotEvaluationServiceTests(SimpleTestCase):
    @patch("chatbot.services.generate_reply", return_value="A structured answer about learning.")
    @patch("chatbot.services.build_chat_context")
    def test_evaluation_calls_the_selected_online_provider(self, mock_build_context, mock_generate):
        context = ChatContext(
            course_access="none",
            focused_course_id=None,
            retrieval_mode="none",
            retrieval_hits=0,
            context_text="No context",
            sources=[],
        )
        mock_build_context.return_value = context

        report = evaluate_chatbot_suite(user=None, provider="groq", max_cases=1)

        self.assertEqual(mock_generate.call_args.kwargs["message"], "Give me AI learning roadmap for beginners")
        self.assertEqual(mock_generate.call_args.kwargs["provider"], "groq")
        diagnostics = mock_generate.call_args.kwargs["diagnostics"]
        self.assertEqual(report["results"][0]["diagnostics"], diagnostics)
        self.assertGreater(diagnostics["latency_ms"]["query_processing_ms"], 0)
        self.assertEqual(report["summary"]["provider"], "groq")
        self.assertEqual(report["summary"]["evaluation_mode"], "groq_online")
        self.assertEqual(report["results"][0]["provider"], "groq")

    @patch("langchain_openai.ChatOpenAI")
    @override_settings(GROQ_API_KEY="test-groq-key", GROQ_CHAT_MODEL="test-groq-model")
    def test_generate_reply_records_call_latency_and_token_usage(self, mock_chat_openai):
        from unittest.mock import MagicMock
        from langchain_core.messages import AIMessage
        from chatbot.services import generate_reply

        mock_model = MagicMock()
        mock_model.invoke.return_value = AIMessage(
            content="Grounded answer.",
            usage_metadata={"input_tokens": 12, "output_tokens": 7, "total_tokens": 19},
        )
        mock_chat_openai.return_value = mock_model

        context = ChatContext(
            course_access="none",
            focused_course_id=None,
            retrieval_mode="none",
            retrieval_hits=0,
            context_text="No context",
            sources=[],
        )
        diagnostics = create_inference_diagnostics(provider="groq", model="test-groq-model")
        diagnostics["retrieval"]["chunks"].append(
            {
                "chunk_id": "test-chunk",
                "passed_to_llm": False,
            }
        )

        reply = generate_reply("Explain a course topic", [], context, provider="groq", diagnostics=diagnostics)

        self.assertEqual(reply, "Grounded answer.")
        self.assertEqual(diagnostics["llm"]["api_calls"], 1)
        self.assertEqual(diagnostics["llm"]["status"], "success")
        self.assertEqual(diagnostics["llm"]["retry_count"], 0)
        self.assertEqual(diagnostics["llm"]["token_usage"]["total_tokens"], 19)
        self.assertGreaterEqual(diagnostics["llm"]["calls"][0]["latency_ms"], 0)
        self.assertTrue(diagnostics["retrieval"]["chunks"][0]["passed_to_llm"])

class GeminiKeyRotationTests(SimpleTestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    @override_settings(GEMINI_API_KEYS=["key_A", "key_B", "key_C"])
    def test_key_rotation_manager_flow(self):
        # 1. Get initial available key
        key, idx = GeminiKeyRotationManager.get_next_available_key()
        self.assertEqual(key, "key_A")
        self.assertEqual(idx, 0)

        # 2. Mark active key (key_A) as rate limited
        GeminiKeyRotationManager.mark_key_rate_limited("key_A")
        self.assertTrue(GeminiKeyRotationManager.is_key_rate_limited("key_A"))

        # 3. Next available key should bypass key_A and go to key_B
        key, idx = GeminiKeyRotationManager.get_next_available_key()
        self.assertEqual(key, "key_B")
        self.assertEqual(idx, 1)

        # 4. Mark key_B as rate limited
        GeminiKeyRotationManager.mark_key_rate_limited("key_B")
        self.assertTrue(GeminiKeyRotationManager.is_key_rate_limited("key_B"))

        # 5. Next available key should go to key_C
        key, idx = GeminiKeyRotationManager.get_next_available_key()
        self.assertEqual(key, "key_C")
        self.assertEqual(idx, 2)

    @patch("langchain_google_genai.ChatGoogleGenerativeAI")
    @override_settings(
        CHATBOT_LLM_PROVIDER="gemini",
        GEMINI_API_KEYS=["key_1", "key_2"],
        GEMINI_MODEL_NAME="gemini-3.5-flash",
    )
    def test_generate_reply_rotates_on_rate_limit(self, mock_chat_openai):
        from unittest.mock import MagicMock
        from chatbot.services import generate_reply, ChatContext

        mock_instance = MagicMock()
        mock_chat_openai.return_value = mock_instance

        class MockRateLimitError(Exception):
            pass

        # Mocking the invoke call: first raises rate limit exception, second succeeds
        from langchain_core.messages import AIMessage

        mock_instance.invoke.side_effect = [
            MockRateLimitError("429 Rate limit exceeded"),
            AIMessage(content="Success reply"),
        ]

        context = ChatContext(
            course_access="none",
            focused_course_id=None,
            retrieval_mode="none",
            retrieval_hits=0,
            context_text="No context",
            sources=[]
        )

        reply = generate_reply("hello", [], context)
        self.assertEqual(reply, "Success reply")
        # Check that ChatGoogleGenerativeAI was instantiated twice (once for key_1, once for key_2)
        self.assertEqual(mock_chat_openai.call_count, 2)
        self.assertTrue(all(call.kwargs["retries"] == 0 for call in mock_chat_openai.call_args_list))

