"""
Top-level routes.

The public API is versioned under /api/v1/ (config/api_urls.py); the admin
panel's API is /api/admin/ (apps/admin_api). The health check is /health/ for
the load balancer, and uploaded photos are served at /media/ unless they are
stored in a bucket.
"""

from django.conf import settings
from django.urls import include, path, re_path
from django.views.static import serve

from apps.core.views import HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("api/admin/", include("apps.admin_api.urls")),
    path("api/", include("config.api_urls")),
]

if settings.SERVE_MEDIA:
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]

if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
    ]

# JSON errors under /api/, Django's HTML pages elsewhere (apps/core/exceptions.py).
handler400 = "apps.core.exceptions.handler400"
handler403 = "apps.core.exceptions.handler403"
handler404 = "apps.core.exceptions.handler404"
handler500 = "apps.core.exceptions.handler500"
