"""
Test suite: PostgreSQL (like production), fast hashing, in-memory cache, captured email.

pytest-django creates and drops a `test_<name>` database next to the one in
DATABASE_URL (default: the local `roambeyond` database), so the role needs CREATEDB.
"""

from .base import *  # noqa: F403

DEBUG = False
SECRET_KEY = "test-only-key-that-is-long-enough-for-hs256-signing"
ALLOWED_HOSTS = ["testserver", "localhost"]

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
MAILERS = {"default": {"BACKEND": "django.core.mail.backends.locmem.EmailBackend"}}
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True
ENQUIRY_TO_EMAIL = "agency@example.com"
TRUST_PROXY_HEADERS = False
FRONTEND_REVALIDATE_URL = ""
SERVE_MEDIA = True
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
SIMPLE_JWT = {**SIMPLE_JWT, "SIGNING_KEY": SECRET_KEY}  # noqa: F405
