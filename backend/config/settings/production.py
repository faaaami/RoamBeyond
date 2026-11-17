"""
Production: strict hosts, HTTPS only, Resend for email, Postgres required.

`python manage.py check --deploy` validates most of this; run it in CI.
"""

import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import CACHES, CORS_ALLOWED_ORIGINS, SECRET_KEY, SIMPLE_JWT, env

DEBUG = False

if not env("DJANGO_SECRET_KEY", default=""):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set in production.")

_jwt_signing_key: str = env("JWT_SIGNING_KEY", default="") or SECRET_KEY
SIMPLE_JWT = {**SIMPLE_JWT, "SIGNING_KEY": _jwt_signing_key}
if len(_jwt_signing_key) < 32:
    raise ImproperlyConfigured("JWT_SIGNING_KEY (or DJANGO_SECRET_KEY) must be 32+ characters.")

if not env.list("DJANGO_ALLOWED_HOSTS", default=[]):
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must be set in production.")

if not env("DATABASE_URL", default=""):
    raise ImproperlyConfigured("Set DATABASE_URL to the production PostgreSQL database.")

# Login lockouts and rate limits are counted in the cache. In-memory caches are
# per process, so with several gunicorn workers each one keeps its own count.
if CACHES["default"]["BACKEND"].endswith("LocMemCache"):
    raise ImproperlyConfigured(
        "Set CACHE_URL to Redis in production: lockouts and rate limits must be shared "
        "by every worker."
    )

# Behind a load balancer the client IP is in X-Forwarded-For. If this is left off, every
# visitor looks like the load balancer, so one person's failed logins lock everyone out.
# If it is on, the proxy must overwrite that header. Make the choice explicit.
if "TRUST_PROXY_HEADERS" not in os.environ:
    raise ImproperlyConfigured(
        "Set TRUST_PROXY_HEADERS to true behind a load balancer you control, or false otherwise."
    )

# The website is served from another origin, so the browser needs its address to call the API.
if not CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS must list the website address in production.")

# HTTPS everywhere. HSTS starts at one hour; raise it once the deployment is proven.
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=3600)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

MAILERS = {"default": {"BACKEND": "anymail.backends.resend.EmailBackend"}}
if not env("RESEND_API_KEY", default=""):
    raise ImproperlyConfigured("RESEND_API_KEY must be set in production.")

if env("FRONTEND_REVALIDATE_URL", default="") and not env("FRONTEND_REVALIDATE_SECRET", default=""):
    raise ImproperlyConfigured(
        "Set FRONTEND_REVALIDATE_SECRET when FRONTEND_REVALIDATE_URL is set."
    )
