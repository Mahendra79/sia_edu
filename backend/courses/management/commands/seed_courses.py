from __future__ import annotations

import random
from dataclasses import dataclass
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from courses.models import Category, Course, Review


@dataclass(frozen=True)
class MentorSeed:
    name: str
    title: str
    bio: str


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


MENTORS: tuple[MentorSeed, ...] = (
    MentorSeed(
        name="Dr. Meera Iyer",
        title="Principal Data Scientist",
        bio=(
            "Meera has led enterprise analytics and applied AI programs across healthcare and fintech. "
            "She mentors learners on statistical thinking, model quality, and business-impactful decisions."
        ),
    ),
    MentorSeed(
        name="Arjun Prakash",
        title="Machine Learning Engineering Lead",
        bio=(
            "Arjun builds production ML systems and MLOps pipelines for high-scale products. "
            "His classes focus on reliable model delivery, observability, and deployment discipline."
        ),
    ),
    MentorSeed(
        name="Dr. Sofia Khan",
        title="Deep Learning and NLP Researcher",
        bio=(
            "Sofia specializes in transformer architectures, retrieval systems, and evaluation protocols. "
            "She teaches practical deep learning with emphasis on reproducibility and model safety."
        ),
    ),
    MentorSeed(
        name="Prof. Kiran Bose",
        title="Quantum Computing Scientist",
        bio=(
            "Kiran works on quantum algorithms, optimization, and NISQ-era experimentation. "
            "He mentors learners on quantum foundations, circuit design, and hybrid workflows."
        ),
    ),
    MentorSeed(
        name="Nadia Verma",
        title="Prompt Engineering and AI Safety Specialist",
        bio=(
            "Nadia designs enterprise prompt systems with guardrails, policy controls, and quality assurance. "
            "Her courses focus on safe GenAI usage, traceable prompts, and human-in-the-loop review."
        ),
    ),
)


CATEGORY_SEEDS: tuple[tuple[str, str], ...] = (
    ("Data Science & Analytics", "Data exploration, statistics, visualization, and analytical reasoning."),
    ("Machine Learning Engineering", "Model training, feature engineering, validation, and applied ML systems."),
    ("Deep Learning Systems", "Neural networks, transformers, computer vision, and sequence models."),
    ("Generative AI & LLMs", "LLM applications, RAG architecture, safety practices, and business use cases."),
    ("Prompt Engineering", "Prompt design patterns, governance, and response quality optimization."),
    ("Quantum Computing", "Quantum information, circuits, algorithms, and implementation frameworks."),
    ("Quantum AI Engineering", "Hybrid quantum-classical modeling and quantum machine learning techniques."),
    ("MLOps & AI Deployment", "Deployment, monitoring, drift management, and reliable ML operations."),
)


