"""Any change to page content asks the website to refresh its cache."""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.revalidation import request_revalidation

from .models import (
    AboutFact,
    AboutPage,
    AboutValue,
    HomePage,
    HomeStep,
    LegalPage,
    LegalSection,
    NavLink,
    OtherPages,
    PageSeo,
    SiteSettings,
    StoryScene,
    TripTypeInfo,
)

CONTENT_MODELS = (
    SiteSettings,
    HomePage,
    HomeStep,
    StoryScene,
    AboutPage,
    AboutFact,
    AboutValue,
    OtherPages,
    LegalPage,
    LegalSection,
    NavLink,
    PageSeo,
    TripTypeInfo,
)


@receiver(post_save)
@receiver(post_delete)
def content_changed(sender, **kwargs) -> None:
    if sender in CONTENT_MODELS and not kwargs.get("raw"):
        request_revalidation()
