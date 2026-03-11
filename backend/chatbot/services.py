from __future__ import annotations

import math
import logging
import re
import time
from collections import Counter
from dataclasses import dataclass
from decimal import Decimal

import requests
from django.core.cache import cache
from django.conf import settings
from django.db.models import Count, Max, Q

from courses.models import Course, Enrollment


logger = logging.getLogger(__name__)

CHATBOT_RAG_CACHE_PREFIX = "chatbot:rag:v2"

EDUCATION_ONLY_REPLY = (
    "I can help only with SIA education and course-related questions in AI, ML, DL, Data Science, "
    "Prompt Engineering, and Quantum learning tracks."
)

EDUCATION_HINTS = (
    "course",
    "learn",
    "study",
    "syllabus",
    "curriculum",
    "lesson",
    "module",
    "assignment",
    "project",
    "enroll",
    "billing",
    "payment",
    "certificate",
    "duration",
    "topic",
    "doubt",
    "ai",
    "ml",
    "dl",
    "machine learning",
    "deep learning",
    "data science",
    "prompt",
    "llm",
    "quantum",
)

OFF_TOPIC_HINTS = (
    "weather",
    "cricket",
    "football",
    "stocks",
    "bitcoin",
    "crypto price",
    "politics",
    "election",
    "movie",
    "song",
    "recipe",
    "dating",
    "lottery",
    "betting",
    "casino",
)

GREETING_PHRASES = {
    "hi",
    "hii",
    "hello",
    "hey",
    "heyy",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste",
}

STOP_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "these",
    "those",
    "what",
    "how",
    "why",
    "where",
    "when",
    "which",
    "who",
    "whom",
    "whose",
    "about",
    "into",
    "onto",
    "over",
    "under",
    "your",
    "our",
    "there",
    "their",
    "them",
    "then",
    "than",
    "have",
    "has",
    "had",
    "will",
    "would",
    "should",
    "can",
    "could",
    "on",
    "in",
    "at",
    "to",
    "of",
    "is",
    "are",
    "was",
    "were",
    "it",
    "you",
    "we",
    "i",
    "me",
    "my",
}

FOLLOW_UP_PHRASES = (
    "on this",
    "about this",
    "for this",
    "this course",
    "that course",
    "about that",
    "on that",
    "for that",
)

CAREER_HINTS = (
    "career",
    "job",
    "role",
    "salary",
    "growth",
    "future",
    "roadmap",
    "improve",
    "improvement",
)

PRICING_HINTS = ("price", "pricing", "discount", "billing", "payment", "cost", "fees", "fee")
REQUIREMENTS_HINTS = ("requirement", "prerequisite", "need before", "eligibility", "beginner")


class ChatbotConfigError(RuntimeError):
    pass


class ChatbotServiceError(RuntimeError):
    pass


@dataclass
class ChatContext:
    context_text: str
    sources: list[str]
    course_access: str
    focused_course_id: int | None
    retrieval_mode: str = "keyword_rag"
    retrieval_hits: int = 0


@dataclass(frozen=True)
class ChatEvaluationCase:
    case_id: str
    prompt: str
    expected_keywords: tuple[str, ...]
    course_id: int | None = None


DEFAULT_EVAL_CASES: tuple[ChatEvaluationCase, ...] = (
    ChatEvaluationCase(
        case_id="roadmap-ai",
        prompt="Give me AI learning roadmap for beginners",
        expected_keywords=("roadmap", "foundation", "projects", "skills"),
    ),
    ChatEvaluationCase(
        case_id="pricing-help",
        prompt="How do discounts and billing work for courses?",
        expected_keywords=("pricing", "discount", "billing"),
    ),
    ChatEvaluationCase(
        case_id="career-guidance",
        prompt="career path for machine learning and how improve",
        expected_keywords=("career", "skills", "projects"),
    ),
    ChatEvaluationCase(
        case_id="requirements",
        prompt="What are prerequisites for deep learning courses?",
        expected_keywords=("prerequisite", "python", "math", "requirement"),
    ),
    ChatEvaluationCase(
        case_id="quantum-path",
        prompt="best starting path for quantum computing in this platform",
        expected_keywords=("quantum", "beginner", "projects", "path"),
    ),
)


