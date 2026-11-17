from typing import Any

from django.db import transaction
from rest_framework import serializers

from drf_spectacular.utils import extend_schema_serializer

from apps.catalog.enums import BudgetBand, Category, TripType
from apps.catalog.models import (
    Destination,
    ItineraryDay,
    PackagePhoto,
    PhotoCredit,
    Review,
    TourPackage,
)

from ..base import sync_children
from .base import CamelCaseMixin, ChildSerializer, MediaField


def _require_photo(
    instance, attrs: dict[str, Any], file_key: str, link_key: str, message: str
) -> None:
    """A record needs a photo: an uploaded file or a link. Either may already be saved."""
    if file_key in attrs:
        has_file = bool(attrs[file_key])
    else:
        has_file = bool(instance and getattr(instance, file_key))
    if link_key in attrs:
        has_link = bool(attrs[link_key])
    else:
        has_link = bool(instance and getattr(instance, link_key))
    if not has_file and not has_link:
        raise serializers.ValidationError({file_key: message})


# ---------------------------------------------------------------------------
# Destinations
# ---------------------------------------------------------------------------


@extend_schema_serializer(component_name="AdminDestination")
class DestinationSerializer(CamelCaseMixin, serializers.ModelSerializer):
    image = MediaField(required=False, allow_null=True)
    known_for = serializers.ListField(
        child=serializers.CharField(max_length=80), max_length=12, required=False
    )
    package_count = serializers.SerializerMethodField()

    class Meta:
        model = Destination
        fields = (
            "id",
            "name",
            "slug",
            "region",
            "tagline",
            "description",
            "best_season",
            "known_for",
            "image",
            "image_link",
            "popular",
            "is_published",
            "sort_order",
            "package_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        _require_photo(self.instance, attrs, "image", "image_link", "Add a photo or a photo link.")
        return attrs

    def get_package_count(self, obj: Destination) -> int:
        """Published packages. Lists annotate it in one query; single rows count here."""
        annotated = getattr(obj, "package_count", None)
        return (
            annotated if annotated is not None else obj.packages.filter(is_published=True).count()
        )


# ---------------------------------------------------------------------------
# Tour packages
# ---------------------------------------------------------------------------


class ItineraryDaySerializer(ChildSerializer):
    class Meta:
        model = ItineraryDay
        fields = ("id", "title", "description", "meals", "stay")


class PackagePhotoSerializer(ChildSerializer):
    image = MediaField(required=False, allow_null=True)

    class Meta:
        model = PackagePhoto
        fields = ("id", "image", "image_link", "alt")


@extend_schema_serializer(component_name="AdminTourPackageList")
class TourPackageListSerializer(CamelCaseMixin, serializers.ModelSerializer):
    destination_name = serializers.CharField(source="destination.name", read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    cover = MediaField()

    class Meta:
        model = TourPackage
        fields = (
            "id",
            "name",
            "slug",
            "destination",
            "destination_name",
            "days",
            "nights",
            "price_from",
            "category",
            "category_label",
            "budget",
            "featured",
            "is_published",
            "sort_order",
            "cover",
            "updated_at",
        )


@extend_schema_serializer(component_name="AdminTourPackage")
class TourPackageSerializer(CamelCaseMixin, serializers.ModelSerializer):
    cover = MediaField(required=False, allow_null=True)
    trip_types = serializers.ListField(
        child=serializers.ChoiceField(choices=TripType.choices),
        min_length=1,
        error_messages={"min_length": "Choose at least one trip type."},
    )
    category = serializers.ChoiceField(choices=Category.choices)
    budget = serializers.ChoiceField(choices=BudgetBand.choices)
    highlights = serializers.ListField(
        child=serializers.CharField(max_length=200), max_length=20, required=False
    )
    inclusions = serializers.ListField(
        child=serializers.CharField(max_length=200), max_length=30, required=False
    )
    exclusions = serializers.ListField(
        child=serializers.CharField(max_length=200), max_length=30, required=False
    )
    itinerary = ItineraryDaySerializer(many=True, required=False)
    photos = PackagePhotoSerializer(many=True, required=False)
    destination_name = serializers.CharField(source="destination.name", read_only=True)

    class Meta:
        model = TourPackage
        fields = (
            "id",
            "name",
            "slug",
            "destination",
            "destination_name",
            "days",
            "nights",
            "price_from",
            "trip_types",
            "category",
            "budget",
            "featured",
            "is_published",
            "sort_order",
            "summary",
            "overview",
            "highlights",
            "inclusions",
            "exclusions",
            "start_city",
            "end_city",
            "best_season",
            "group_size",
            "stay",
            "transport",
            "cover",
            "cover_link",
            "cover_alt",
            "itinerary",
            "photos",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        _require_photo(
            self.instance, attrs, "cover", "cover_link", "Add a cover photo or a photo link."
        )
        days = attrs.get("days", getattr(self.instance, "days", None))
        nights = attrs.get("nights", getattr(self.instance, "nights", None))
        if days is not None and nights is not None and nights > days:
            raise serializers.ValidationError({"nights": "Nights cannot be more than days."})
        for i, photo in enumerate(attrs.get("photos", [])):
            if not photo.get("id") and not photo.get("image") and not photo.get("image_link"):
                raise serializers.ValidationError(
                    {"photos": {i: {"image": "Choose a photo to upload."}}}
                )
        return attrs

    @transaction.atomic
    def create(self, validated: dict[str, Any]) -> TourPackage:
        itinerary = validated.pop("itinerary", [])
        photos = validated.pop("photos", [])
        package = super().create(validated)
        self._save_children(package, itinerary, photos)
        return package

    @transaction.atomic
    def update(self, instance: TourPackage, validated: dict[str, Any]) -> TourPackage:
        itinerary = validated.pop("itinerary", None)
        photos = validated.pop("photos", None)
        package = super().update(instance, validated)
        self._save_children(package, itinerary, photos)
        return package

    def _save_children(self, package: TourPackage, itinerary, photos) -> None:
        if itinerary is not None:
            sync_children(
                package, "itinerary", itinerary, ("title", "description", "meals", "stay")
            )
        if photos is not None:
            sync_children(package, "photos", photos, ("image", "alt"))


# ---------------------------------------------------------------------------
# Reviews and photo credits
# ---------------------------------------------------------------------------


@extend_schema_serializer(component_name="AdminReview")
class ReviewSerializer(CamelCaseMixin, serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = (
            "id",
            "text",
            "name",
            "trip",
            "is_published",
            "sort_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


@extend_schema_serializer(component_name="AdminPhotoCredit")
class PhotoCreditSerializer(CamelCaseMixin, serializers.ModelSerializer):
    class Meta:
        model = PhotoCredit
        fields = (
            "id",
            "title",
            "author",
            "licence",
            "source",
            "used_for",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")
