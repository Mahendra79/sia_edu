from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from chatbot.services import evaluate_chatbot_suite


class Command(BaseCommand):
    help = "Run chatbot evaluation suite and optionally export JSON report."

    def add_arguments(self, parser):
        parser.add_argument(
            "--use-model",
            action="store_true",
            help="Use configured LLM provider during evaluation. Default runs offline policy/fallback evaluation.",
        )
        parser.add_argument(
            "--max-cases",
            type=int,
            default=6,
            help="Number of benchmark cases to run (1-12).",
        )
        parser.add_argument(
            "--output",
            default="",
            help="Optional JSON output path. Relative paths are resolved from backend BASE_DIR.",
        )

    def handle(self, *args, **options):
        use_model = bool(options.get("use_model"))
        max_cases = int(options.get("max_cases") or 6)

        report = evaluate_chatbot_suite(user=None, use_model=use_model, max_cases=max_cases)
        summary = report["summary"]

        self.stdout.write(self.style.SUCCESS("Chatbot evaluation completed"))
        self.stdout.write(
            f"Mode={summary['evaluation_mode']} | Cases={summary['total_cases']} | "
            f"Pass Rate={summary['pass_rate']}% | Avg Score={summary['average_score']} | "
            f"Avg Latency={summary['average_latency_ms']}ms"
        )

        output_path_raw = str(options.get("output") or "").strip()
        if output_path_raw:
            output_path = Path(output_path_raw)
            if not output_path.is_absolute():
                output_path = (settings.BASE_DIR / output_path).resolve()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with output_path.open("w", encoding="utf-8") as output_file:
                json.dump(report, output_file, indent=2)
            self.stdout.write(self.style.SUCCESS(f"Saved evaluation report to {output_path}"))