def _normalize_query(text: str) -> str:
    return text.strip().lower()


def is_disallowed_query(text: str) -> bool:
    normalized = _normalize_query(text)
    has_offtopic = any(token in normalized for token in OFF_TOPIC_HINTS)
    has_education = any(token in normalized for token in EDUCATION_HINTS)
    return has_offtopic and not has_education


def is_greeting_query(text: str) -> bool:
    normalized = _normalize_query(text)
    sanitized = re.sub(r"[^a-z\s]", " ", normalized)
    cleaned = " ".join(sanitized.split())
    if cleaned in GREETING_PHRASES:
        return True
    tokens = cleaned.split()
    return len(tokens) <= 3 and bool(tokens) and tokens[0] in {"hi", "hii", "hello", "hey", "namaste"}


def _extract_terms(message: str) -> list[str]:
    terms = re.findall(r"[a-zA-Z0-9\-\+]{3,}", message.lower())
    deduped = []
    seen = set()
    for term in terms:
        if term in STOP_WORDS:
            continue
        if term in seen:
            continue
        seen.add(term)
        deduped.append(term)
    return deduped[:8]


def _extract_course_ids_from_history(history: list[dict] | None) -> list[int]:
    if not history:
        return []

    ids: list[int] = []
    seen: set[int] = set()
    for item in history[-8:]:
        content = str(item.get("content", "")).lower()
        if not content:
            continue
        matches = re.findall(r"(?:course\s*#\s*|course\s*:\s*|course:\s*|#)(\d+)", content)
        for raw in matches:
            try:
                course_id = int(raw)
            except (TypeError, ValueError):
                continue
            if course_id <= 0 or course_id in seen:
                continue
            seen.add(course_id)
            ids.append(course_id)
    return ids


def _is_follow_up_reference(message: str) -> bool:
    normalized = _normalize_query(message)
    if any(phrase in normalized for phrase in FOLLOW_UP_PHRASES):
        return True
    tokens = set(re.findall(r"[a-zA-Z]+", normalized))
    return bool(tokens & {"this", "that", "it", "these", "those"})


def _extract_course_ids_from_sources(sources: list[str]) -> list[int]:
    ids: list[int] = []
    seen: set[int] = set()
    for source in sources:
        match = re.search(r"course:(\d+)", str(source).lower())
        if not match:
            continue
        course_id = int(match.group(1))
        if course_id in seen:
            continue
        seen.add(course_id)
        ids.append(course_id)
    return ids


def _courses_from_source_ids(source_ids: list[int]) -> list[Course]:
    if not source_ids:
        return []
    by_id = {
        course.id: course
        for course in Course.objects.select_related("category").filter(id__in=source_ids, is_deleted=False, is_active=True)
    }
    ordered = [by_id[item_id] for item_id in source_ids if item_id in by_id]
    return ordered


def _courses_from_message_topic(normalized_message: str, limit: int = 6) -> list[Course]:
    queryset = Course.objects.select_related("category").filter(is_deleted=False, is_active=True).order_by("-created_at")

    if "data science" in normalized_message:
        return list(
            queryset.filter(
                Q(category__name__icontains="data science")
                | Q(title__icontains="data science")
                | Q(title__icontains="analytics")
                | Q(description__icontains="data science")
            )[:limit]
        )
    if "machine learning" in normalized_message or " ml " in f" {normalized_message} ":
        return list(
            queryset.filter(
                Q(title__icontains="machine learning")
                | Q(title__icontains="ml")
                | Q(description__icontains="machine learning")
            )[:limit]
        )
    if "deep learning" in normalized_message or " dl " in f" {normalized_message} ":
        return list(
            queryset.filter(
                Q(title__icontains="deep learning")
                | Q(title__icontains="dl")
                | Q(description__icontains="deep learning")
            )[:limit]
        )
    if "prompt" in normalized_message or "llm" in normalized_message:
        return list(
            queryset.filter(
                Q(title__icontains="prompt")
                | Q(title__icontains="llm")
                | Q(description__icontains="prompt")
            )[:limit]
        )
    if "quantum" in normalized_message:
        return list(queryset.filter(Q(title__icontains="quantum") | Q(description__icontains="quantum"))[:limit])

    return list(queryset[:limit])


