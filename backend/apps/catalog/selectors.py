"""
Read queries for the public API. Views call these instead of building
querysets themselves, so "what the website may show" is defined once.
"""

from django.db.models import Count, Prefetch, Q, QuerySet

from .models import Destination, ItineraryDay, PackagePhoto, PhotoCredit, Review, TourPackage


def published_destinations() -> QuerySet[Destination]:
    # Explicit order_by: Meta.ordering is dropped from GROUP BY queries.
    return (
        Destination.objects.published()
        .annotate(package_count=Count("packages", filter=Q(packages__is_published=True)))
        .order_by("sort_order", "name")
    )


def published_packages() -> QuerySet[TourPackage]:
    """Packages whose destination is also published, so links never 404."""
    return (
        TourPackage.objects.published()
        .filter(destination__is_published=True)
        .select_related("destination")
        .order_by("sort_order", "created_at")
    )


def package_detail(slug: str) -> TourPackage | None:
    return (
        published_packages()
        .prefetch_related(
            Prefetch("itinerary", queryset=ItineraryDay.objects.order_by("position", "id")),
            Prefetch("photos", queryset=PackagePhoto.objects.order_by("position", "id")),
        )
        .filter(slug=slug)
        .first()
    )


def published_reviews() -> QuerySet[Review]:
    return Review.objects.published().order_by("sort_order", "created_at")


def photo_credits() -> QuerySet[PhotoCredit]:
    return PhotoCredit.objects.order_by("title")
