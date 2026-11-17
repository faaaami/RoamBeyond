"""
System health for the admin panel.

    GET /api/admin/health/   status of each part the panel depends on

The database check runs a real query. Everything else reads settings or a
cheap count, so the endpoint is safe to poll from the health page.
"""

import time
from typing import Any

from django.conf import settings
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from apps.enquiries.models import Enquiry

from ..base import StaffAPIMixin


def _check(key: str, label: str, status: str, detail: str, **extra: Any) -> dict[str, Any]:
    """status: "ok" (fine), "warning" (works, but needs attention) or "error" (broken)."""
    return {"key": key, "label": label, "status": status, "detail": detail, **extra}


class HealthView(StaffAPIMixin, APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        checks = [
            self._database(),
            self._migrations(),
            self._email(),
            self._failed_emails(),
            self._media(),
            self._website_refresh(),
        ]
        overall = (
            "error"
            if any(c["status"] == "error" for c in checks)
            else "warning"
            if any(c["status"] == "warning" for c in checks)
            else "ok"
        )
        return Response(
            {
                "status": overall,
                "checkedAt": timezone.now(),
                "environment": "development" if settings.DEBUG else "production",
                "checks": checks,
            }
        )

    def _database(self) -> dict[str, Any]:
        started = time.perf_counter()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as exc:  # any driver error means the panel cannot work
            return _check(
                "database",
                "Database",
                "error",
                f"Cannot reach PostgreSQL: {exc.__class__.__name__}",
            )
        ms = round((time.perf_counter() - started) * 1000)
        slow = ms > 500
        return _check(
            "database",
            "Database",
            "warning" if slow else "ok",
            f"Responded in {ms} ms",
            latencyMs=ms,
        )

    def _migrations(self) -> dict[str, Any]:
        try:
            plan = MigrationExecutor(connection).migration_plan(
                MigrationExecutor(connection).loader.graph.leaf_nodes()
            )
        except Exception:
            return _check(
                "migrations", "Database migrations", "error", "Could not read the migration state"
            )
        pending = len(plan)
        if pending:
            return _check(
                "migrations",
                "Database migrations",
                "error",
                f"{pending} migration(s) not applied yet. Run manage.py migrate.",
            )
        return _check("migrations", "Database migrations", "ok", "All migrations are applied")

    def _email(self) -> dict[str, Any]:
        if settings.ANYMAIL.get("RESEND_API_KEY"):
            return _check(
                "email",
                "Enquiry email",
                "ok",
                f"Sending to {settings.ENQUIRY_TO_EMAIL} through Resend",
            )
        status = "error" if not settings.DEBUG else "warning"
        return _check(
            "email", "Enquiry email", status, "No RESEND_API_KEY set: enquiry emails are not sent"
        )

    def _failed_emails(self) -> dict[str, Any]:
        failed = (
            Enquiry.objects.filter(notified_at__isnull=True).exclude(notification_error="").count()
        )
        if failed:
            return _check(
                "failed_emails",
                "Enquiry emails",
                "warning",
                f"{failed} enquir{'y' if failed == 1 else 'ies'} not emailed to the team",
                count=failed,
            )
        return _check("failed_emails", "Enquiry emails", "ok", "No failed deliveries", count=0)

    def _media(self) -> dict[str, Any]:
        if settings.MEDIA_BUCKET:
            return _check("media", "Photo storage", "ok", f"Bucket {settings.MEDIA_BUCKET}")
        if settings.DEBUG:
            return _check("media", "Photo storage", "ok", "Local disk (development)")
        return _check(
            "media",
            "Photo storage",
            "warning",
            "Local disk: photos are lost on redeploy. Set MEDIA_BUCKET.",
        )

    def _website_refresh(self) -> dict[str, Any]:
        if settings.FRONTEND_REVALIDATE_URL:
            return _check(
                "website_refresh", "Website refresh", "ok", "Saves refresh the website at once"
            )
        return _check(
            "website_refresh",
            "Website refresh",
            "warning",
            "FRONTEND_REVALIDATE_URL not set: the site updates on its daily refresh",
        )
