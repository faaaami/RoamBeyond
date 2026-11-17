"""Local development: permissive hosts, console email, browsable API."""

from .base import *  # noqa: F403
from .base import REST_FRAMEWORK, SIMPLE_JWT, env

DEBUG = True
SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-only-insecure-key-change-me-0123456789")
SIMPLE_JWT = {**SIMPLE_JWT, "SIGNING_KEY": env("JWT_SIGNING_KEY", default="") or SECRET_KEY}
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
INTERNAL_IPS = ["127.0.0.1"]

# The website and the admin panel (/admin, same site) post from the browser.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# Log emails to the terminal unless a Resend key is configured.
if env("RESEND_API_KEY", default=""):
    MAILERS = {"default": {"BACKEND": "anymail.backends.resend.EmailBackend"}}

# Refresh the local Next.js dev server after admin edits.
# `or`: an empty value copied from .env.example means "use the default".
FRONTEND_REVALIDATE_URL = (
    env("FRONTEND_REVALIDATE_URL", default="") or "http://localhost:3000/api/revalidate"
)
FRONTEND_REVALIDATE_SECRET = (
    env("FRONTEND_REVALIDATE_SECRET", default="") or "dev-revalidate-secret"
)

ADMIN_PANEL_URL = env("ADMIN_PANEL_URL", default="") or "http://localhost:3000/admin"
FRONTEND_URL = env("FRONTEND_URL", default="") or "http://localhost:3000"

# Serve static files straight from the apps; no collectstatic needed locally.
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}
