"""
Catalog CRUD.

    /api/admin/packages/        ?q=&destination=<id>&category=&budget=&published=&featured=
                                &ordering=
    /api/admin/packages/<id>/duplicate/   POST -> a hidden copy to edit
    /api/admin/destinations/    ?q=&published=&popular=&ordering=
    /api/admin/reviews/         ?q=&published=&ordering=
    /api/admin/photo-credits/   ?q=&licence=&ordering=

Create and update accept JSON, or multipart with the JSON in a `data` field
plus image files (see base.JSONWithFilesParser).
"""

from django.db import transaction
from django.db.models import Count, Model, ProtectedError, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.catalog.models import Destination, PhotoCredit, Review, TourPackage
from apps.core.exceptions import ApiError

from .. import activity
from ..base import StaffModelViewSet
from ..serializers.catalog import (
    DestinationSerializer,
    PhotoCreditSerializer,
    ReviewSerializer,
    TourPackageListSerializer,
    TourPackageSerializer,
)


class TourPackageViewSet(StaffModelViewSet):
    queryset = TourPackage.objects.select_related("destination").prefetch_related(
        "itinerary", "photos"
    )
    search_fields = ("name", "summary", "destination__name")
    filter_fields = {
        "destination": "destination_id",
        "category": "category",
        "budget": "budget",
        "published": "is_published",
        "featured": "featured",
    }
    ordering_fields = ("name", "price_from", "days", "sort_order", "updated_at")
    ordering = ("sort_order", "created_at")

    def get_serializer_class(self):
        return TourPackageListSerializer if self.action == "list" else TourPackageSerializer

    @action(detail=True, methods=["post"])
    def duplicate(self, request: Request, pk: str) -> Response:
        if not request.user.has_perm("catalog.add_tourpackage"):
            raise ApiError(
                "You do not have permission to add packages.",
                code="permission_denied",
                status_code=403,
            )
        source = self.get_object()
        with transaction.atomic():
            days = list(source.itinerary.all())
            photos = list(source.photos.all())
            copy = TourPackage.objects.get(pk=source.pk)
            copy.pk = None
            copy.id = None
            copy.name = f"{source.name} (copy)"[:120]
            copy.slug = _free_slug(f"{source.slug}-copy")
            copy.is_published = False  # never goes live by accident
            copy.featured = False
            copy.save()
            for row in days + photos:
                row.pk = None
                row.package = copy
                row.save()
            activity.log_addition(request.user, copy)
        return Response(
            TourPackageSerializer(copy, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


def _free_slug(base: str) -> str:
    slug, n = base[:80], 2
    while TourPackage.objects.filter(slug=slug).exists():
        suffix = f"-{n}"
        slug, n = f"{base[: 80 - len(suffix)]}{suffix}", n + 1
    return slug


class DestinationViewSet(StaffModelViewSet):
    queryset = Destination.objects.annotate(
        package_count=Count("packages", filter=Q(packages__is_published=True))
    )
    serializer_class = DestinationSerializer
    search_fields = ("name", "region", "tagline")
    filter_fields = {"published": "is_published", "popular": "popular", "region": "region"}
    ordering_fields = ("name", "region", "sort_order", "package_count", "updated_at")
    ordering = ("sort_order", "name")

    def perform_destroy(self, instance: Model) -> None:
        try:
            super().perform_destroy(instance)
        except ProtectedError as exc:
            assert isinstance(instance, Destination)
            count = instance.packages.count()
            raise ApiError(
                f"{instance.name} has {count} tour package{'' if count == 1 else 's'}. "
                "Move or delete them first.",
                code="protected",
                status_code=status.HTTP_409_CONFLICT,
            ) from exc


class ReviewViewSet(StaffModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    search_fields = ("name", "trip", "text")
    filter_fields = {"published": "is_published"}
    ordering_fields = ("name", "sort_order", "created_at")
    ordering = ("sort_order", "created_at")


class PhotoCreditViewSet(StaffModelViewSet):
    queryset = PhotoCredit.objects.all()
    serializer_class = PhotoCreditSerializer
    search_fields = ("title", "author", "used_for", "source")
    filter_fields = {"licence": "licence"}
    ordering_fields = ("title", "author", "licence", "created_at")
    ordering = ("title",)
