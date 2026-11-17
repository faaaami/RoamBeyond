from django.db import DatabaseError, connection
from django.http import HttpRequest, JsonResponse
from django.views import View


class HealthView(View):
    """
    Liveness and readiness probe for the load balancer.

    Returns 200 when the app can reach its database, 503 otherwise. Kept
    outside DRF so it works even if API configuration is broken.
    """

    def get(self, request: HttpRequest) -> JsonResponse:
        checks = {"database": self._check_database()}
        healthy = all(status == "ok" for status in checks.values())
        return JsonResponse(
            {"status": "ok" if healthy else "degraded", "checks": checks},
            status=200 if healthy else 503,
        )

    @staticmethod
    def _check_database() -> str:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except DatabaseError:
            return "unavailable"
        return "ok"
