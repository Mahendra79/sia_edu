from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("courses", "0009_courselesson_pdf_url"),
    ]

    operations = [
        migrations.CreateModel(
            name="Quiz",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("module_number", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("time_per_question_seconds", models.PositiveSmallIntegerField(default=25)),
                (
                    "pass_percentage",
                    models.PositiveSmallIntegerField(
                        default=70,
                        validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)],
                    ),
                ),
                (
                    "max_questions",
                    models.PositiveSmallIntegerField(
                        default=25,
                        validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(25)],
                    ),
                ),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="quizzes", to="courses.course")),
            ],
            options={
                "ordering": ["course_id", "module_number", "id"],
            },
        ),
        migrations.CreateModel(
            name="QuizAttempt",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("attempt_number", models.PositiveSmallIntegerField(default=1)),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("total_questions", models.PositiveSmallIntegerField(default=0)),
                ("answered_count", models.PositiveSmallIntegerField(default=0)),
                ("unanswered_count", models.PositiveSmallIntegerField(default=0)),
                ("correct_count", models.PositiveSmallIntegerField(default=0)),
                ("wrong_count", models.PositiveSmallIntegerField(default=0)),
                ("total_marks", models.PositiveSmallIntegerField(default=0)),
                ("score", models.PositiveSmallIntegerField(default=0)),
                ("percentage", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("is_passed", models.BooleanField(db_index=True, default=False)),
                ("time_taken_seconds", models.PositiveIntegerField(default=0)),
                (
                    "status",
                    models.CharField(
                        choices=[("in_progress", "In progress"), ("submitted", "Submitted"), ("expired", "Expired")],
                        db_index=True,
                        default="in_progress",
                        max_length=20,
                    ),
                ),
                ("quiz", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attempts", to="courses.quiz")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="quiz_attempts", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-started_at"],
            },
        ),
        migrations.CreateModel(
            name="QuizQuestion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("question_text", models.TextField()),
                (
                    "marks",
                    models.PositiveSmallIntegerField(
                        default=1,
                        validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)],
                    ),
                ),
                ("order", models.PositiveSmallIntegerField(default=1)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("quiz", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="questions", to="courses.quiz")),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="QuizOption",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("option_text", models.CharField(max_length=1000)),
                ("is_correct", models.BooleanField(default=False)),
                ("order", models.PositiveSmallIntegerField(default=1)),
                ("question", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="options", to="courses.quizquestion")),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="QuizAttemptAnswer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("is_answered", models.BooleanField(default=False)),
                ("is_correct", models.BooleanField(default=False)),
                ("marks_awarded", models.PositiveSmallIntegerField(default=0)),
                ("time_taken_seconds", models.PositiveSmallIntegerField(default=0)),
                ("attempt", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="answers", to="courses.quizattempt")),
                (
                    "question",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attempt_answers", to="courses.quizquestion"),
                ),
                (
                    "selected_option",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="attempt_answers",
                        to="courses.quizoption",
                    ),
                ),
            ],
        ),
        migrations.AddIndex(model_name="quiz", index=models.Index(fields=["course", "is_active"], name="courses_qui_course__1cac18_idx")),
        migrations.AddIndex(model_name="quiz", index=models.Index(fields=["course", "module_number"], name="courses_qui_course__753905_idx")),
        migrations.AddIndex(model_name="quizattempt", index=models.Index(fields=["user", "quiz"], name="courses_qui_user_id_a704a3_idx")),
        migrations.AddIndex(
            model_name="quizattempt",
            index=models.Index(fields=["user", "quiz", "is_passed"], name="courses_qui_user_id_fa5cf6_idx"),
        ),
        migrations.AddIndex(
            model_name="quizquestion", index=models.Index(fields=["quiz", "is_active"], name="courses_qui_quiz_id_c7ecda_idx")
        ),
        migrations.AddIndex(model_name="quizquestion", index=models.Index(fields=["quiz", "order"], name="courses_qui_quiz_id_e49003_idx")),
        migrations.AddIndex(model_name="quizoption", index=models.Index(fields=["question", "order"], name="courses_qui_questio_e7d20c_idx")),
        migrations.AddIndex(
            model_name="quizattemptanswer",
            index=models.Index(fields=["attempt", "question"], name="courses_qui_attempt_e86d2d_idx"),
        ),
        migrations.AlterUniqueTogether(name="quizattemptanswer", unique_together={("attempt", "question")}),
    ]