def _detect_track_name(normalized_message: str, courses: list[Course]) -> str:
    if "data science" in normalized_message:
        return "Data Science"
    if "machine learning" in normalized_message or " ml " in f" {normalized_message} ":
        return "Machine Learning"
    if "deep learning" in normalized_message or " dl " in f" {normalized_message} ":
        return "Deep Learning"
    if "prompt" in normalized_message or "llm" in normalized_message:
        return "Prompt Engineering and LLM Systems"
    if "quantum" in normalized_message:
        return "Quantum Computing"

    combined = " ".join(
        f"{course.title} {course.category.name}" for course in courses[:3]
    ).lower()
    if "data science" in combined:
        return "Data Science"
    if "machine learning" in combined or "ml" in combined:
        return "Machine Learning"
    if "deep learning" in combined or "dl" in combined:
        return "Deep Learning"
    if "prompt" in combined or "llm" in combined:
        return "Prompt Engineering and LLM Systems"
    if "quantum" in combined:
        return "Quantum Computing"
    return "AI and Data"


def _build_career_reply(normalized_message: str, courses: list[Course]) -> str:
    track = _detect_track_name(normalized_message, courses)
    lines = [f"**Career Path: {track}**"]

    lines.append("1. **Foundation (Weeks 1-6):** Build math, Python, and core concepts.")
    lines.append("2. **Applied Skills (Weeks 7-14):** Work on guided projects and model evaluation.")
    lines.append("3. **Portfolio (Weeks 15-20):** Publish 2-3 projects with clear business use-cases.")
    lines.append("4. **Interview Readiness (Weeks 21+):** Practice case-based questions and system thinking.")
    lines.append("")
    lines.append("**How To Improve Faster**")
    lines.append("- Spend at least 90 minutes daily on hands-on implementation.")
    lines.append("- Keep one learning journal: mistakes, fixes, and key formulas.")
    lines.append("- Rebuild one project from scratch without watching the solution.")
    lines.append("")
    lines.append("**Recommended SIA Courses**")
    for course in courses[:5]:
        lines.append(f"- **{course.title}**")
    return "\n".join(lines)


def local_intent_reply(message: str, context: ChatContext) -> str | None:
    normalized = _normalize_query(message)
    source_ids = _extract_course_ids_from_sources(context.sources)
    courses = _courses_from_source_ids(source_ids)

    if not courses:
        courses = _courses_from_message_topic(normalized, limit=6)

    asks_career = any(token in normalized for token in CAREER_HINTS)

    if asks_career:
        return _build_career_reply(normalized, courses)

    return None


def _format_money(value: Decimal) -> str:
    return f"${value.quantize(Decimal('0.01'))}"


def _discounted_price(course: Course) -> Decimal:
    discount = Decimal(course.discount_percent or 0) / Decimal("100")
    price = Decimal(course.price)
    discounted = price * (Decimal("1.00") - discount)
    if discounted < Decimal("0.00"):
        return Decimal("0.00")
    return discounted


def _resolve_access(user, course: Course) -> str:
    if not user or not user.is_authenticated or getattr(user, "is_deleted", False):
        return "public"
    if user.is_staff or user.is_superuser:
        return "full"
    has_purchase = Enrollment.objects.filter(
        user=user,
        course=course,
        payment_status="success",
        is_deleted=False,
    ).exists()
    return "full" if has_purchase else "public"


def _serialize_course(course: Course, include_private: bool) -> str:
    discounted = _discounted_price(course)
    summary = (
        f"[Course] {course.title}\n"
        f"- Category: {course.category.name}\n"
        f"- Duration: {course.duration_days} days\n"
        f"- Price: {_format_money(course.price)} (Discount {course.discount_percent}% -> {_format_money(discounted)})\n"
        f"- Public summary: {(course.short_description or '').strip()[:220]}"
    )
    if include_private:
        return (
            f"{summary}\n"
            f"- Learning description: {(course.description or '').strip()[:900]}"
        )
    return summary


def _tokenize_for_retrieval(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z0-9\-\+]{3,}", str(text or "").lower())
    deduped: list[str] = []
    seen: set[str] = set()
    for token in tokens:
        if token in STOP_WORDS or token in seen:
            continue
        seen.add(token)
        deduped.append(token)
    return deduped[:24]


