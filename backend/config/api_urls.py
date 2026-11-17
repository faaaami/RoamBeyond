"""API routes grouped by version. Add a `v2/` entry here when the contract changes."""

from django.urls import include, path

v1_patterns = [
    path("", include("apps.enquiries.urls")),
    path("", include("apps.catalog.urls")),
    path("", include("apps.pages.urls")),
]

urlpatterns = [
    path("v1/", include((v1_patterns, "v1"), namespace="v1")),
]
