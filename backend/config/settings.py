import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlsplit
from urllib.parse import unquote

from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _dedupe_preserve_order(values: list[str]) -> list[str]:
    deduped: list[str] = []
    for item in values:
        if item not in deduped:
            deduped.append(item)
    return deduped


def _normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/")


def _origin_from_url(url: str) -> str:
    value = _normalize_origin(url)
    if not value:
        return ""
    parsed = urlsplit(value)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return value


def _normalize_allowed_host(host: str) -> str:
    value = host.strip()
    if not value:
        return ""
    if value == "*" or value.startswith("."):
        return value

    parsed = urlsplit(value if "://" in value else f"//{value}")
    if parsed.hostname:
        return parsed.hostname

    # Fallback for malformed values: keep only hostname fragment.
    return value.split("/")[0].split(":")[0].strip()


def _database_from_url(database_url: str) -> dict:
    parsed = urlsplit(database_url.strip())
    scheme = (parsed.scheme or "").lower()
    if scheme not in {"postgres", "postgresql", "psql"}:
        raise ImproperlyConfigured("DATABASE_URL must use a PostgreSQL scheme (postgres/postgresql).")

    db_name = parsed.path.lstrip("/")
    if not parsed.hostname or not db_name:
        raise ImproperlyConfigured("DATABASE_URL must include host and database name.")

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": db_name,
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname,
        "PORT": str(parsed.port or 5432),
        "CONN_MAX_AGE": 60,
    }


LOCAL_FRONTEND_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
RENDER_FRONTEND_ORIGINS = ["https://siasoftwareinnovationseducation.onrender.com"]
DEFAULT_CORS_ORIGINS = [*LOCAL_FRONTEND_ORIGINS, *RENDER_FRONTEND_ORIGINS]
DEFAULT_CSRF_TRUSTED_ORIGINS = ["http://127.0.0.1:8000", "http://localhost:8000", *DEFAULT_CORS_ORIGINS]
DEFAULT_ALLOWED_HOSTS = ["127.0.0.1", "localhost", "sia-edu.onrender.com"]


DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set.")

FRONTEND_BASE_URL = _normalize_origin(os.getenv("FRONTEND_BASE_URL", "http://localhost:5173"))
FRONTEND_ORIGIN = _origin_from_url(FRONTEND_BASE_URL)

frontend_host = _normalize_allowed_host(FRONTEND_ORIGIN)
render_external_hostname = _normalize_allowed_host(os.getenv("RENDER_EXTERNAL_HOSTNAME", ""))
allowed_hosts_from_env = [_normalize_allowed_host(host) for host in _split_csv(os.getenv("DJANGO_ALLOWED_HOSTS", ""))]
ALLOWED_HOSTS = _dedupe_preserve_order(
    [
        host
        for host in [
            *DEFAULT_ALLOWED_HOSTS,
            *allowed_hosts_from_env,
            frontend_host,
            render_external_hostname,
        ]
        if host
    ]
)
if DEBUG:
    for host in ("testserver", "0.0.0.0"):
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)

CSRF_TRUSTED_ORIGINS = _dedupe_preserve_order(
    [
        origin
        for origin in [
            *DEFAULT_CSRF_TRUSTED_ORIGINS,
            *[_normalize_origin(origin) for origin in _split_csv(os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", ""))],
            FRONTEND_ORIGIN,
        ]
        if origin
    ]
)

INSTALLED_APPS = [
    "corsheaders",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "accounts",
    "courses",
    "payments",
    "analytics",
    "deleted_records",
    "chatbot",
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "corsheaders.middleware.CorsMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


DB_ENGINE = os.getenv("DB_ENGINE", "django.db.backends.postgresql")
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL:
    DATABASES = {
        "default": _database_from_url(DATABASE_URL)
    }
elif DB_ENGINE == "django.db.backends.sqlite3":
    DATABASES = {
        "default": {
            "ENGINE": DB_ENGINE,
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": DB_ENGINE,
            "NAME": os.getenv("DB_NAME", "SIA_EDU"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "CONN_MAX_AGE": 60,
        }
    }

AUTH_USER_MODEL = "accounts.User"


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "staticfiles"

DJANGO_LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO").upper()

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": DJANGO_LOG_LEVEL,
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = _dedupe_preserve_order(
    [
        origin
        for origin in [
            *DEFAULT_CORS_ORIGINS,
            *[_normalize_origin(origin) for origin in _split_csv(os.getenv("CORS_ALLOWED_ORIGINS", ""))],
            FRONTEND_ORIGIN,
        ]
        if origin
    ]
)
CORS_ALLOW_CREDENTIALS = True
if DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^http://localhost:\d+$",
        r"^http://127\.0\.0\.1:\d+$",
    ]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_RESOURCE_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

if DEBUG:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
else:
    SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "True").lower() == "true"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", "True").lower() == "true"
    SECURE_HSTS_PRELOAD = os.getenv("DJANGO_SECURE_HSTS_PRELOAD", "True").lower() == "true"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "config.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "40/min",
        "user": "200/min",
        "auth": "10/min",
        "payments": "20/min",
        "webhook": "60/min",
        "chatbot": "30/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@sia-edu.local")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "20"))
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "").strip()
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", DEFAULT_FROM_EMAIL).strip()
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "").strip()
BREVO_API_URL = os.getenv("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email").strip()
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", DEFAULT_FROM_EMAIL).strip()
RESEND_API_URL = os.getenv("RESEND_API_URL", "https://api.resend.com/emails").strip()
AUTH_DEBUG_TOKENS = os.getenv("AUTH_DEBUG_TOKENS", "False").lower() == "true"

