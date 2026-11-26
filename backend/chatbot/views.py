import logging
import time
from typing import Any

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUserRole
from chatbot.serializers import ChatEvaluationRequestSerializer, ChatRequestSerializer
from chatbot.services import (
    EDUCATION_ONLY_REPLY,
    ChatbotConfigError,
    ChatbotServiceError,
    build_chat_context,
    chatbot_model_name,
    create_inference_diagnostics,
    evaluate_chatbot_suite,
    finalize_llm_metrics,
    fallback_reply,
    format_chat_reply,
    generate_reply,
    is_greeting_query,
    is_disallowed_query,
    local_intent_reply,
    record_inference_duration,
)

logger = logging.getLogger(__name__)


def _include_inference_diagnostics(
    payload: dict[str, Any],
    diagnostics: dict[str, Any] | None,
    started: float,
) -> dict[str, Any]:
    if diagnostics is not None:
        record_inference_duration(diagnostics, "total_inference_ms", started)
        record_inference_duration(diagnostics, "total_request_ms", started)
        finalize_llm_metrics(diagnostics)
        payload["diagnostics"] = diagnostics
    return payload


class ChatbotMessageView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "chatbot"

    def post(self, request):
        started = time.perf_counter()
        diagnostics: dict[str, Any] | None = None
        if request.user.is_staff or request.user.is_superuser:
            configured_provider = str(getattr(settings, "CHATBOT_LLM_PROVIDER", "gemini")).strip().lower()
            diagnostics = create_inference_diagnostics(
                provider=configured_provider,
                model=chatbot_model_name(configured_provider),
            )
        query_started = time.perf_counter()
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        course_id = serializer.validated_data.get("course_id")
        history = serializer.validated_data.get("history", [])

        if is_greeting_query(message):
            record_inference_duration(diagnostics, "query_processing_ms", query_started)
            post_started = time.perf_counter()
            greeting = (
                "Hi, I support only education questions for AI, ML, DL, Data Science, "
                "Prompt Engineering, and Quantum courses. Ask your doubt with topic name and I will guide step-by-step."
            )
            payload = {
                "reply": greeting,
                "scope": "education_only",
                "provider": "policy",
                "model": "greeting",
                "course_access": "none",
                "sources": [],
                "retrieval_mode": "none",
                "retrieval_hits": 0,
                "latency_ms": max(int((time.perf_counter() - started) * 1000), 0),
            }
            record_inference_duration(diagnostics, "post_processing_ms", post_started)
            return Response(
                _include_inference_diagnostics(payload, diagnostics, started),
                status=status.HTTP_200_OK,
            )

        if is_disallowed_query(message):
            record_inference_duration(diagnostics, "query_processing_ms", query_started)
            post_started = time.perf_counter()
            payload = {
                "reply": EDUCATION_ONLY_REPLY,
                "scope": "education_only",
                "provider": "policy",
                "model": "guardrail",
                "course_access": "none",
                "sources": [],
                "retrieval_mode": "none",
                "retrieval_hits": 0,
                "latency_ms": max(int((time.perf_counter() - started) * 1000), 0),
            }
            record_inference_duration(diagnostics, "post_processing_ms", post_started)
            return Response(
                _include_inference_diagnostics(payload, diagnostics, started),
                status=status.HTTP_200_OK,
            )

        record_inference_duration(diagnostics, "query_processing_ms", query_started)
        context = build_chat_context(
            message=message,
            user=request.user,
            course_id=course_id,
            history=history,
            diagnostics=diagnostics,
        )

        try:
            local_reply = local_intent_reply(message=message, context=context)
            if local_reply:
                reply = local_reply
                provider = "policy"
                model = "intent_router"
                degraded = False
                if diagnostics is not None:
                    diagnostics["llm"].update(provider=provider, model=model, status="not_called")
            else:
                provider = str(getattr(settings, "CHATBOT_LLM_PROVIDER", "gemini")).strip().lower()
                model = chatbot_model_name(provider)
                llm_started = time.perf_counter()
                try:
                    reply = generate_reply(
                        message=message,
                        history=history,
                        context=context,
                        provider=provider,
                        diagnostics=diagnostics,
                    )
                finally:
                    record_inference_duration(diagnostics, "llm_generation_ms", llm_started)
                degraded = False
        except (ChatbotConfigError, ChatbotServiceError):
            reply = "I am currently experiencing connection issues with my AI service. Please try again later."
            provider = "fallback"
            model = "fallback"
            degraded = True
            if diagnostics is not None:
                diagnostics["llm"].update(status="error", fallback_used=True)
        except Exception:
            logger.exception("Unhandled chatbot error")
            reply = "I am currently experiencing connection issues with my AI service. Please try again later."
            provider = "fallback"
            model = "fallback"
            degraded = True
            if diagnostics is not None:
                diagnostics["llm"].update(status="error", fallback_used=True)

<<<<<<< Updated upstream
        return Response(
            {
                "reply": format_chat_reply(reply),
                "scope": "education_only",
                "provider": provider,
                "model": model,
                "course_access": context.course_access,
                "sources": context.sources,
                "retrieval_mode": context.retrieval_mode,
                "retrieval_hits": context.retrieval_hits,
                "latency_ms": max(int((time.perf_counter() - started) * 1000), 0),
                "degraded": degraded,
            },
=======
        post_started = time.perf_counter()
        formatted_reply = format_chat_reply(reply, context)
        is_refusal = (
            reply == EDUCATION_ONLY_REPLY
            or "I can help only with SIA education" in reply
            or "I support only education questions" in reply
            or "connection issues" in reply
            or "Please rephrase the question" in reply
        )

        payload = {
            "reply": formatted_reply,
            "scope": "education_only",
            "provider": provider,
            "model": model,
            "course_access": context.course_access,
            "sources": [] if is_refusal else context.sources,
            "retrieval_mode": context.retrieval_mode,
            "retrieval_hits": context.retrieval_hits,
            "latency_ms": max(int((time.perf_counter() - started) * 1000), 0),
            "degraded": degraded,
        }
        record_inference_duration(diagnostics, "post_processing_ms", post_started)
        return Response(
            _include_inference_diagnostics(payload, diagnostics, started),
>>>>>>> Stashed changes
            status=status.HTTP_200_OK,
        )


class ChatbotEvaluationView(APIView):
    permission_classes = [IsAdminUserRole]
    throttle_scope = "chatbot"

    def post(self, request):
        serializer = ChatEvaluationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider = serializer.validated_data["provider"]
        try:
            payload = evaluate_chatbot_suite(
                user=request.user,
                provider=provider,
                max_cases=serializer.validated_data["max_cases"],
            )
        except ChatbotConfigError as exc:
            logger.warning("Chatbot evaluation configuration error for %s: %s", provider, exc)
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ChatbotServiceError:
            logger.exception("Chatbot evaluation failed for provider %s", provider)
            return Response(
                {"detail": f"{provider.title()} evaluation failed. Check backend logs."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(payload, status=status.HTTP_200_OK)
