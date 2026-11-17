"""
Website page content.

    GET/PATCH /api/admin/pages/site-settings/
    GET/PATCH /api/admin/pages/home/          (with steps and scroll story scenes)
    GET/PATCH /api/admin/pages/about/         (with facts, values, two photos)
    GET/PATCH /api/admin/pages/other/
    GET       /api/admin/legal-pages/         privacy and terms
    CRUD      /api/admin/nav-links/           header and footer links
    GET/PATCH /api/admin/trip-types/          wording for each trip type
    GET/PATCH /api/admin/legal-pages/<id>/    (with sections)

The four pages are single records: there is nothing to list, create or delete.
Saving any of them refreshes the website (apps/pages/signals.py).
"""

from typing import Any

from django.db import transaction
from rest_framework import parsers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from apps.pages.models import (
    AboutPage,
    HomePage,
    LegalPage,
    NavLink,
    OtherPages,
    PageSeo,
    SiteSettings,
    TripTypeInfo,
)

from .. import activity
from ..base import JSONWithFilesParser, StaffAPIMixin, StaffModelViewSet, changed_fields, snapshot
from ..permissions import IsStaff, StaffModelPermissions
from ..serializers.pages import (
    AboutPageSerializer,
    HomePageSerializer,
    LegalPageSerializer,
    NavLinkSerializer,
    OtherPagesSerializer,
    PageSeoSerializer,
    SiteSettingsSerializer,
    TripTypeInfoSerializer,
)


class SingletonView(StaffAPIMixin, APIView):
    """GET or PATCH the one row of a page model."""

    permission_classes = [IsStaff, StaffModelPermissions]
    parser_classes = [parsers.JSONParser, JSONWithFilesParser]
    model: Any = SiteSettings  # a SingletonModel subclass
    serializer_class: Any = SiteSettingsSerializer

    def get_queryset(self):  # used by StaffModelPermissions to find the model
        return self.model._default_manager.all()

    def get(self, request: Request) -> Response:
        page = self.model.load()
        return Response(self.serializer_class(page, context={"request": request}).data)

    def patch(self, request: Request) -> Response:
        page = self.model.load()
        serializer = self.serializer_class(
            page, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            before = snapshot(page, serializer.validated_data)
            page = serializer.save()
            activity.log_change(request.user, page, changed_fields(page, before))
        return Response(self.serializer_class(page, context={"request": request}).data)


def singleton(model, serializer):
    view = type(
        f"{model.__name__}View", (SingletonView,), {"model": model, "serializer_class": serializer}
    )
    return extend_schema(responses=serializer, request=serializer)(view)


SiteSettingsView = singleton(SiteSettings, SiteSettingsSerializer)
HomePageView = singleton(HomePage, HomePageSerializer)
AboutPageView = singleton(AboutPage, AboutPageSerializer)
OtherPagesView = singleton(OtherPages, OtherPagesSerializer)


class LegalPageViewSet(StaffModelViewSet):
    queryset = LegalPage.objects.prefetch_related("sections").order_by("kind")
    serializer_class = LegalPageSerializer
    http_method_names = ["get", "patch", "head", "options"]
    pagination_class = None  # type: ignore[assignment]  # just two pages


class NavLinkViewSet(StaffModelViewSet):
    """GET/POST /api/admin/nav-links/ and PATCH/DELETE /<id>/"""

    queryset = NavLink.objects.all()
    serializer_class = NavLinkSerializer
    search_fields = ("label", "href")
    ordering_fields = ("position", "label")
    ordering = ("position", "id")


class TripTypeInfoViewSet(StaffModelViewSet):
    """The five trip types are fixed: list and edit their wording only."""

    queryset = TripTypeInfo.objects.all()
    serializer_class = TripTypeInfoSerializer
    http_method_names = ["get", "head", "options", "put", "patch"]
    ordering = ("position", "id")


class PageSeoViewSet(StaffModelViewSet):
    """Page titles and descriptions. Pages are fixed: list and edit only."""

    queryset = PageSeo.objects.all()
    serializer_class = PageSeoSerializer
    http_method_names = ["get", "head", "options", "put", "patch"]
    search_fields = ("path", "title")
    ordering = ("path",)
