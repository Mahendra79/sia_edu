from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0010_quiz_quizquestion_quizoption_quizattempt_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="quiz",
            name="status",
            field=models.CharField(
                choices=[("draft", "Draft"), ("published", "Published"), ("archived", "Archived")],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="quiz",
            name="is_active",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddIndex(
            model_name="quiz",
            index=models.Index(fields=["course", "status", "is_active"], name="courses_qui_course__9dffa2_idx"),
        ),
    ]