COURSE_BLUEPRINTS: tuple[CourseBlueprint, ...] = (
    CourseBlueprint(
        title="Python for Data Science Foundations",
        short_description="Build strong analytical foundations with Python, NumPy, and Pandas.",
        category="Data Science & Analytics",
        focus="analyze structured datasets and derive reliable data insights",
        price=Decimal("149.00"),
        discount_percent=Decimal("30.00"),
        topics=("Python", "NumPy", "Pandas", "Data Wrangling", "Notebook Workflows"),
        requirements=(
            "Basic programming familiarity is recommended.",
            "Comfort with arithmetic reasoning and data tables.",
        ),
        duration_days=32,
    ),
    CourseBlueprint(
        title="Statistics and Probability for AI Engineers",
        short_description="Master the statistical foundations required for ML and model evaluation.",
        category="Data Science & Analytics",
        focus="reason about uncertainty, distributions, and model confidence",
        price=Decimal("139.00"),
        discount_percent=Decimal("28.00"),
        topics=("Probability", "Distributions", "Hypothesis Testing", "Confidence Intervals", "Bayesian Thinking"),
        duration_days=30,
    ),
    CourseBlueprint(
        title="Data Visualization and Storytelling for AI Teams",
        short_description="Translate complex model outputs into clear decisions and dashboards.",
        category="Data Science & Analytics",
        focus="communicate analytical findings with technical and business clarity",
        price=Decimal("134.00"),
        discount_percent=Decimal("26.00"),
        topics=("Visualization", "Matplotlib", "Seaborn", "Dashboard Thinking", "Narrative Analytics"),
        duration_days=26,
    ),
    CourseBlueprint(
        title="Applied Machine Learning with Scikit-learn",
        short_description="Train, validate, and compare ML models for real-world prediction tasks.",
        category="Machine Learning Engineering",
        focus="build dependable machine learning baselines and optimization loops",
        price=Decimal("144.00"),
        discount_percent=Decimal("29.00"),
        topics=("Scikit-learn", "Model Selection", "Cross Validation", "Pipelines", "Evaluation Metrics"),
        duration_days=34,
    ),
    CourseBlueprint(
        title="Feature Engineering and Model Selection",
        short_description="Design robust features and select models that generalize in production.",
        category="Machine Learning Engineering",
        focus="engineer informative features and reduce overfitting risk",
        price=Decimal("136.00"),
        discount_percent=Decimal("27.00"),
        topics=("Feature Engineering", "Selection Methods", "Leakage Prevention", "Validation", "Error Analysis"),
        duration_days=29,
    ),
    CourseBlueprint(
        title="Time Series Forecasting for Business and AI",
        short_description="Build forecasting pipelines for demand, risk, and trend prediction.",
        category="Machine Learning Engineering",
        focus="model temporal patterns with transparent forecasting methodology",
        price=Decimal("142.00"),
        discount_percent=Decimal("25.00"),
        topics=("Time Series", "Feature Windows", "Prophet", "ARIMA", "Forecast Validation"),
        duration_days=31,
    ),
    CourseBlueprint(
        title="Deep Learning with PyTorch",
        short_description="Build and train neural networks for classification and sequence tasks.",
        category="Deep Learning Systems",
        focus="implement and optimize deep neural networks with reproducible experiments",
        price=Decimal("159.00"),
        discount_percent=Decimal("31.00"),
        topics=("PyTorch", "Neural Networks", "Optimization", "Regularization", "Experiment Tracking"),
        duration_days=36,
    ),
    CourseBlueprint(
        title="Computer Vision Engineering with CNNs",
        short_description="Design vision pipelines for detection, classification, and segmentation.",
        category="Deep Learning Systems",
        focus="build computer vision systems with reliable performance evaluation",
        price=Decimal("164.00"),
        discount_percent=Decimal("30.00"),
        topics=("Computer Vision", "CNN", "Transfer Learning", "Augmentation", "Vision Metrics"),
        duration_days=35,
    ),
    CourseBlueprint(
        title="NLP with Transformers and Attention",
        short_description="Create modern NLP systems with transformer-based architectures.",
        category="Deep Learning Systems",
        focus="implement robust NLP pipelines using transformer modeling strategies",
        price=Decimal("169.00"),
        discount_percent=Decimal("29.00"),
        topics=("Transformers", "Attention", "Tokenization", "Sequence Tasks", "NLP Evaluation"),
        duration_days=37,
    ),
    CourseBlueprint(
        title="Generative AI Product Development",
        short_description="Design practical GenAI product flows from prototype to production.",
        category="Generative AI & LLMs",
        focus="translate LLM capabilities into usable and reliable product workflows",
        price=Decimal("154.00"),
        discount_percent=Decimal("28.00"),
        topics=("Generative AI", "LLM UX", "Inference Patterns", "Evaluation", "Guardrails"),
        duration_days=30,
    ),
    CourseBlueprint(
        title="LLM Fine-Tuning and RAG Architectures",
        short_description="Build domain-specific assistants with retrieval and fine-tuning pipelines.",
        category="Generative AI & LLMs",
        focus="adapt language models for high-accuracy domain-specific assistance",
        price=Decimal("174.00"),
        discount_percent=Decimal("30.00"),
        topics=("Fine Tuning", "RAG", "Embeddings", "Vector Search", "Model Evaluation"),
        duration_days=38,
    ),
    CourseBlueprint(
        title="Responsible AI and Model Governance",
        short_description="Apply fairness, risk, and compliance controls to AI lifecycles.",
        category="Generative AI & LLMs",
        focus="deploy AI systems with measurable safety and governance checks",
        price=Decimal("129.00"),
        discount_percent=Decimal("22.00"),
        topics=("AI Governance", "Fairness", "Risk Controls", "Auditability", "Policy Design"),
        duration_days=24,
    ),
    CourseBlueprint(
        title="Enterprise Prompt Engineering Masterclass",
        short_description="Design robust prompt systems for consistent enterprise outputs.",
        category="Prompt Engineering",
        focus="craft reliable prompt templates and scoring loops for enterprise quality",
        price=Decimal("124.00"),
        discount_percent=Decimal("24.00"),
        topics=("Prompt Patterns", "Few-shot Design", "Prompt Evaluation", "Versioning", "Reliability"),
        duration_days=22,
    ),
    CourseBlueprint(
        title="Prompt Safety and Guardrails",
        short_description="Implement safeguards to reduce hallucinations and unsafe responses.",
        category="Prompt Engineering",
        focus="improve LLM response safety through layered prompt and policy controls",
        price=Decimal("119.00"),
        discount_percent=Decimal("23.00"),
        topics=("Guardrails", "Safety Prompts", "Red Teaming", "Policy Enforcement", "Output Validation"),
        duration_days=20,
    ),
    CourseBlueprint(
        title="Agentic Workflows with Tool-Using LLMs",
        short_description="Build multi-step AI assistants that use tools and APIs reliably.",
        category="Prompt Engineering",
        focus="orchestrate agentic LLM workflows with deterministic control points",
        price=Decimal("146.00"),
        discount_percent=Decimal("26.00"),
        topics=("Agent Design", "Tool Calling", "Planning Loops", "Failure Recovery", "Traceability"),
        duration_days=27,
    ),
    CourseBlueprint(
        title="Quantum Computing Foundations",
        short_description="Understand qubits, circuits, and computation principles beyond classical limits.",
        category="Quantum Computing",
        focus="understand the mathematical and conceptual basis of quantum computation",
        price=Decimal("149.00"),
        discount_percent=Decimal("24.00"),
        topics=("Qubits", "Quantum Gates", "Circuit Model", "Measurement", "Bloch Sphere"),
        duration_days=33,
    ),
    CourseBlueprint(
        title="Quantum Algorithms with Qiskit",
        short_description="Implement core quantum algorithms and benchmark performance experimentally.",
        category="Quantum Computing",
        focus="translate quantum algorithm theory into executable experiments",
        price=Decimal("164.00"),
        discount_percent=Decimal("27.00"),
        topics=("Qiskit", "Grover", "QFT", "Variational Circuits", "Simulation"),
        duration_days=36,
    ),
    CourseBlueprint(
        title="Quantum Hardware and Error Mitigation",
        short_description="Learn practical constraints of quantum hardware and mitigation strategies.",
        category="Quantum Computing",
        focus="analyze hardware noise and improve circuit reliability with mitigation techniques",
        price=Decimal("154.00"),
        discount_percent=Decimal("25.00"),
        topics=("Noise Models", "Error Mitigation", "Calibration", "NISQ Hardware", "Execution Strategy"),
        duration_days=29,
    ),
    CourseBlueprint(
        title="Quantum Machine Learning Fundamentals",
        short_description="Explore quantum-inspired and hybrid methods for ML tasks.",
        category="Quantum AI Engineering",
        focus="evaluate quantum machine learning opportunities and practical limitations",
        price=Decimal("169.00"),
        discount_percent=Decimal("26.00"),
        topics=("QML", "Kernel Methods", "Variational Models", "Hybrid Pipelines", "Benchmarking"),
        duration_days=34,
    ),
    CourseBlueprint(
        title="Hybrid Quantum-Classical Optimization",
        short_description="Design optimization pipelines combining classical and quantum components.",
        category="Quantum AI Engineering",
        focus="solve constrained optimization problems with hybrid quantum-classical workflows",
        price=Decimal("171.00"),
        discount_percent=Decimal("27.00"),
        topics=("Hybrid Optimization", "VQE", "QAOA", "Constraint Modeling", "Result Analysis"),
        duration_days=35,
    ),
    CourseBlueprint(
        title="MLOps with Kubernetes and MLflow",
        short_description="Operationalize ML pipelines with reproducibility, tracking, and scaling.",
        category="MLOps & AI Deployment",
        focus="deploy and manage machine learning pipelines with operational reliability",
        price=Decimal("162.00"),
        discount_percent=Decimal("28.00"),
        topics=("MLOps", "Kubernetes", "MLflow", "CI/CD", "Model Registry"),
        duration_days=33,
    ),
    CourseBlueprint(
        title="AI Model Monitoring and Drift Detection",
        short_description="Track model performance and drift with robust production observability.",
        category="MLOps & AI Deployment",
        focus="monitor model health and prevent silent production regressions",
        price=Decimal("149.00"),
        discount_percent=Decimal("25.00"),
        topics=("Model Monitoring", "Drift Detection", "Alerting", "SLAs", "Root Cause Analysis"),
        duration_days=28,
    ),
    CourseBlueprint(
        title="LLM Evaluation and Benchmarking Lab",
        short_description="Establish repeatable quality metrics for generative AI applications.",
        category="Generative AI & LLMs",
        focus="design rigorous evaluation pipelines for LLM quality and reliability",
        price=Decimal("138.00"),
        discount_percent=Decimal("24.00"),
        topics=("Benchmarking", "LLM Metrics", "Human Eval", "Regression Testing", "Prompt Scoring"),
        duration_days=23,
    ),
)