def _split_sentences(text: str, limit: int = 4) -> list[str]:
    chunks = [item.strip() for item in re.split(r"(?<=[.!?])\s+", str(text or "").strip()) if item.strip()]
    return chunks[:limit]


def _derive_curriculum_lines(course: Course) -> list[str]:
    title_hint = str(course.title or "")
    desc_sentences = _split_sentences(course.description, limit=4)
    if desc_sentences:
        return desc_sentences

    return [
        f"Module 1: Foundations required for {title_hint}.",
        "Module 2: Guided implementation and practice problems.",
        "Module 3: Applied project and evaluation workflow.",
        "Module 4: Portfolio refinement and interview preparation.",
    ]


def _build_public_chunk_text(course: Course, section: str) -> str:
    discounted = _discounted_price(course)
    summary = (course.short_description or "").strip()[:280]
    category_name = course.category.name

    if section == "overview":
        return (
            f"Course: {course.title}\n"
            f"Category: {category_name}\n"
            f"Duration: {course.duration_days} days\n"
            f"Summary: {summary}"
        )
    if section == "pricing":
        return (
            f"Course: {course.title}\n"
            f"List Price: {_format_money(course.price)}\n"
            f"Discount: {course.discount_percent}%\n"
            f"Discounted Price: {_format_money(discounted)}\n"
            "Billing Note: Final payable amount is confirmed at checkout."
        )
    if section == "curriculum":
        module_lines = [f"- {line}" for line in _derive_curriculum_lines(course)]
        return "\n".join(
            [
                f"Course: {course.title}",
                "Curriculum Snapshot:",
                *module_lines,
            ]
        )
    if section == "requirements":
        return "\n".join(
            [
                f"Course: {course.title}",
                "Requirements:",
                "- Basic Python and problem-solving familiarity.",
                "- Interest in AI/ML concepts and hands-on practice.",
                "- 6-8 hours per week for assignments and project work.",
            ]
        )
    return _serialize_course(course, include_private=False)


def _build_private_chunk_text(course: Course) -> str:
    desc = (course.description or "").strip()
    return "\n".join(
        [
            f"Course: {course.title}",
            f"Detailed Learning Content: {desc[:1300]}",
        ]
    )


def _build_course_chunk(course: Course, section: str, visibility: str, text: str) -> dict:
    terms = _tokenize_for_retrieval(text)
    term_freq = Counter(terms)
    return {
        "chunk_key": f"{course.id}:{visibility}:{section}",
        "course_id": course.id,
        "course_title": course.title,
        "category_name": course.category.name,
        "section": section,
        "visibility": visibility,
        "text": text,
        "term_freq": dict(term_freq),
        "length": max(len(terms), 1),
        "created_at_ts": int(course.created_at.timestamp()) if course.created_at else 0,
    }


def _build_retrieval_corpus() -> dict:
    courses = list(
        Course.objects.select_related("category")
        .filter(is_deleted=False, is_active=True)
        .order_by("-created_at")
    )
    chunks: list[dict] = []
    doc_freq: dict[str, int] = {}
    total_length = 0

    for course in courses:
        for section in ("overview", "curriculum", "requirements", "pricing"):
            chunk = _build_course_chunk(
                course=course,
                section=section,
                visibility="public",
                text=_build_public_chunk_text(course, section=section),
            )
            chunks.append(chunk)
        private_chunk = _build_course_chunk(
            course=course,
            section="private_detail",
            visibility="full",
            text=_build_private_chunk_text(course),
        )
        chunks.append(private_chunk)

    for chunk in chunks:
        total_length += chunk["length"]
        for token in chunk["term_freq"]:
            doc_freq[token] = doc_freq.get(token, 0) + 1

    average_length = (total_length / len(chunks)) if chunks else 1.0
    return {
        "chunks": chunks,
        "doc_freq": doc_freq,
        "doc_count": len(chunks),
        "avg_len": average_length,
    }


