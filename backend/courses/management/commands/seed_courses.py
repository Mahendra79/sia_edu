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
    ("AI & ML", "Applied artificial intelligence and machine learning for real-world systems and workflows."),
    ("Agentic AI", "Autonomous AI systems, tool-using agents, planning, and multi-step execution patterns."),
    ("Data Science", "Data analysis, statistical reasoning, visualization, and decision-focused modeling."),
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
        duration_days=56,
        description_override=(
            "Certificate Program in Quantum Computing\n"
            "Delivered on the Hyper Dimensional Quantum System (HDQS) Platform\n"
            "\n"
            "Offered by SIA Software Innovations Private Limited\n"
            "\n"
            "Program Overview\n"
            "Difficulty Level: Advanced\n"
            "\n"
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
    CourseBlueprint(
        title="Quantum Gates and Circuit Design",
        short_description=(
            "Build quantum circuits with core gate sets, entanglement patterns, measurement logic, and simulator workflows."
        ),
        category="Quantum Computing",
        focus="design and analyze quantum circuits using practical gate-based workflows",
        price=Decimal("499.00"),
        discount_percent=Decimal("20.00"),
        topics=("Quantum Gates", "Circuit Design", "Entanglement", "Measurement", "Simulation Workflows"),
        duration_days=28,
        description_override=(
            "Quantum Gates and Circuit Design\n"
            "Build practical fluency with gate-based quantum circuit construction\n"
            "\n"
            "Course Overview\n"
            "Difficulty Level: Basic\n"
            "\n"
            "This course is designed for learners who want a rigorous but approachable entry into quantum circuit engineering. "
            "It focuses on the operational layer of quantum computing: how qubits are represented, how gates transform quantum states, "
            "how entanglement is created, and how circuits are evaluated in simulation environments.\n"
            "\n"
            "Rather than treating quantum computing as a purely theoretical subject, the course emphasizes circuit construction, "
            "measurement interpretation, debugging strategies, and structured practice with executable examples.\n"
            "\n"
            "Who this course is for\n"
            "- Students preparing for advanced quantum algorithm study.\n"
            "- Engineers transitioning from classical programming into quantum workflows.\n"
            "- Technical teams that need circuit-level intuition before exploring platform-specific quantum tooling.\n"
            "\n"
            "Learning outcomes\n"
            "- Explain the purpose and behavior of standard single-qubit and multi-qubit gates.\n"
            "- Build and analyze circuits for superposition, interference, and entanglement.\n"
            "- Interpret measurement outcomes and connect them to circuit design choices.\n"
            "- Evaluate circuit depth, state evolution, and execution tradeoffs in simulation.\n"
            "- Document quantum experiments clearly for review, collaboration, and iteration.\n"
            "\n"
            "Course content / curriculum\n"
            "Module 1: Qubits, states, and circuit notation\n"
            "- State vectors, basis states, amplitudes, and Bloch sphere intuition.\n"
            "- Dirac notation and circuit diagram conventions.\n"
            "- Measurement basics and probability interpretation.\n"
            "\n"
            "Module 2: Single-qubit gate operations\n"
            "- X, Y, Z, H, S, T and rotation gates.\n"
            "- Circuit transformations and state preparation workflows.\n"
            "- Visualizing and validating state transitions.\n"
            "\n"
            "Module 3: Multi-qubit systems and entanglement\n"
            "- Tensor products and two-qubit state construction.\n"
            "- Controlled gates, Bell states, and entanglement patterns.\n"
            "- Interference, correlation, and circuit debugging.\n"
            "\n"
            "Module 4: Circuit execution and optimization basics\n"
            "- Measurement strategies, repeated sampling, and result interpretation.\n"
            "- Circuit depth, gate count, and implementation tradeoffs.\n"
            "- Simulator-led experimentation and report writing.\n"
            "\n"
            "Capstone project\n"
            "Design and present a quantum circuit portfolio containing a state preparation circuit, a Bell-state circuit, "
            "and a small experimental report that explains design intent, expected results, observed outcomes, and possible optimizations.\n"
            "\n"
            "Full description\n"
            "By the end of the course, learners will be able to move beyond conceptual curiosity and reason about circuit structure with confidence. "
            "This makes the course a strong prerequisite for deeper study in quantum algorithms, variational methods, and hybrid quantum-classical applications.\n"
        ),
    ),
    CourseBlueprint(
        title="Agentic AI",
        short_description=(
            "Design AI agents that reason, plan, use tools, and complete multi-step tasks with reliability and control."
        ),
        category="Agentic AI",
        focus="build agentic systems that combine reasoning, tool use, memory, and workflow control",
        price=Decimal("599.00"),
        discount_percent=Decimal("15.00"),
        topics=("Agent Design", "Planning", "Tool Use", "Memory", "Multi-Step Execution"),
        duration_days=35,
        description_override=(
            "Agentic AI\n"
            "Architect practical AI agents for multi-step execution and decision-driven workflows\n"
            "\n"
            "Course Overview\n"
            "Difficulty Level: Intermediate\n"
            "\n"
            "This course focuses on the design of agentic AI systems that do more than return a single response. "
            "Learners build systems that plan, call tools, maintain context, recover from failure, and complete tasks across multiple steps. "
            "The course is intentionally implementation-oriented and aligns with modern product patterns for assistants, copilots, and workflow automation.\n"
            "\n"
            "Who this course is for\n"
            "- Developers building LLM-powered products and internal tools.\n"
            "- Product teams designing assistants with action-taking capabilities.\n"
            "- Engineers who need reliable orchestration patterns rather than prompt-only prototypes.\n"
            "\n"
            "Learning outcomes\n"
            "- Distinguish between single-turn prompting and agentic execution architectures.\n"
            "- Design planning, tool selection, and state management strategies for AI agents.\n"
            "- Build guardrails for retries, validation, and fallback behavior.\n"
            "- Evaluate agent performance using task completion, latency, and reliability signals.\n"
            "- Ship agent workflows that are easier to inspect, debug, and improve over time.\n"
            "\n"
            "Course content / curriculum\n"
            "Module 1: Agent foundations and execution loops\n"
            "- Agent roles, objectives, state, and environment boundaries.\n"
            "- ReAct-style reasoning, action loops, and control flow patterns.\n"
            "- Common failure modes in autonomous task completion.\n"
            "\n"
            "Module 2: Tool use and workflow integration\n"
            "- Function calling, external APIs, retrieval, and structured outputs.\n"
            "- Planning when to call tools versus when to answer directly.\n"
            "- Input validation and error handling for tool-using agents.\n"
            "\n"
            "Module 3: Memory, reliability, and evaluation\n"
            "- Session memory, working memory, and persistent context design.\n"
            "- Reliability strategies for retries, constraints, and human handoff.\n"
            "- Evaluation methods for task accuracy and workflow success.\n"
            "\n"
            "Module 4: Production patterns for agentic systems\n"
            "- Monitoring, audit trails, and user-facing transparency.\n"
            "- Permission boundaries and risk controls.\n"
            "- Designing maintainable agent pipelines for real teams.\n"
            "\n"
            "Capstone project\n"
            "Build a task-completion agent for an operations or support workflow that uses at least two tools, maintains execution state, "
            "handles one failure mode gracefully, and produces a reviewable execution trace.\n"
            "\n"
            "Full description\n"
            "The course is structured to move learners from agent concepts to production-minded implementation. "
            "Instead of vague automation demos, students produce systems that can be reasoned about, tested, and improved with clear engineering tradeoffs.\n"
        ),
    ),
    CourseBlueprint(
        title="AI & ML",
        short_description=(
            "Learn core artificial intelligence and machine learning concepts for applied product, model, and analytics work."
        ),
        category="AI & ML",
        focus="understand and apply foundational AI and machine learning methods to practical problems",
        price=Decimal("549.00"),
        discount_percent=Decimal("18.00"),
        topics=("Supervised Learning", "Model Evaluation", "Feature Engineering", "Deployment Basics", "AI Workflows"),
        duration_days=42,
        description_override=(
            "AI & ML\n"
            "Develop strong applied foundations in machine learning system design and evaluation\n"
            "\n"
            "Course Overview\n"
            "Difficulty Level: Basic\n"
            "\n"
            "This course provides a practical foundation in artificial intelligence and machine learning with emphasis on how real teams frame problems, "
            "prepare data, train models, evaluate outcomes, and communicate tradeoffs. It is suitable for learners who want a structured bridge between "
            "theory and applied model development.\n"
            "\n"
            "Who this course is for\n"
            "- Students entering AI and ML from software, analytics, or engineering backgrounds.\n"
            "- Early-career professionals who want a realistic understanding of ML workflows.\n"
            "- Teams that need shared vocabulary across model development, evaluation, and deployment.\n"
            "\n"
            "Learning outcomes\n"
            "- Frame business and product problems as machine learning tasks.\n"
            "- Prepare datasets and select suitable baseline and advanced models.\n"
            "- Evaluate models using appropriate performance and error analysis metrics.\n"
            "- Understand overfitting, generalization, bias, and practical deployment constraints.\n"
            "- Present model decisions and results in language stakeholders can act on.\n"
            "\n"
            "Course content / curriculum\n"
            "Module 1: AI and ML foundations\n"
            "- Types of learning, supervised vs unsupervised tasks, and real-world use cases.\n"
            "- Problem framing, target definition, and dataset boundaries.\n"
            "- Baseline thinking and the cost of poor problem formulation.\n"
            "\n"
            "Module 2: Data preparation and feature engineering\n"
            "- Cleaning, splitting, scaling, encoding, and leakage prevention.\n"
            "- Feature selection and transformation strategies.\n"
            "- Reproducible experimentation and dataset version awareness.\n"
            "\n"
            "Module 3: Model training and evaluation\n"
            "- Regression, classification, tree-based methods, and introductory ensemble thinking.\n"
            "- Precision, recall, F1, ROC-AUC, MAE, RMSE, and confusion analysis.\n"
            "- Error inspection and iterative improvement loops.\n"
            "\n"
            "Module 4: Deployment thinking and model operations\n"
            "- Batch vs real-time inference patterns.\n"
            "- Monitoring drift, data quality, and business-aligned success metrics.\n"
            "- Responsible AI basics and communication of limitations.\n"
            "\n"
            "Capstone project\n"
            "Develop an end-to-end ML case study from data preparation through model evaluation, then deliver a project report that includes "
            "problem framing, feature decisions, metric justification, error analysis, and deployment recommendations.\n"
            "\n"
            "Full description\n"
            "The course is built to produce practical confidence rather than checkbox familiarity. Learners complete realistic exercises that mirror "
            "how machine learning projects are scoped, reviewed, and improved in production environments.\n"
        ),
    ),
    CourseBlueprint(
        title="Data Science",
        short_description=(
            "Work with data end to end using analysis, visualization, statistics, and decision-focused reporting."
        ),
        category="Data Science",
        focus="analyze data, extract insight, and communicate evidence-backed recommendations",
        price=Decimal("449.00"),
        discount_percent=Decimal("22.00"),
        topics=("Data Analysis", "Statistics", "Visualization", "Exploratory Data Analysis", "Reporting"),
        duration_days=30,
        description_override=(
            "Data Science\n"
            "Turn raw data into structured insight, clear reporting, and actionable business recommendations\n"
            "\n"
            "Course Overview\n"
            "Difficulty Level: Basic\n"
            "\n"
            "This course covers the core workflow of modern data science: collecting and cleaning data, exploring patterns, testing assumptions, "
            "building visual narratives, and presenting evidence clearly. The emphasis is on decision support rather than abstract theory alone.\n"
            "\n"
            "Who this course is for\n"
            "- Learners who want to build practical data analysis skills.\n"
            "- Analysts moving from spreadsheet-heavy work into more structured data practice.\n"
            "- Teams that need clearer, more defensible reporting and insight generation.\n"
            "\n"
            "Learning outcomes\n"
            "- Clean and structure datasets for trustworthy analysis.\n"
            "- Perform exploratory data analysis that surfaces useful patterns and anomalies.\n"
            "- Apply foundational statistics to support interpretation and decision making.\n"
            "- Build visualizations that communicate trends clearly to technical and non-technical audiences.\n"
            "- Translate analytical findings into concise recommendations and next steps.\n"
            "\n"
            "Course content / curriculum\n"
            "Module 1: Data preparation and analytical framing\n"
            "- Asking the right analytical questions.\n"
            "- Cleaning, formatting, missing-value handling, and data quality checks.\n"
            "- Building an analysis plan before jumping into charts.\n"
            "\n"
            "Module 2: Exploratory data analysis\n"
            "- Distribution analysis, segmentation, trend inspection, and anomaly detection.\n"
            "- Working with categorical and numerical variables.\n"
            "- Identifying misleading patterns and weak conclusions.\n"
            "\n"
            "Module 3: Statistics and interpretation\n"
            "- Central tendency, variance, correlation, and confidence-aware thinking.\n"
            "- Practical hypothesis framing and interpretation limits.\n"
            "- Distinguishing signal from noise in business contexts.\n"
            "\n"
            "Module 4: Visualization and reporting\n"
            "- Chart selection, dashboard storytelling, and stakeholder-friendly summaries.\n"
            "- Writing insight narratives with context and recommendations.\n"
            "- Building concise analytical presentations.\n"
            "\n"
            "Capstone project\n"
            "Analyze a multi-dimensional dataset and produce a decision-ready report with cleaned data assumptions, exploratory findings, "
            "key visualizations, risk notes, and a final recommendation summary for stakeholders.\n"
            "\n"
            "Full description\n"
            "This course trains learners to produce analysis that is not only technically correct, but also useful. "
            "By the end, students can move from raw data to defensible recommendations with a workflow appropriate for production teams and client delivery.\n"
        ),
    ),
    CourseBlueprint(
        title="Quantum Algorithms and Complex Computations",
        short_description=(
            "Study core quantum algorithms and solve computation-heavy problems using formal quantum methods."
        ),
        category="Quantum Computing",
        focus="implement quantum algorithms and reason about complex computation problems with quantum methods",
        price=Decimal("699.00"),
        discount_percent=Decimal("12.00"),
        topics=("Deutsch-Jozsa", "Bernstein-Vazirani", "Grover Search", "Quantum Fourier Transform", "Complexity Analysis"),
        duration_days=32,
        description_override=(
            "Quantum Algorithms and Complex Computations\n"
            "Understand canonical quantum algorithms and apply them to complex computational problem structures\n"
            "\n"
            "Course Overview\n"
            "Difficulty Level: Advanced\n"
            "\n"
            "This course explores the algorithmic side of quantum computing. Learners study the structure of widely cited quantum algorithms, "
            "the problem structures they address, and the conditions under which quantum methods become meaningfully interesting for complex computations. "
            "The course balances formal understanding with circuit-level implementation and analysis.\n"
            "\n"
            "Who this course is for\n"
            "- Students who already understand basic qubits and circuit notation.\n"
            "- Engineers preparing for deeper work in quantum software or research support.\n"
            "- Technical learners who want to evaluate quantum advantage claims rigorously.\n"
            "\n"
            "Learning outcomes\n"
            "- Explain the structure and objective of foundational quantum algorithms.\n"
            "- Implement small algorithmic circuits and interpret their outcomes.\n"
            "- Compare classical and quantum approaches at the level of complexity and problem structure.\n"
            "- Analyze which classes of complex computations are suitable for quantum treatment.\n"
            "- Communicate algorithm tradeoffs with technical precision.\n"
            "\n"
            "Course content / curriculum\n"
            "Module 1: Algorithmic foundations\n"
            "- Oracle-based problem framing and reversible computation.\n"
            "- Interference as a computational resource.\n"
            "- Complexity intuition for quantum speedup discussions.\n"
            "\n"
            "Module 2: Early quantum algorithms\n"
            "- Deutsch and Deutsch-Jozsa.\n"
            "- Bernstein-Vazirani and hidden-structure reasoning.\n"
            "- Circuit design patterns behind oracle problems.\n"
            "\n"
            "Module 3: Search and transform methods\n"
            "- Grover's search and amplitude amplification.\n"
            "- Quantum Fourier Transform and phase structure.\n"
            "- Practical circuit considerations and scaling limits.\n"
            "\n"
            "Module 4: Interpreting quantum advantage\n"
            "- Classical baselines and fairness in comparison.\n"
            "- Resource assumptions, noise sensitivity, and implementation constraints.\n"
            "- Framing realistic claims for technical and business audiences working on complex computational systems.\n"
            "\n"
            "Capstone project\n"
            "Implement and compare two canonical quantum algorithms in simulation, document the circuit logic, analyze expected behavior, "
            "and write a short technical brief on how quantum methods can support complex computation problems and where practical constraints remain.\n"
            "\n"
            "Full description\n"
            "The course is intended to make learners precise rather than merely enthusiastic. Students leave with a grounded understanding of why "
            "quantum algorithms matter, what assumptions they rely on, and how to discuss complex computational applications without oversimplification.\n"
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
    "AI & ML": (
        "Basic comfort with algebra and logical problem solving.",
        "Interest in training, evaluating, and improving machine learning systems.",
    ),
    "Agentic AI": (
        "Basic familiarity with prompts, APIs, or automation workflows.",
        "Willingness to reason about task planning and tool orchestration.",
    ),
    "Data Science": (
        "Comfort with spreadsheets or basic Python-based data handling.",
        "Interest in statistics, trends, and data-backed decisions.",
    ),
    "Quantum Computing": (
        "High-school algebra and basic linear algebra familiarity.",
        "Curiosity for non-classical computation models.",
    ),
}

CATEGORY_DURATION_DAYS: dict[str, int] = {
    "AI & ML": 42,
    "Agentic AI": 35,
    "Data Science": 30,
    "Quantum Computing": 56,
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
        duration_weeks = max(1, round(duration_days / 7))
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
            f"Estimated duration: {duration_weeks} weeks of structured learning.",
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
