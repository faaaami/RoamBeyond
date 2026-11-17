"""
Create one sample destination and package, only when the catalog is empty.

Used by CI so the website can be built against a real API. It never changes an
existing catalog: if any destination or package exists, nothing is created.
"""

from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from apps.catalog.models import Destination, TourPackage

SAMPLE_IMAGE = Path(settings.BASE_DIR).parent / "public" / "images" / "destination-kerala.jpg"


class Command(BaseCommand):
    help = "Add one sample destination and package if the catalog is empty."

    def handle(self, *args, **options) -> None:
        if Destination.objects.exists() or TourPackage.objects.exists():
            self.stdout.write("Catalog already has content; nothing added.")
            return
        if not SAMPLE_IMAGE.exists():
            self.stderr.write(f"Sample photo not found at {SAMPLE_IMAGE}")
            return

        destination = Destination(
            name="Sample destination",
            slug="sample-destination",
            region="India",
            tagline="A sample destination for testing.",
            description="Sample text for a destination created by the CI seed command.",
            popular=True,
            is_published=True,
        )
        destination.image.save("sample-destination.jpg", ContentFile(SAMPLE_IMAGE.read_bytes()), save=False)
        destination.save()

        TourPackage.objects.create(
            name="Sample trip",
            slug="sample-trip",
            destination=destination,
            days=3,
            nights=2,
            category="hills",
            budget="comfort",
            trip_types=["family"],
            summary="A sample package for testing.",
            overview="Sample overview.",
            is_published=True,
        )
        self.stdout.write("Added the sample destination and package.")
