"""
Settings shared by every environment.

Environment-specific modules (development, production, test) import from here
and override only what differs. Values come from environment variables, read
with django-environ; a `backend/.env` file is loaded if present.
"""

from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

import environ

BASE_DIR = Path(__file__).resolve().parents[2]

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SITE_NAME = "Roam Beyond"

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
# Empty here so development can fall back to a dummy; production refuses to start without it.
SECRET_KEY = env("DJANGO_SECRET_KEY", default="")
DEBUG = False
ALLOWED_HOSTS: list[str] = env.list("DJANGO_ALLOWED_HOSTS", default=[])

DJANGO_APPS = [
    # django.contrib.admin is deliberately not installed: staff use the custom
    # admin panel (admin-frontend/) through the API in apps/admin_api.
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]
THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "anymail",
    "rest_framework_simplejwt.token_blacklist",
]
LOCAL_APPS = [
    "apps.accounts",
    "apps.core",
    "apps.enquiries",
    "apps.catalog",
    "apps.pages",
    "apps.admin_api",
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "apps.core.request_id.RequestIDMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Database and cache
# ---------------------------------------------------------------------------
# PostgreSQL only, in every environment, so development and tests behave like
# production. Local default: the `roambeyond` database on this machine (see the
# README for setup). Production refuses to start without DATABASE_URL.
LOCAL_DATABASE_URL = "postgres://roambeyond:roambeyond@localhost:5432/roambeyond"


def postgres_config(url: str) -> dict:
    config = env.db_url_config(url)
    if config["ENGINE"] != "django.db.backends.postgresql":
        raise ImproperlyConfigured(
            f"DATABASE_URL must point to PostgreSQL (postgres://...), got {config['ENGINE']}."
        )
    return {
        **config,
        "CONN_MAX_AGE": env.int("DB_CONN_MAX_AGE", default=60),
        "CONN_HEALTH_CHECKS": True,
        # Fail fast instead of hanging when the database is unreachable.
        "OPTIONS": {**config.get("OPTIONS", {}), "connect_timeout": 5},
    }


DATABASES = {"default": postgres_config(env("DATABASE_URL", default="") or LOCAL_DATABASE_URL)}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CACHES = {"default": env.cache("CACHE_URL", default="locmemcache://")}

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-in"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static files (WhiteNoise) and uploaded media (photos added in the admin panel)
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = Path(env("MEDIA_ROOT", default="") or BASE_DIR / "media")

# Uploads go to the local disk unless an S3-compatible bucket is configured
# (AWS S3, Cloudflare R2, DigitalOcean Spaces, ...). Use a bucket in
# production: container disks are wiped on every deploy.
MEDIA_BUCKET = env("MEDIA_BUCKET", default="")
if MEDIA_BUCKET:
    _media_storage = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": MEDIA_BUCKET,
            "endpoint_url": env("MEDIA_ENDPOINT_URL", default="") or None,
            "region_name": env("MEDIA_REGION", default="") or None,
            "access_key": env("MEDIA_ACCESS_KEY_ID", default="") or None,
            "secret_key": env("MEDIA_SECRET_ACCESS_KEY", default="") or None,
            # Public, permanent URLs: the photos are shown on a public website.
            "custom_domain": env("MEDIA_CUSTOM_DOMAIN", default="") or None,
            "querystring_auth": False,
            "file_overwrite": False,
            "default_acl": None,
            "object_parameters": {"CacheControl": "public, max-age=31536000, immutable"},
        },
    }
else:
    _media_storage = {"BACKEND": "django.core.files.storage.FileSystemStorage"}

STORAGES = {
    "default": _media_storage,
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
# Serve /media/ from Django when files are on local disk. Fine for a small
# site behind a CDN; switch to a bucket for anything larger.
SERVE_MEDIA = env.bool("SERVE_MEDIA", default=not MEDIA_BUCKET)
# Base for absolute photo URLs in API responses when files are on local disk,
# e.g. "https://api.example.com". Empty means "use the request's host".
PUBLIC_MEDIA_BASE_URL = env("PUBLIC_MEDIA_BASE_URL", default="")
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# ---------------------------------------------------------------------------
# Reverse proxy
# ---------------------------------------------------------------------------
# When true, the client IP and scheme are read from X-Forwarded-* headers.
# Only enable behind a proxy you control, otherwise clients can spoof them.
TRUST_PROXY_HEADERS = env.bool("TRUST_PROXY_HEADERS", default=False)
if TRUST_PROXY_HEADERS:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    USE_X_FORWARDED_HOST = True

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework.authentication.SessionAuthentication"],
    # Deny by default. Public endpoints opt in with AllowAny explicitly.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_THROTTLE_RATES": {
        # Enquiry submissions per client IP. Matches the limit the Next.js route used.
        "enquiry": env("ENQUIRY_THROTTLE_RATE", default="5/10m"),
        # Staff sign-in attempts per client IP (accounts also lock, see apps/admin_api).
        "login": env("LOGIN_THROTTLE_RATE", default="10/15m"),
    },
    "NUM_PROXIES": 1 if TRUST_PROXY_HEADERS else None,
    "EXCEPTION_HANDLER": "apps.core.exceptions.exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

