from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0008_courselesson_userlessonprogress_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="courselesson",
            name="pdf_url",
            field=models.URLField(blank=True, max_length=1200),
        ),
    ]
