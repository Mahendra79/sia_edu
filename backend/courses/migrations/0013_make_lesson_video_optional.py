from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0012_increase_quiz_max_questions"),
    ]

    operations = [
        migrations.AlterField(
            model_name="courselesson",
            name="video_url",
            field=models.URLField(blank=True, max_length=1200),
        ),
    ]