def _corpus_cache_key() -> str:
    stats = Course.objects.filter(is_deleted=False, is_active=True).aggregate(
        total=Count("id"),
        latest=Max("updated_at"),
    )
    total = int(stats.get("total") or 0)
    latest = stats.get("latest")
    latest_stamp = int(latest.timestamp()) if latest else 0
    return f"{CHATBOT_RAG_CACHE_PREFIX}:{total}:{latest_stamp}"


def _load_retrieval_corpus() -> dict:
    key = _corpus_cache_key()
    cached = cache.get(key)
    if cached is not None:
        return cached

    payload = _build_retrieval_corpus()
    cache_ttl = int(getattr(settings, "CHATBOT_RAG_CACHE_TTL", 300))
    cache.set(key, payload, cache_ttl)
    return payload


def _build_access_map(user, course_ids: list[int]) -> dict[int, str]:
    access_map = {course_id: "public" for course_id in course_ids}
    if not course_ids or not user or not user.is_authenticated or getattr(user, "is_deleted", False):
        return access_map

    if user.is_staff or user.is_superuser:
        return {course_id: "full" for course_id in course_ids}

    purchased_ids = set(
        Enrollment.objects.filter(
            user=user,
            course_id__in=course_ids,
            payment_status="success",
            is_deleted=False,
        ).values_list("course_id", flat=True)
    )
    for purchased_id in purchased_ids:
        access_map[purchased_id] = "full"
    return access_map


def _score_chunk(
    *,
    chunk: dict,
    query_terms: list[str],
    idf_map: dict[str, float],
    avg_len: float,
    focused_course_id: int | None,
    history_course_ids: set[int],
) -> float:
    k1 = 1.2
    b = 0.75
    chunk_len = max(float(chunk["length"]), 1.0)
    norm = k1 * (1 - b + b * (chunk_len / max(avg_len, 1.0)))
    score = 0.0
    term_freq = chunk["term_freq"]
    query_line = " ".join(query_terms)

    for term in query_terms:
        tf = float(term_freq.get(term, 0))
        if tf <= 0:
            continue
        idf = idf_map.get(term, 0.0)
        score += idf * ((tf * (k1 + 1.0)) / (tf + norm))

    if focused_course_id and chunk["course_id"] == focused_course_id:
        score += 1.8
    if chunk["course_id"] in history_course_ids:
        score += 0.9

    if any(hint in query_line for hint in PRICING_HINTS) and chunk["section"] == "pricing":
        score += 1.2
    if any(hint in query_line for hint in REQUIREMENTS_HINTS) and chunk["section"] == "requirements":
        score += 1.2
    if any(hint in query_line for hint in CAREER_HINTS) and chunk["section"] == "curriculum":
        score += 0.8

    if chunk["section"] == "overview":
        score += 0.2

    return score


def _retrieve_grounded_chunks(
    *,
    message: str,
    user,
    focused_course_id: int | None,
    history_course_ids: list[int],
    limit: int = 8,
) -> tuple[list[dict], dict[int, str]]:
    corpus = _load_retrieval_corpus()
    chunks: list[dict] = corpus.get("chunks", [])
    if not chunks:
        return [], {}

    unique_course_ids = sorted({chunk["course_id"] for chunk in chunks})
    access_map = _build_access_map(user=user, course_ids=unique_course_ids)
    query_terms = _tokenize_for_retrieval(message)
    if not query_terms:
        query_terms = ["course", "skills"]

    doc_count = max(int(corpus.get("doc_count") or len(chunks) or 1), 1)
    doc_freq = corpus.get("doc_freq", {})
    idf_map: dict[str, float] = {}
    for token in query_terms:
        df = float(doc_freq.get(token, 0))
        idf_map[token] = math.log(((doc_count - df + 0.5) / (df + 0.5)) + 1.0)

    history_set = set(history_course_ids[:4])
    scored_hits: list[dict] = []
    for chunk in chunks:
        if chunk["visibility"] == "full" and access_map.get(chunk["course_id"], "public") != "full":
            continue
        score = _score_chunk(
            chunk=chunk,
            query_terms=query_terms,
            idf_map=idf_map,
            avg_len=float(corpus.get("avg_len") or 1.0),
            focused_course_id=focused_course_id,
            history_course_ids=history_set,
        )
        if score <= 0 and not (focused_course_id and chunk["course_id"] == focused_course_id):
            continue
        scored_hits.append({"score": score, "chunk": chunk})

    if not scored_hits:
        fallback_chunks = sorted(chunks, key=lambda item: item.get("created_at_ts", 0), reverse=True)
        for chunk in fallback_chunks:
            if focused_course_id and chunk["course_id"] != focused_course_id:
                continue
            if chunk["visibility"] == "full" and access_map.get(chunk["course_id"], "public") != "full":
                continue
            scored_hits.append({"score": 0.05, "chunk": chunk})
            if len(scored_hits) >= limit:
                break

    scored_hits.sort(
        key=lambda item: (
            item["score"],
            item["chunk"].get("created_at_ts", 0),
        ),
        reverse=True,
    )
    selected: list[dict] = []
    seen_keys: set[str] = set()
    for item in scored_hits:
        key = item["chunk"]["chunk_key"]
        if key in seen_keys:
            continue
        seen_keys.add(key)
        selected.append(
            {
                "score": round(float(item["score"]), 4),
                "course_id": int(item["chunk"]["course_id"]),
                "section": item["chunk"]["section"],
                "visibility": item["chunk"]["visibility"],
                "text": item["chunk"]["text"],
                "course_title": item["chunk"]["course_title"],
            }
        )
        if len(selected) >= limit:
            break

    return selected, access_map


