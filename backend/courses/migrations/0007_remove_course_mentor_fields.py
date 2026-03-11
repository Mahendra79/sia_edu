from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0006_course_final_price"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="course",
            name="mentor_bio",
        ),
        migrations.RemoveField(
            model_name="course",
            name="mentor_name",
        ),
        migrations.RemoveField(
            model_name="course",
            name="mentor_title",
        ),
    ]
