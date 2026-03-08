from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="paymenttransaction",
            name="payments_pa_stripe__75394c_idx",
        ),
        migrations.RemoveField(
            model_name="paymenttransaction",
            name="stripe_payment_intent",
        ),
        migrations.RemoveField(
            model_name="paymenttransaction",
            name="stripe_session_id",
        ),
        migrations.AddField(
            model_name="paymenttransaction",
            name="razorpay_order_id",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="paymenttransaction",
            name="razorpay_payment_id",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="paymenttransaction",
            name="razorpay_signature",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="paymenttransaction",
            name="currency",
            field=models.CharField(default="inr", max_length=10),
        ),
        migrations.AddIndex(
            model_name="paymenttransaction",
            index=models.Index(fields=["razorpay_order_id"], name="payments_pa_razorpa_17870d_idx"),
        ),
    ]