SPECTACULAR_SETTINGS = {
    "TITLE": f"{SITE_NAME} API",
    "DESCRIPTION": "Backend for the Roam Beyond travel agency website.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": r"/api/v[0-9]+",
    "ENUM_NAME_OVERRIDES": {
        "EnquiryKindEnum": "apps.enquiries.enums.EnquiryKind",
        "EnquiryStatusEnum": "apps.enquiries.enums.EnquiryStatus",
        "TripTypeEnum": "apps.core.enums.TripType",
        "CategoryEnum": "apps.catalog.enums.Category",
        "BudgetBandEnum": "apps.catalog.enums.BudgetBand",
    },
    # The single-value `kind` choice on each enquiry serializer is a discriminator.
    "ENUM_GENERATE_CHOICE_DESCRIPTION": True,
}

CORS_ALLOWED_ORIGINS: list[str] = env.list("CORS_ALLOWED_ORIGINS", default=[])
CSRF_TRUSTED_ORIGINS: list[str] = env.list("CSRF_TRUSTED_ORIGINS", default=CORS_ALLOWED_ORIGINS)


# ---------------------------------------------------------------------------
# Admin panel authentication (JWT), apps/admin_api
# ---------------------------------------------------------------------------
# Short-lived access tokens; refresh tokens rotate on every use and the old one
# is blacklisted, so a stolen refresh token stops working after one refresh.
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("JWT_ACCESS_MINUTES", default=15)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("JWT_REFRESH_DAYS", default=7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    # A separate key lets you sign everyone out (rotate it) without touching SECRET_KEY.
    "SIGNING_KEY": env("JWT_SIGNING_KEY", default="") or SECRET_KEY or "unset",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ISSUER": "roambeyond-api",
    "LEEWAY": 10,
}
# Failed sign-ins before an account is locked, and for how long.
LOGIN_MAX_FAILURES = env.int("LOGIN_MAX_FAILURES", default=5)
LOGIN_LOCKOUT_MINUTES = env.int("LOGIN_LOCKOUT_MINUTES", default=15)

# ---------------------------------------------------------------------------
# Website cache refresh (see apps/core/revalidation.py)
# ---------------------------------------------------------------------------
# The Next.js route that clears the site's content cache, and the shared
# secret it checks (REVALIDATE_SECRET in the site's environment).
FRONTEND_REVALIDATE_URL = env("FRONTEND_REVALIDATE_URL", default="")
FRONTEND_REVALIDATE_SECRET = env("FRONTEND_REVALIDATE_SECRET", default="")
FRONTEND_REVALIDATE_TIMEOUT = env.float("FRONTEND_REVALIDATE_TIMEOUT", default=3.0)

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
# Django 6.1 "mailers". Development and production swap the backend below.
MAILERS = {"default": {"BACKEND": "django.core.mail.backends.console.EmailBackend"}}
DEFAULT_FROM_EMAIL = env("ENQUIRY_FROM_EMAIL", default="Website enquiries <onboarding@resend.dev>")
SERVER_EMAIL = DEFAULT_FROM_EMAIL
ENQUIRY_TO_EMAIL = env("ENQUIRY_TO_EMAIL", default="enquiries@example.com")
ANYMAIL = {"RESEND_API_KEY": env("RESEND_API_KEY", default="")}
# Email visitors a copy of their enquiry when they give an email address.
ENQUIRY_ACKNOWLEDGE_VISITORS = env.bool("ENQUIRY_ACKNOWLEDGE_VISITORS", default=True)
# Public URL of the admin panel (admin-frontend/), e.g. https://admin.example.com.
# Used for the "Open in the admin panel" link in agency emails; empty leaves it out.
ADMIN_PANEL_URL = env("ADMIN_PANEL_URL", default="")
# Public URL of the website, e.g. https://www.example.com.
FRONTEND_URL = env("FRONTEND_URL", default="")

# ---------------------------------------------------------------------------
# Logging: everything to stdout so the platform collects it
# ---------------------------------------------------------------------------
LOG_LEVEL = env("LOG_LEVEL", default="INFO")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s %(levelname)s [%(name)s] [%(request_id)s] %(message)s",
        },
    },
    "filters": {"request_id": {"()": "apps.core.request_id.RequestIDLogFilter"}},
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "filters": ["request_id"],
        },
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "django": {"level": LOG_LEVEL, "propagate": True},
        "django.request": {"level": "WARNING", "propagate": True},
        "apps": {"level": LOG_LEVEL, "propagate": True},
    },
}
