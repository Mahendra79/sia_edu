from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path

from config.sitemap import sitemap_view


def health_check(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("sitemap.xml", sitemap_view, name="sitemap"),
    path('admin/', admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/courses/", include("courses.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/deleted-records/", include("deleted_records.urls")),
    path("api/chatbot/", include("chatbot.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
