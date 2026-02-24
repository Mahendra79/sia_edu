from django.contrib import admin

from payments.models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "course", "total", "payment_status", "currency", "created_at")
    list_filter = ("payment_status", "currency", "created_at")
    search_fields = ("user__email", "course__title", "stripe_session_id")

