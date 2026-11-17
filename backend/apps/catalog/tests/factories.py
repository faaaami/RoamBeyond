"""Small helpers for building catalog rows in tests."""

import io
from typing import Any

from django.core.files.uploadedfile import SimpleUploadedFile

from PIL import Image

from apps.catalog.models import Destination, TourPackage


def image_file(name: str = "photo.jpg") -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", (4, 3), "teal").save(buffer, format="JPEG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/jpeg")


def make_destination(**overrides: Any) -> Destination:
    values: dict[str, Any] = {
        "name": "Kashmir",
        "slug": "kashmir",
        "region": "North India",
        "tagline": "Lakes and meadows",
        "description": "Srinagar and around.",
        "known_for": ["Dal Lake houseboats"],
        "image": image_file("kashmir.jpg"),
    }
    values.update(overrides)
    return Destination.objects.create(**values)


def make_package(destination: Destination, **overrides: Any) -> TourPackage:
    values: dict[str, Any] = {
        "name": "Kashmir Valley Escape",
        "slug": "kashmir-valley-escape",
        "destination": destination,
        "days": 6,
        "nights": 5,
        "price_from": 24999,
        "trip_types": ["couple", "family"],
        "category": "hills",
        "budget": "comfort",
        "summary": "Houseboats and meadows.",
        "overview": "Six days in the valley.",
        "highlights": ["Shikara ride"],
        "inclusions": ["Hotels"],
        "exclusions": ["Flights"],
        "start_city": "Srinagar",
        "cover": image_file("cover.jpg"),
        "cover_alt": "Dal Lake at dawn",
    }
    values.update(overrides)
    return TourPackage.objects.create(**values)