def build_chat_context(message: str, user, course_id: int | None, history: list[dict] | None = None) -> ChatContext:
    base_queryset = (
        Course.objects.select_related("category")
        .filter(is_deleted=False, is_active=True)
        .order_by("-created_at")
    )
    focused_course = base_queryset.filter(id=course_id).first() if course_id else None
    focused_course_id = focused_course.id if focused_course else None
    history_course_ids = _extract_course_ids_from_history(history)

    hits, access_map = _retrieve_grounded_chunks(
        message=message,
        user=user,
        focused_course_id=focused_course_id,
        history_course_ids=history_course_ids,
        limit=8,
    )

    sources: list[str] = []
    context_rows: list[str] = []
    for hit in hits:
        source_key = f"course:{hit['course_id']}"
        if source_key not in sources:
            sources.append(source_key)
        context_rows.append(
            "\n".join(
                [
                    f"[Knowledge Chunk] source={source_key}",
                    f"Section: {hit['section']}",
                    f"Visibility: {hit['visibility']}",
                    hit["text"],
                ]
            )
        )

    course_access = "none"
    if focused_course:
        course_access = access_map.get(focused_course.id, _resolve_access(user, focused_course))
        focused_source = f"course:{focused_course.id}"
        if focused_source not in sources:
            sources.insert(0, focused_source)
            context_rows.insert(
                0,
                _serialize_course(
                    focused_course,
                    include_private=(course_access == "full"),
                ),
            )
    elif hits:
        course_access = "public"

    if not context_rows:
        context_rows.append("No active courses were available in the catalog context.")

    context_text = "Internal SIA EDU course context:\n" + "\n\n".join(context_rows)
    return ChatContext(
        context_text=context_text,
        sources=sources[:8],
        course_access=course_access,
        focused_course_id=focused_course_id,
        retrieval_mode="lexical_bm25_rag",
        retrieval_hits=len(hits),
    )


def _build_system_prompt(context: ChatContext) -> str:
    return (
        "You are an education-only assistant for SIA EDU.\n"
        "Rules:\n"
        "1) Answer only education and SIA course-related questions.\n"
        "2) If user asks outside education scope, reply exactly:\n"
        f"\"{EDUCATION_ONLY_REPLY}\"\n"
        "3) Use the provided internal context for course details and pricing.\n"
        "4) If a requested fact is missing, say you do not have that information yet.\n"
        "5) Never provide medical, legal, financial, political, or unrelated advice.\n"
        "6) Keep answers concise, practical, and student-friendly.\n"
        "7) If course_access is public, do not reveal paid/private lesson-level details.\n"
        "8) If user asks career details, summarize relevant courses from context with likely career outcomes.\n"
        "9) Do not ask for another course id when relevant context already includes enough details.\n"
        "10) Prefer markdown with short structure:\n"
        "   - Use **bold** section titles.\n"
        "   - Use bullet points or numbered lists when useful.\n"
        "   - Keep each line short and readable for students.\n"
        "11) Never expose raw source IDs (example: course:34 or Course #34) to students.\n"
        "12) Keep tone friendly, specific, and actionable.\n"
        f"Current course_access: {context.course_access}\n"
        f"Focused course id: {context.focused_course_id or 'none'}\n"
        f"Retrieval mode: {context.retrieval_mode}\n"
        f"Retrieval hits: {context.retrieval_hits}"
    )


