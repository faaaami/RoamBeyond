"""
Public, read-only catalog endpoints. The lists are small (tens of rows), so
they are returned whole rather than paginated; the website filters them itself.
"""

from django.http import Http404
from rest_framework import generics
from rest_framework.permissions import AllowAny

from . import selectors
from .serializers import (
    DestinationSerializer,
    PackageDetailSerializer,
    PackageSummarySerializer,
    PhotoCreditSerializer,
    ReviewSerializer,
)


class PublicListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None


class DestinationListView(PublicListView):
    """GET /api/v1/destinations/ - published destinations with their package counts."""

    serializer_class = DestinationSerializer

    def get_queryset(self):
        return selectors.published_destinations()


class PackageListView(PublicListView):
    """GET /api/v1/packages/ - every published package, with card and filter fields."""

    serializer_class = PackageSummarySerializer

    def get_queryset(self):
        return selectors.published_packages()


class PackageDetailView(generics.RetrieveAPIView):
    """GET /api/v1/packages/<slug>/ - one package with itinerary and gallery."""

    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PackageDetailSerializer

    def get_object(self):
        package = selectors.package_detail(self.kwargs["slug"])
        if package is None:
            raise Http404
        return package


class ReviewListView(PublicListView):
    """GET /api/v1/reviews/"""

    serializer_class = ReviewSerializer

    def get_queryset(self):
        return selectors.published_reviews()


class PhotoCreditListView(PublicListView):
    """GET /api/v1/photo-credits/"""

    serializer_class = PhotoCreditSerializer

    def get_queryset(self):
        return selectors.photo_credits()
