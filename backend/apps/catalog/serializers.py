"""
Read-only output for the website. Field names and shapes match the TypeScript
types in src/data/types.ts (PackageSummary, TourPackage, Destination, ...).
"""

from typing import Any

from rest_framework import serializers

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field

from apps.core.media import image_url

from .models import Destination, PhotoCredit, Review, TourPackage


@extend_schema_field(OpenApiTypes.URI)
class DestinationSerializer(serializers.ModelSerializer):
    bestSeason = serializers.CharField(source="best_season")

    def get_image(self, obj: Destination) -> str:
        return image_url(obj.image, obj.image_link, self.context.get("request"))

    knownFor = serializers.ListField(source="known_for", child=serializers.CharField())
    image = serializers.SerializerMethodField()
    packageCount = serializers.IntegerField(source="package_count", read_only=True)

    class Meta:
        model = Destination
        fields = (
            "slug",
            "name",
            "region",
            "tagline",
            "description",
            "bestSeason",
            "knownFor",
            "image",
            "popular",
            "packageCount",
        )


class PackageSummarySerializer(serializers.ModelSerializer):
    destination = serializers.CharField(source="destination.slug")
    destinationName = serializers.CharField(source="destination.name")
    tripTypes = serializers.ListField(source="trip_types", child=serializers.CharField())
    priceFrom = serializers.IntegerField(source="price_from", allow_null=True)
    cover = serializers.SerializerMethodField()
    coverAlt = serializers.CharField(source="cover_alt")

    def get_cover(self, obj: TourPackage) -> str:
        return image_url(obj.cover, obj.cover_link, self.context.get("request"))

    categoryLabel = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = TourPackage
        fields: tuple[str, ...] = (
            "slug",
            "name",
            "destination",
            "destinationName",
            "days",
            "nights",
            "tripTypes",
            "category",
            "categoryLabel",
            "budget",
            "priceFrom",
            "featured",
            "summary",
            "cover",
            "coverAlt",
        )


class QuickFactsSerializer(serializers.Serializer):
    startCity = serializers.CharField(source="start_city")
    endCity = serializers.CharField(source="end_city")
    bestSeason = serializers.CharField(source="best_season")
    stay = serializers.CharField()
    transport = serializers.CharField()
    groupSize = serializers.CharField(source="group_size")


class ItineraryDaySerializer(serializers.Serializer):
    day = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    meals = serializers.CharField(allow_blank=True)
    stay = serializers.CharField(allow_blank=True)


class GalleryPhotoSerializer(serializers.Serializer):
    src = serializers.CharField()
    alt = serializers.CharField()


class PackageDetailSerializer(PackageSummarySerializer):
    highlights = serializers.ListField(child=serializers.CharField())
    quickFacts = serializers.SerializerMethodField()
    itinerary = serializers.SerializerMethodField()
    inclusions = serializers.ListField(child=serializers.CharField())
    exclusions = serializers.ListField(child=serializers.CharField())
    gallery = serializers.SerializerMethodField()

    class Meta(PackageSummarySerializer.Meta):
        fields: tuple[str, ...] = (
            *PackageSummarySerializer.Meta.fields,
            "overview",
            "highlights",
            "quickFacts",
            "itinerary",
            "inclusions",
            "exclusions",
            "gallery",
        )

    def get_quickFacts(self, obj: TourPackage) -> dict[str, str]:
        return QuickFactsSerializer(obj).data

    def get_itinerary(self, obj: TourPackage) -> list[dict[str, Any]]:
        days = [
            {
                "day": number,
                "title": day.title,
                "description": day.description,
                "meals": day.meals,
                "stay": day.stay,
            }
            for number, day in enumerate(obj.itinerary.all(), start=1)
        ]
        return list(ItineraryDaySerializer(days, many=True).data)

    def get_gallery(self, obj: TourPackage) -> list[dict[str, str]]:
        """The cover first, then the extra photos."""
        request = self.context.get("request")
        photos = [{"src": image_url(obj.cover, obj.cover_link, request), "alt": obj.cover_alt}]
        photos += [
            {"src": image_url(photo.image, photo.image_link, request), "alt": photo.alt or obj.name}
            for photo in obj.photos.all()
        ]
        return list(GalleryPhotoSerializer(photos, many=True).data)


class ReviewSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk")

    class Meta:
        model = Review
        fields = ("id", "text", "name", "trip")


class PhotoCreditSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk")

    class Meta:
        model = PhotoCredit
        fields = ("id", "title", "author", "licence", "source")