WEBSITE_NAME = os.getenv("WEBSITE_NAME", "SIA_EDU")
WEBSITE_LOGO_URL = os.getenv("WEBSITE_LOGO_URL", "https://dummyimage.com/96x96/0b1220/ffffff.png&text=SIA")
WEBSITE_LOGO_PATH = os.getenv("WEBSITE_LOGO_PATH", str((BASE_DIR / ".." / "frontend" / "src" / "assets" / "image.png").resolve()))
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", DEFAULT_FROM_EMAIL)
COMPANY_LEGAL_NAME = os.getenv("COMPANY_LEGAL_NAME", "SIA Software Innovations Private Limited").strip()
COMPANY_TAGLINE = os.getenv("COMPANY_TAGLINE", "ACCESS BEYOND LIMITS").strip()
COMPANY_ADDRESS_LINE1 = os.getenv("COMPANY_ADDRESS_LINE1", "SIA Software Innovations Private Limited").strip()
COMPANY_ADDRESS_LINE2 = os.getenv("COMPANY_ADDRESS_LINE2", "Andhra Pradesh, India").strip()
COMPANY_ADDRESS_LINE3 = os.getenv("COMPANY_ADDRESS_LINE3", "").strip()
COMPANY_CIN = os.getenv("COMPANY_CIN", "U62013AP2025PTC122642").strip()
COMPANY_DPIIT = os.getenv("COMPANY_DPIIT", "DIPP235818").strip()
COMPANY_GSTIN = os.getenv("COMPANY_GSTIN", "").strip()
INVOICE_CONTACT_EMAIL = os.getenv("INVOICE_CONTACT_EMAIL", "info@siasoftwareinnovations.com").strip()
INVOICE_CONTACT_PHONE = os.getenv("INVOICE_CONTACT_PHONE", "").strip()
INSTAGRAM_LINK = os.getenv("INSTAGRAM_LINK", "https://www.instagram.com/siasoftwareinnovations?igsh=enZrY2JkZDZ3Y2F0")
LINKEDIN_LINK = os.getenv("LINKEDIN_LINK", "https://www.linkedin.com/company/sia-software-innovations-private-limited/")
YOUTUBE_LINK = os.getenv("YOUTUBE_LINK", "https://www.youtube.com/channel/UCljQ1Lrvl_1wO-gcQ0EGuYw")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
RAZORPAY_CURRENCY = os.getenv("RAZORPAY_CURRENCY", "inr")
DEFAULT_TAX_RATE = os.getenv("DEFAULT_TAX_RATE", "0.18")
DEV_PAYMENT_MODE = os.getenv("DEV_PAYMENT_MODE", "False").lower() == "true"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_CHAT_MODEL = os.getenv("GROQ_CHAT_MODEL", "llama-3.1-8b-instant").strip()
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions").strip()
CHATBOT_MAX_HISTORY = int(os.getenv("CHATBOT_MAX_HISTORY", "8"))
CHATBOT_MAX_TOKENS = int(os.getenv("CHATBOT_MAX_TOKENS", "420"))
CHATBOT_RAG_CACHE_TTL = int(os.getenv("CHATBOT_RAG_CACHE_TTL", "300"))

FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

CACHE_BACKEND = os.getenv("DJANGO_CACHE_BACKEND", "locmem").strip().lower()
CACHE_DEFAULT_TIMEOUT = int(os.getenv("DJANGO_CACHE_DEFAULT_TIMEOUT", "120"))

if CACHE_BACKEND == "redis":
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": os.getenv("DJANGO_REDIS_URL", "redis://127.0.0.1:6379/1"),
            "TIMEOUT": CACHE_DEFAULT_TIMEOUT,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "sia-edu-local-cache",
            "TIMEOUT": CACHE_DEFAULT_TIMEOUT,
        }
    }
