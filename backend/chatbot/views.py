import logging
import time

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
    evaluate_chatbot_suite,
    fallback_reply,
    format_chat_reply,
    generate_reply,
    is_greeting_query,
    is_disallowed_query,
    local_intent_reply,
)

logger = logging.getLogger(__name__)


class ChatbotMessageView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "chatbot"

    def post(self, request):
        started = time.perf_counter()
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        course_id = serializer.validated_data.get("course_id")
        history = serializer.validated_data.get("history", [])

        if is_greeting_query(message):
            greeting = (
                "Hi, I am SIA_Bot. I support only education questions for AI, ML, DL, Data Science, "
                "Prompt Engineering, and Quantum courses. Ask your doubt with topic name and I will guide step-by-step."
            )
            return Response(
                {
                    "reply": greeting,
                    "scope": "education_only",
                    "provider": "policy",
                    "model": "greeting",
                    "course_access": "none",
                    "sources": [],
                    "retrieval_mode": "none",
                    "retrieval_hits": 0,
                    "latency_ms": max(int((time.perf_counter() - started) * 1000), 0),
                },
                status=status.HTTP_200_OK,
            )

        if is_disallowed_query(message):
            return Response(
                {
                    "reply": EDUCATION_ONLY_REPLY,
                    "scope": "education_only",
                    "provider": "policy",
                    "model": "guardrail",
                    "course_access": "none",
                    "sources": [],
                    "retrieval_mode": "none",
                    "retrieval_hits": 0,
                    "latency_ms": max(int((time.perf_counter() - started) * 1000), 0),
                },
                status=status.HTTP_200_OK,
            )

        context = build_chat_context(
            message=message,
            user=request.user,
            course_id=course_id,
            history=history,
        )

        try:
            local_reply = local_intent_reply(message=message, context=context)
            if local_reply:
                reply = local_reply
                provider = "policy"
                model = "intent_router"
                degraded = False
            else:
                reply = generate_reply(message=message, history=history, context=context)
                provider = "groq"
                model = "configured"
                degraded = False
        except (ChatbotConfigError, ChatbotServiceError):
            reply = fallback_reply(message=message, context=context)
            provider = "fallback"
            model = "fallback"
            degraded = True
        except Exception:
            logger.exception("Unhandled chatbot error")
            reply = fallback_reply(message=message, context=context)
            provider = "fallback"
            model = "fallback"
            degraded = True

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
            status=status.HTTP_200_OK,
        )


class ChatbotEvaluationView(APIView):
    permission_classes = [IsAdminUserRole]
    throttle_scope = "chatbot"

    def post(self, request):
        serializer = ChatEvaluationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = evaluate_chatbot_suite(
            user=request.user,
            use_model=serializer.validated_data["use_model"],
            max_cases=serializer.validated_data["max_cases"],
        )
        return Response(payload, status=status.HTTP_200_OK)
