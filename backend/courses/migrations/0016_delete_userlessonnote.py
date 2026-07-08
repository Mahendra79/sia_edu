from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0015_userlessonnote'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UserLessonNote',
        ),
    ]
