"""Public, read-only page content for the website."""

from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from . import selectors
from .models import LegalPage


class PublicContentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class SiteSettingsView(PublicContentView):
    """GET /api/v1/site-settings/ - contact details, budgets and policies."""

    def get(self, request: Request) -> Response:
        return Response(selectors.site_settings())


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class HomePageView(PublicContentView):
    """GET /api/v1/pages/home/"""

    def get(self, request: Request) -> Response:
        return Response(selectors.home_page(request))


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class AboutPageView(PublicContentView):
    """GET /api/v1/pages/about/"""

    def get(self, request: Request) -> Response:
        return Response(selectors.about_page(request))


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class OtherPagesView(PublicContentView):
    """GET /api/v1/pages/other/ - packages, destinations, plan, contact and thank-you text."""

    def get(self, request: Request) -> Response:
        return Response(selectors.other_pages())


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class LegalPageView(PublicContentView):
    """GET /api/v1/pages/privacy/ and /api/v1/pages/terms/"""

    kind: str = LegalPage.Kind.PRIVACY

    def get(self, request: Request) -> Response:
        return Response(selectors.legal_page(self.kind))


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class NavigationView(PublicContentView):
    """GET /api/v1/navigation/ - header and footer links."""

    def get(self, request: Request) -> Response:
        return Response(selectors.navigation())


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class TripTypesView(PublicContentView):
    """GET /api/v1/trip-types/ - the five trip types with their wording."""

    def get(self, request: Request) -> Response:
        return Response(selectors.trip_types())


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class VocabularyView(PublicContentView):
    """GET /api/v1/vocabulary/ - categories, trip-length bands and budget bands."""

    def get(self, request: Request) -> Response:
        return Response(selectors.vocabulary())


@extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
class PageSeoView(PublicContentView):
    """GET /api/v1/seo/ - page titles and descriptions keyed by path."""

    def get(self, request: Request) -> Response:
        return Response(selectors.page_seo())
