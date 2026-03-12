from __future__ import annotations

import random
from dataclasses import dataclass
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from courses.models import Category, Course, Review


@dataclass(frozen=True)
class CourseBlueprint:
    title: str
    short_description: str
    category: str
    focus: str
    price: Decimal
    discount_percent: Decimal
    topics: tuple[str, ...]
    requirements: tuple[str, ...] = ()
    duration_days: int | None = None
    description_override: str | None = None


CATEGORY_SEEDS: tuple[tuple[str, str], ...] = (
    ("Quantum Computing", "Quantum information, circuits, algorithms, and implementation frameworks."),
)


COURSE_BLUEPRINTS: tuple[CourseBlueprint, ...] = (
    CourseBlueprint(
        title="Certificate Program in Quantum Computing",
        short_description=(
            "Delivered on the Hyper Dimensional Quantum System (HDQS) platform. "
            "Programming-intensive curriculum covering foundations, circuits, algorithms, and hybrid optimization."
        ),
        category="Quantum Computing",
        focus="build foundational quantum computation knowledge and applied implementation skill",
        price=Decimal("0.00"),
        discount_percent=Decimal("0.00"),
        topics=("Quantum Foundations", "Quantum Circuits", "Quantum Algorithms", "Hybrid Optimization", "HDQS Platform"),
        duration_days=30,
        description_override=(
            "Certificate Program in Quantum Computing\n"
            "Delivered on the Hyper Dimensional Quantum System (HDQS) Platform\n"
            "\n"
            "Offered by SIA Software Innovations Private Limited\n"
            "\n"
            "Program Overview\n"
            "The Certificate Program in Quantum Computing is a structured, programming-intensive academic offering "
            "designed to provide foundational knowledge, algorithmic competence, and applied implementation skills "
            "in quantum computation.\n"
            "\n"
            "Delivered on the proprietary Hyper Dimensional Quantum System (HDQS) platform, the program integrates "
            "theoretical constructs with executable quantum circuits, hybrid optimization frameworks, and system-level "
            "quantum architecture modeling.\n"
            "\n"
            "The curriculum is designed to:\n"
            "- Establish mathematical and computational foundations\n"
            "- Develop circuit-level design capability\n"
            "- Implement canonical quantum algorithms\n"
            "- Introduce hybrid quantum-classical optimization methods\n"
            "- Enable applied quantum modeling\n"
            "- Provide exposure to hyper-dimensional system architectures\n"
            "\n"
            "Module 1: Mathematical Foundations of Quantum Computing\n"
            "Objective: Develop conceptual clarity and formal understanding of quantum state representation and probabilistic measurement theory.\n"
            "Topics: Classical vs Quantum paradigms, qubit representation in Hilbert space, Dirac notation, superposition, measurement postulate, expectation values and observables.\n"
            "Practicals: Single-qubit state prep, superposition experiments, expectation value computation with rotation gates.\n"
            "\n"
            "Module 2: Quantum Gates and Circuit Design\n"
            "Objective: Design, execute, and analyze quantum circuits using universal gate sets.\n"
            "Topics: Single-qubit gates (X, Y, Z, H, Phase), parameterized rotations (RX, RY, RZ), multi-qubit systems, controlled operations, circuit depth and execution flow.\n"
            "Practicals: Two-qubit superposition, Bell state generation, multi-qubit entanglement.\n"
            "\n"
            "Module 3: Entanglement, Correlation, and State Analysis\n"
            "Objective: Examine non-classical correlations and quantify quantum system properties.\n"
            "Topics: Entanglement theory, GHZ state construction, phase kickback, quantum interference, density matrices, purity and entropy.\n"
            "Practicals: GHZ implementation, phase kickback analysis, swap test for fidelity, state purity and entropy computation.\n"
            "\n"
            "Module 4: Fundamental Quantum Algorithms\n"
            "Objective: Demonstrate algorithmic quantum advantage through formal implementation.\n"
            "Topics: Deutsch, Deutsch-Jozsa, Bernstein-Vazirani, Grover's search, Quantum Fourier Transform.\n"
            "Practicals: Oracle construction, amplitude amplification, phase encoding, structured QFT circuits.\n"
            "\n"
            "Module 5: Variational and Hybrid Quantum Algorithms\n"
            "Objective: Introduce quantum-classical hybrid optimization frameworks for computational modeling.\n"
            "Topics: Variational principles, parameterized circuits, Hamiltonian construction, expectation estimation, classical optimization loops.\n"
            "Practicals: Mini VQE, two-qubit VQE, Heisenberg model minimization, QAOA for MaxCut, hybrid QAOA-VQE.\n"
            "\n"
            "Module 6: Applied Quantum Modeling and Optimization\n"
            "Objective: Connect quantum circuits with real-world optimization and modeling problems.\n"
            "Topics: Cost function engineering, portfolio optimization Hamiltonians, ground state estimation, parameter sweeping, energy landscape analysis.\n"
            "Practicals: Quantum portfolio optimization, H2 ground state approximation, parameter sweeps and convergence analysis.\n"
            "\n"
            "Module 7: Hyper Dimensional Quantum System Architecture\n"
            "Objective: Expose students to advanced quantum system architecture beyond standard circuit simulation.\n"
            "Topics: Hyper qubit configuration, chunk-based system modeling, hyper-dimensional architecture, entanglement routing mechanisms, system metrics.\n"
            "Practicals: Hyper system initialization, architecture metrics, hyper teleportation validation, fidelity and trace distance analysis.\n"
            "\n"
            "Platform Access and Academic Resources\n"
            "- Individual Student API token for HDQS platform access.\n"
            "- Two structured quantum datasets for experimentation.\n"
            "- Guided coding templates.\n"
            "- Capstone project framework.\n"
            "- Certificate of completion.\n"
        ),
    ),
)


