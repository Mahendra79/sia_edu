from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.utils.text import slugify

from courses.models import Course

STATIC_PATHS = [
    ("", "1.0"),
    ("login", "0.3"),
    ("signup", "0.3"),
    ("privacy", "0.2"),
    ("terms", "0.2"),
]


def sitemap_view(request):
    base = settings.FRONTEND_BASE_URL.rstrip("/")
    today = timezone.now().date().isoformat()

    entries = []
    for path, priority in STATIC_PATHS:
        entries.append((f"{base}/{path}", today, priority))

    courses = Course.objects.filter(is_deleted=False, is_active=True).only("id", "title", "updated_at")
    for course in courses:
        slug = slugify(course.title)
        loc = f"{base}/course/{course.id}-{slug}" if slug else f"{base}/course/{course.id}"
        last_mod = course.updated_at.date().isoformat() if course.updated_at else today
        entries.append((loc, last_mod, "0.7"))

    parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod, priority in entries:
        parts.append(
            f"<url><loc>{loc}</loc><lastmod>{lastmod}</lastmod><priority>{priority}</priority></url>"
        )
    parts.append("</urlset>")

    return HttpResponse("".join(parts), content_type="application/xml")