REVIEW_TEMPLATES: dict[int, tuple[str, ...]] = {
    5: (
        "Clear explanations and practical exercises made this easy to apply at work.",
        "The mentor breaks complex concepts into steps that are easy to follow.",
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
    "Data Science & Analytics": (
        "Basic Python familiarity and comfort with data tables.",
        "Interest in statistics and practical analytical interpretation.",
    ),
    "Machine Learning Engineering": (
        "Python programming basics and introductory statistics knowledge.",
        "Willingness to run repeated experiments and compare metrics.",
    ),
    "Deep Learning Systems": (
        "Foundational machine learning understanding is helpful.",
        "GPU access is optional but recommended for large experiments.",
    ),
    "Generative AI & LLMs": (
        "Basic Python and NLP awareness recommended.",
        "Interest in safe and reliable GenAI application design.",
    ),
    "Prompt Engineering": (
        "No advanced coding required for foundation modules.",
        "Willingness to test prompts, compare outputs, and iterate.",
    ),
    "Quantum Computing": (
        "High-school algebra and basic linear algebra familiarity.",
        "Curiosity for non-classical computation models.",
    ),
    "Quantum AI Engineering": (
        "Quantum foundations or equivalent prerequisite knowledge.",
        "Comfort reading technical math and optimization notation.",
    ),
    "MLOps & AI Deployment": (
        "ML model training basics and Linux command familiarity.",
        "Comfort with production-oriented engineering workflows.",
    ),
}

CATEGORY_DURATION_DAYS: dict[str, int] = {
    "Data Science & Analytics": 30,
    "Machine Learning Engineering": 32,
    "Deep Learning Systems": 36,
    "Generative AI & LLMs": 28,
    "Prompt Engineering": 23,
    "Quantum Computing": 34,
    "Quantum AI Engineering": 35,
    "MLOps & AI Deployment": 31,
}


class Command(BaseCommand):
    help = "Seed categories, 20+ courses, mentor data, and synthetic reviews for local testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--review-users",
            type=int,
            default=18,
            help="Number of seed learner accounts used for review generation (default: 18).",
        )

    @staticmethod
    def _build_description(blueprint: CourseBlueprint) -> str:
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
                f"It combines mentor guidance, structured practice, and project-focused outcomes."
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
    def _upsert_course(blueprint: CourseBlueprint, category: Category, mentor: MentorSeed) -> tuple[Course, bool]:
        duration_days = blueprint.duration_days or CATEGORY_DURATION_DAYS.get(blueprint.category, 30)
        defaults = {
            "category": category,
            "short_description": blueprint.short_description,
            "description": Command._build_description(blueprint),
            "mentor_name": mentor.name,
            "mentor_title": mentor.title,
            "mentor_bio": mentor.bio,
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
                mentor = MENTORS[index % len(MENTORS)]
                category = category_by_name[blueprint.category]
                course, created = self._upsert_course(blueprint, category, mentor)
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
