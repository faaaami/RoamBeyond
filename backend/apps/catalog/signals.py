"""Any change to catalog content asks the website to refresh its cache."""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.revalidation import request_revalidation

from .models import Destination, ItineraryDay, PackagePhoto, PhotoCredit, Review, TourPackage

CONTENT_MODELS = (Destination, TourPackage, ItineraryDay, PackagePhoto, Review, PhotoCredit)


@receiver(post_save)
@receiver(post_delete)
def content_changed(sender, **kwargs) -> None:
    if sender in CONTENT_MODELS and not kwargs.get("raw"):
        request_revalidation()
