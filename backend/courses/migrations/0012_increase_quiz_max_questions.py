from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0011_quiz_status_and_publish_index"),
    ]

    operations = [
        migrations.AlterField(
            model_name="quiz",
            name="max_questions",
            field=models.PositiveSmallIntegerField(
                default=50,
                validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(50),
                ],
            ),
        ),
    ]