def _normalize_history(history: list[dict] | None) -> list[dict]:
    if not history:
        return []
    max_history = max(int(getattr(settings, "CHATBOT_MAX_HISTORY", 8)), 0)
    normalized: list[dict] = []
    for item in history[-max_history:]:
        role = str(item.get("role", "")).strip().lower()
        content = str(item.get("content", "")).strip()
        if role not in {"user", "assistant"} or not content:
            continue
        normalized.append({"role": role, "content": content[:1200]})
    return normalized


def generate_reply(message: str, history: list[dict] | None, context: ChatContext) -> str:
    api_key = str(getattr(settings, "GROQ_API_KEY", "")).strip()
    if not api_key:
        raise ChatbotConfigError("GROQ_API_KEY is not configured.")

    api_url = str(
        getattr(settings, "GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
    ).strip()
    model_name = str(getattr(settings, "GROQ_CHAT_MODEL", "llama-3.1-8b-instant")).strip()
    max_tokens = int(getattr(settings, "CHATBOT_MAX_TOKENS", 420))

    messages = [
        {"role": "system", "content": _build_system_prompt(context)},
        {"role": "system", "content": context.context_text},
        *_normalize_history(history),
        {"role": "user", "content": message},
    ]

    payload = {
        "model": model_name,
        "temperature": 0.2,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=25)
    except requests.RequestException as exc:
        raise ChatbotServiceError("Unable to contact Groq API.") from exc

    if response.status_code >= 400:
        logger.warning("Groq API error status=%s body=%s", response.status_code, response.text[:500])
        raise ChatbotServiceError("Groq API returned an error response.")

    try:
        data = response.json()
        reply = data["choices"][0]["message"]["content"].strip()
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise ChatbotServiceError("Invalid response payload from Groq API.") from exc

    if not reply:
        raise ChatbotServiceError("Empty response from Groq API.")
    return reply


def fallback_reply(message: str, context: ChatContext) -> str:
    normalized = _normalize_query(message)
    local_reply = local_intent_reply(message=message, context=context)
    if local_reply:
        return local_reply

    if "price" in normalized or "billing" in normalized or "discount" in normalized:
        return "\n".join(
            [
                "**Pricing Help**",
                "- Pricing is course-specific and visible on each course card and details page.",
                "- Discounted amount is calculated live before checkout.",
                "- Open a course and continue to billing for exact payable amount.",
            ]
        )
    if context.focused_course_id:
        return "\n".join(
            [
                "**Course Guidance Available**",
                "- I can explain outcomes, prerequisites, and learning plan for this course.",
                "- Ask one specific doubt and I will answer in point-wise format.",
            ]
        )
    return "\n".join(
            [
                "**Support Scope**",
                "- AI, ML, DL, Data Science, Prompt Engineering, and Quantum course guidance.",
                "- Ask your doubt with topic name for a structured answer.",
            ]
    )


def _answer_for_message(
    *,
    message: str,
    user,
    course_id: int | None = None,
    history: list[dict] | None = None,
    use_model: bool = False,
) -> tuple[str, str, str, bool, ChatContext, int]:
    started = time.perf_counter()
    context = build_chat_context(message=message, user=user, course_id=course_id, history=history)

    try:
        local_reply = local_intent_reply(message=message, context=context)
        if local_reply:
            reply = local_reply
            provider = "policy"
            model = "intent_router"
            degraded = False
        elif use_model:
            reply = generate_reply(message=message, history=history, context=context)
            provider = "groq"
            model = "configured"
            degraded = False
        else:
            raise ChatbotServiceError("Model usage disabled for this evaluation run.")
    except (ChatbotConfigError, ChatbotServiceError):
        reply = fallback_reply(message=message, context=context)
        provider = "fallback"
        model = "fallback"
        degraded = True
    except Exception:
        logger.exception("Unhandled chatbot execution error during evaluation")
        reply = fallback_reply(message=message, context=context)
        provider = "fallback"
        model = "fallback"
        degraded = True

    elapsed_ms = max(int((time.perf_counter() - started) * 1000), 0)
    return format_chat_reply(reply), provider, model, degraded, context, elapsed_ms


def _evaluate_case_quality(reply: str, context: ChatContext, case: ChatEvaluationCase) -> tuple[int, dict]:
    normalized_reply = reply.lower()
    source_courses = _courses_from_source_ids(_extract_course_ids_from_sources(context.sources))

    has_structure = any(marker in reply for marker in ("\n- ", "\n1.", "\n2.", "**"))
    keyword_hits = sum(1 for keyword in case.expected_keywords if keyword.lower() in normalized_reply)
    keyword_score = 0 if not case.expected_keywords else min(keyword_hits / len(case.expected_keywords), 1.0)

    title_hits = any(course.title.lower() in normalized_reply for course in source_courses if course.title)
    grounded = bool(source_courses) and (title_hits or bool(context.focused_course_id))

    quality_score = 0
    quality_score += 35 if has_structure else 0
    quality_score += int(40 * keyword_score)
    quality_score += 25 if grounded else 0

    checks = {
        "has_structure": has_structure,
        "keyword_hits": keyword_hits,
        "keyword_target": len(case.expected_keywords),
        "grounded": grounded,
    }
    return min(quality_score, 100), checks


def evaluate_chatbot_suite(*, user=None, use_model: bool = False, max_cases: int = 6) -> dict:
    total_cases = max(1, min(int(max_cases or 1), len(DEFAULT_EVAL_CASES)))
    selected_cases = DEFAULT_EVAL_CASES[:total_cases]
    results: list[dict] = []

    for case in selected_cases:
        reply, provider, model, degraded, context, latency_ms = _answer_for_message(
            message=case.prompt,
            user=user,
            course_id=case.course_id,
            history=None,
            use_model=use_model,
        )
        score, checks = _evaluate_case_quality(reply=reply, context=context, case=case)
        passed = score >= 70
        results.append(
            {
                "case_id": case.case_id,
                "prompt": case.prompt,
                "provider": provider,
                "model": model,
                "degraded": degraded,
                "score": score,
                "passed": passed,
                "latency_ms": latency_ms,
                "retrieval_hits": context.retrieval_hits,
                "sources_count": len(context.sources),
                "checks": checks,
                "reply_preview": reply[:420],
            }
        )

    average_score = round(sum(item["score"] for item in results) / len(results), 2) if results else 0.0
    average_latency_ms = round(sum(item["latency_ms"] for item in results) / len(results), 2) if results else 0.0
    pass_rate = round((sum(1 for item in results if item["passed"]) / len(results)) * 100, 2) if results else 0.0

    return {
        "summary": {
            "total_cases": len(results),
            "passed_cases": sum(1 for item in results if item["passed"]),
            "pass_rate": pass_rate,
            "average_score": average_score,
            "average_latency_ms": average_latency_ms,
            "used_model": bool(use_model),
            "evaluation_mode": "model_online" if use_model else "offline_policy_fallback",
        },
        "results": results,
    }


def format_chat_reply(reply: str) -> str:
    cleaned = (reply or "").strip()
    if not cleaned:
        return cleaned

    cleaned = re.sub(r"\b[Cc]ourse\s*#\s*\d+\b", "course", cleaned)
    cleaned = re.sub(r"\bcourse:\d+\b", "", cleaned)
    cleaned = re.sub(r"^\s*Sources:\s*.*$", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()

    already_structured = any(
        marker in cleaned for marker in ("\n- ", "\n1.", "\n2.", "**")
    )
    if already_structured:
        return cleaned

    if len(cleaned) < 180:
        return cleaned

    sentences = [item.strip() for item in re.split(r"(?<=[.!?])\s+", cleaned) if item.strip()]
    if len(sentences) < 2:
        return cleaned

    lines = ["**Answer**"]
    for sentence in sentences[:5]:
        lines.append(f"- {sentence}")
    return "\n".join(lines)