REVIEW_TEMPLATES: dict[int, tuple[str, ...]] = {
    5: (
        "Clear explanations and practical exercises made this easy to apply at work.",
        "The explanations break complex concepts into steps that are easy to follow.",
        "Excellent pacing, realistic examples, and strong project structure.",
        "I used these techniques immediately in my current project.",
    ),
    4: (
        "Strong content and solid delivery, with useful assignments.",
        "Good balance of theory and implementation details.",
        "Helpful examples overall, and the templates are reusable.",
        "Great value for the topics covered in this course.",
    ),
    3: (
        "Useful course, but I had to rewatch a few parts to keep up.",
        "Content is good, though some modules felt dense for beginners.",
        "Decent structure with room for more advanced examples.",
    ),
}


CATEGORY_REQUIREMENTS: dict[str, tuple[str, ...]] = {
    "Quantum Computing": (
        "High-school algebra and basic linear algebra familiarity.",
        "Curiosity for non-classical computation models.",
    ),
}

CATEGORY_DURATION_DAYS: dict[str, int] = {
    "Quantum Computing": 30,
}


class Command(BaseCommand):
    help = "Seed categories, 20+ courses, and synthetic reviews for local testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--review-users",
            type=int,
            default=18,
            help="Number of seed learner accounts used for review generation (default: 18).",
        )

    @staticmethod
    def _build_description(blueprint: CourseBlueprint) -> str:
        if blueprint.description_override:
            return blueprint.description_override.strip()
        topics = list(blueprint.topics)
        requirements = list(blueprint.requirements or CATEGORY_REQUIREMENTS.get(blueprint.category, ()))
        duration_days = blueprint.duration_days or CATEGORY_DURATION_DAYS.get(blueprint.category, 30)
        if not requirements:
            requirements = [
                "No strict prerequisites; beginner-friendly mindset is enough.",
                "A laptop and internet connection for practical exercises.",
            ]

        learn_points = [
            f"Plan and execute workflows to {blueprint.focus}.",
            f"Use {topics[0]} and {topics[1]} to solve practical challenges.",
            f"Document decisions and tradeoffs for real project collaboration.",
            f"Build a portfolio-ready outcome with reusable templates.",
        ]

        module_points = [
            f"Module 1: Foundations and mindset for {topics[0]}",
            f"Module 2: Applied workflow with {topics[1]} and {topics[2]}",
            f"Module 3: Quality, optimization, and troubleshooting",
            f"Module 4: Capstone implementation and delivery checklist",
        ]

        sections = [
            (
                f"This course helps you {blueprint.focus}. "
                f"It combines guided practice, structured labs, and project-focused outcomes."
            ),
            "",
            f"Estimated duration: {duration_days} days of structured learning.",
            "",
            "What you'll learn:",
            *[f"- {item}" for item in learn_points],
            "",
            "Requirements:",
            *[f"- {item}" for item in requirements],
            "",
            "Course content:",
            *[f"- {item}" for item in module_points],
            "",
            "Explore related topics:",
            *[f"- {item}" for item in topics],
            "",
            "Video section:",
            "- Video preview is intentionally a text placeholder for now. No player is enabled yet.",
        ]

        return "\n".join(sections).strip()

    @staticmethod
    def _seed_users(count: int) -> list[User]:
        users: list[User] = []
        for index in range(1, count + 1):
            username = f"seed_student_{index:02d}"
            defaults = {
                "email": f"seed.student{index:02d}@siaedu.local",
                "phone": f"810000{index:04d}",
                "name": f"Seed Learner {index:02d}",
                "is_active": True,
                "is_email_verified": True,
                "is_deleted": False,
            }
            user, _ = User.objects.update_or_create(username=username, defaults=defaults)
            if not user.has_usable_password():
                user.set_password("SeedPass123!")
                user.save(update_fields=["password"])
            users.append(user)
        return users

    @staticmethod
    def _upsert_course(blueprint: CourseBlueprint, category: Category) -> tuple[Course, bool]:
        duration_days = blueprint.duration_days or CATEGORY_DURATION_DAYS.get(blueprint.category, 30)
        defaults = {
            "category": category,
            "short_description": blueprint.short_description,
            "description": Command._build_description(blueprint),
            "duration_days": duration_days,
            "price": blueprint.price,
            "discount_percent": blueprint.discount_percent,
            "is_active": True,
            "is_deleted": False,
        }

        course = Course.objects.filter(title=blueprint.title).order_by("id").first()
        if not course:
            return Course.objects.create(title=blueprint.title, **defaults), True

        for field, value in defaults.items():
            setattr(course, field, value)
        course.save()
        return course, False

    @staticmethod
    def _review_comment(course: Course, rating: int, sequence: int) -> str:
        template_group = REVIEW_TEMPLATES.get(rating) or REVIEW_TEMPLATES[4]
        return f"{template_group[sequence % len(template_group)]} ({course.title})"

    def handle(self, *args, **options):
        review_user_count = max(6, int(options["review_users"]))

        stats = {
            "categories_created": 0,
            "categories_updated": 0,
            "categories_archived": 0,
            "courses_created": 0,
            "courses_updated": 0,
            "courses_archived": 0,
            "reviews_created": 0,
            "reviews_updated": 0,
            "reviews_archived": 0,
        }

        with transaction.atomic():
            category_by_name: dict[str, Category] = {}
            seed_category_names = [name for name, _ in CATEGORY_SEEDS]
            for name, description in CATEGORY_SEEDS:
                category, created = Category.objects.update_or_create(
                    name=name,
                    defaults={
                        "description": description,
                        "is_deleted": False,
                    },
                )
                category_by_name[name] = category
                stats["categories_created" if created else "categories_updated"] += 1

            stats["categories_archived"] = Category.objects.exclude(name__in=seed_category_names).filter(
                is_deleted=False
            ).update(is_deleted=True)

            users = self._seed_users(review_user_count)

            seeded_courses: list[Course] = []
            seed_course_titles = [blueprint.title for blueprint in COURSE_BLUEPRINTS]
            for index, blueprint in enumerate(COURSE_BLUEPRINTS):
                category = category_by_name[blueprint.category]
                course, created = self._upsert_course(blueprint, category)
                seeded_courses.append(course)
                stats["courses_created" if created else "courses_updated"] += 1

            stats["courses_archived"] = Course.objects.exclude(title__in=seed_course_titles).filter(
                is_deleted=False
            ).update(is_active=False, is_deleted=True)
            stats["reviews_archived"] = Review.objects.filter(course__is_deleted=True, is_deleted=False).update(
                is_deleted=True
            )

            for course_index, course in enumerate(seeded_courses):
                rng = random.Random(f"{course.title}|reviews|v1")
                review_total = 5 + (course_index % 4)
                for offset in range(review_total):
                    user = users[(course_index * 3 + offset) % len(users)]
                    rating = rng.choices([5, 4, 3], weights=[56, 34, 10], k=1)[0]
                    comment = self._review_comment(course, rating, offset)
                    _, created = Review.objects.update_or_create(
                        user=user,
                        course=course,
                        defaults={
                            "rating": rating,
                            "comment": comment,
                            "is_deleted": False,
                        },
                    )
                    stats["reviews_created" if created else "reviews_updated"] += 1

        self.stdout.write(self.style.SUCCESS("Course seed completed successfully."))
        self.stdout.write(
            f"categories created/updated: {stats['categories_created']}/{stats['categories_updated']}"
        )
        self.stdout.write(f"categories archived: {stats['categories_archived']}")
        self.stdout.write(f"courses created/updated: {stats['courses_created']}/{stats['courses_updated']}")
        self.stdout.write(f"courses archived: {stats['courses_archived']}")
        self.stdout.write(f"reviews created/updated: {stats['reviews_created']}/{stats['reviews_updated']}")
        self.stdout.write(f"reviews archived: {stats['reviews_archived']}")
