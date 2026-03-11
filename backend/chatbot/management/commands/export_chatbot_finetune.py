from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from courses.models import Course


SYSTEM_PROMPT = (
    "You are an education-only assistant for SIA EDU. "
    "Answer only course-related questions for AI, ML, DL, Data Science, Prompt Engineering, and Quantum tracks. "
    "Use concise markdown headings and bullet points."
)


def _format_money(value: Decimal) -> str:
    return f"${value.quantize(Decimal('0.01'))}"


def _discounted_price(price: Decimal, discount_percent: Decimal) -> Decimal:
    discount = max(Decimal("0"), min(Decimal("100"), discount_percent))
    discounted = price * (Decimal("1.00") - (discount / Decimal("100")))
    if discounted < Decimal("0.00"):
        return Decimal("0.00")
    return discounted.quantize(Decimal("0.01"))


def _course_examples(course: Course) -> list[dict]:
    price = Decimal(str(course.price or 0))
    discount = Decimal(str(course.discount_percent or 0))
    discounted = _discounted_price(price, discount)
    category_name = course.category.name
    summary = (course.short_description or "").strip()
    description = (course.description or "").strip()

    examples = [
        {
            "user": f"What will I learn in {course.title}?",
            "assistant": (
                f"**What You Will Learn: {course.title}**\n"
                f"- {summary}\n"
                f"- Duration: {course.duration_days} days of guided study.\n"
                f"- Category focus: {category_name}.\n"
                f"- Outcome: practical project-oriented skills for real-world execution."
            ),
        },
        {
            "user": f"Tell me pricing and discount for {course.title}",
            "assistant": (
                f"**Pricing**\n"
                f"- List price: {_format_money(price)}\n"
                f"- Discount: {discount}%\n"
                f"- Current discounted price: {_format_money(discounted)}\n"
                "- Final payable total is confirmed at billing checkout."
            ),
        },
        {
            "user": f"Career path after {course.title}",
            "assistant": (
                f"**Career Path Guidance ({category_name})**\n"
                "- Build foundations in Python, math, and core concepts.\n"
                "- Complete guided assignments and one capstone project.\n"
                "- Publish project outcomes in portfolio with clear business impact.\n"
                "- Practice interview questions and system thinking for job readiness."
            ),
        },
        {
            "user": f"What are prerequisites for {course.title}?",
            "assistant": (
                f"**Prerequisites for {course.title}**\n"
                "- Basic Python familiarity.\n"
                "- Comfort with analytical problem solving.\n"
                "- Weekly commitment for assignments and revision.\n"
                f"- Course context: {description[:220] if description else summary}"
            ),
        },
    ]

    return [
        {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": item["user"]},
                {"role": "assistant", "content": item["assistant"]},
            ]
        }
        for item in examples
    ]


class Command(BaseCommand):
    help = "Export chatbot fine-tuning style JSONL dataset from active courses."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default="chatbot_finetune_dataset.jsonl",
            help="Output JSONL path. Relative paths are resolved from backend BASE_DIR.",
        )
        parser.add_argument(
            "--limit-courses",
            type=int,
            default=0,
            help="Optional limit for number of courses to include (0 means all active courses).",
        )

    def handle(self, *args, **options):
        output_path = Path(options["output"])
        if not output_path.is_absolute():
            output_path = (settings.BASE_DIR / output_path).resolve()

        queryset = (
            Course.objects.select_related("category")
            .filter(is_deleted=False, is_active=True)
            .order_by("-created_at")
        )
        limit_courses = int(options.get("limit_courses") or 0)
        if limit_courses > 0:
            queryset = queryset[:limit_courses]

        rows: list[dict] = []
        for course in queryset:
            rows.extend(_course_examples(course))

        rows.append(
            {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": "Tell me today's cricket score and betting odds"},
                    {
                        "role": "assistant",
                        "content": (
                            "I can help only with SIA education and course-related questions in AI, ML, DL, "
                            "Data Science, Prompt Engineering, and Quantum learning tracks."
                        ),
                    },
                ]
            }
        )

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as output_file:
            for row in rows:
                output_file.write(json.dumps(row, ensure_ascii=False))
                output_file.write("\n")

        self.stdout.write(
            self.style.SUCCESS(
                f"Exported {len(rows)} fine-tune rows from {queryset.count()} courses to {output_path}"
            )
        )
