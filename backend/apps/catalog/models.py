"""
What the agency sells: destinations, tour packages, and the reviews and photo
credits shown alongside them. Editors manage all of it in the Django admin.

Only rows with `is_published` set appear on the website, so an editor can
prepare a package before it goes live.
"""

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

from apps.core.fields import MultipleChoiceListField, StringListField
from apps.core.models import Orderable, TimeStampedModel

from .enums import BudgetBand, Category, TripType


class PublishedQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)


class Destination(Orderable, TimeStampedModel):
    name = models.CharField(max_length=80)
    slug = models.SlugField(
        "web address",
        max_length=80,
        unique=True,
        help_text="The last part of the page link, e.g. /destinations/kashmir.",
    )
    region = models.CharField(max_length=80, help_text='e.g. "North India"')
    tagline = models.CharField(max_length=160, help_text="One short line shown under the name.")
    description = models.TextField()
    best_season = models.CharField("best time to visit", max_length=120, blank=True)
    known_for = StringListField(
        "known for",
        max_items=12,
        max_length_each=80,
        help_text='Short tags, one per line, e.g. "Dal Lake houseboats".',
    )
    image = models.ImageField("photo", upload_to="destinations/", blank=True)
    image_link = models.CharField(
        "photo link",
        max_length=500,
        blank=True,
        help_text="Or paste a public image link, e.g. /images/destination-goa.jpg. "
        "Used when no photo is uploaded.",
    )
    popular = models.BooleanField(
        "show as a popular destination",
        default=False,
        help_text="Popular destinations appear on the home page and in the footer.",
    )
    is_published = models.BooleanField("published", default=True)

    objects = PublishedQuerySet.as_manager()

    class Meta:
        ordering = ("sort_order", "name")

    def __str__(self) -> str:
        return self.name


class TourPackage(Orderable, TimeStampedModel):
    name = models.CharField("package name", max_length=120)
    slug = models.SlugField(
        "web address",
        max_length=80,
        unique=True,
        help_text="The last part of the page link, e.g. /packages/kashmir-valley-escape.",
    )
    destination = models.ForeignKey(Destination, on_delete=models.PROTECT, related_name="packages")
    days = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    nights = models.PositiveSmallIntegerField()
    price_from = models.PositiveIntegerField(
        "starting price per person (₹)",
        null=True,
        blank=True,
        help_text="Numbers only, e.g. 24999. Leave empty to show “₹[PRICE]”.",
    )
    trip_types = MultipleChoiceListField("suitable for", choices_list=TripType.choices)
    category = models.CharField(max_length=20, choices=Category.choices)
    budget = models.CharField("budget band", max_length=20, choices=BudgetBand.choices)
    featured = models.BooleanField("featured on the home page", default=False)
    is_published = models.BooleanField("published", default=True)

    summary = models.CharField(
        "short summary",
        max_length=300,
        help_text="One sentence shown on the package card and in search results.",
    )
    overview = models.TextField()
    highlights = StringListField(max_items=20, max_length_each=200, help_text="One per line.")
    inclusions = StringListField("included", max_items=30, max_length_each=200)
    exclusions = StringListField("not included", max_items=30, max_length_each=200)

    start_city = models.CharField(max_length=80, blank=True)
    end_city = models.CharField(max_length=80, blank=True)
    best_season = models.CharField(max_length=120, blank=True)
    group_size = models.CharField(max_length=80, blank=True)
    stay = models.CharField(max_length=120, blank=True)
    transport = models.CharField(max_length=120, blank=True)

    cover = models.ImageField(
        "cover photo",
        upload_to="packages/",
        blank=True,
        help_text="Shown on the package card and first in the gallery.",
    )
    cover_link = models.CharField(
        "photo link",
        max_length=500,
        blank=True,
        help_text="Or paste a public image link, e.g. /images/destination-goa.jpg. "
        "Used when no photo is uploaded.",
    )
    cover_alt = models.CharField(
        "description of the cover photo",
        max_length=200,
        help_text="For screen readers and search engines.",
    )

    objects = PublishedQuerySet.as_manager()

    class Meta:
        ordering = ("sort_order", "created_at")
        constraints = [
            models.CheckConstraint(
                condition=Q(nights__lte=models.F("days")), name="package_nights_not_above_days"
            ),
        ]

    def __str__(self) -> str:
        return self.name


class ItineraryDay(models.Model):
    """One day of a package. Day numbers follow the order of the rows."""

    package = models.ForeignKey(TourPackage, on_delete=models.CASCADE, related_name="itinerary")
    position = models.PositiveSmallIntegerField(default=0)
    title = models.CharField(max_length=160)
    description = models.TextField("what happens")
    meals = models.CharField(max_length=80, blank=True, help_text='e.g. "Breakfast, Dinner"')
    stay = models.CharField("overnight stay", max_length=160, blank=True)

    class Meta:
        ordering = ("position", "id")

    def __str__(self) -> str:
        return self.title


class PackagePhoto(models.Model):
    """Gallery photos after the cover."""

    package = models.ForeignKey(TourPackage, on_delete=models.CASCADE, related_name="photos")
    position = models.PositiveSmallIntegerField(default=0)
    image = models.ImageField(upload_to="packages/gallery/", blank=True)
    image_link = models.CharField(
        "photo link",
        max_length=500,
        blank=True,
        help_text="Or paste a public image link, e.g. /images/destination-goa.jpg. "
        "Used when no photo is uploaded.",
    )
    alt = models.CharField("description of the photo", max_length=200)

    class Meta:
        ordering = ("position", "id")

    def __str__(self) -> str:
        return self.alt


class Review(Orderable, TimeStampedModel):
    text = models.TextField(
        "review", help_text="Only publish real reviews, with the customer's permission."
    )
    name = models.CharField("customer name", max_length=80)
    trip = models.CharField(
        max_length=160, blank=True, help_text='e.g. "Kashmir Valley Escape, March 2026"'
    )
    is_published = models.BooleanField("published", default=True)

    objects = PublishedQuerySet.as_manager()

    class Meta:
        ordering = ("sort_order", "created_at")

    def __str__(self) -> str:
        return f"{self.name}: {self.text[:40]}"


class PhotoCredit(TimeStampedModel):
    """Shown on the /credits page. Remove a credit when its photo is replaced."""

    title = models.CharField("photo title", max_length=200)
    author = models.CharField("photographer", max_length=160, blank=True)
    licence = models.CharField(max_length=80, help_text='e.g. "CC BY-SA 4.0"')
    source = models.URLField("source link", max_length=500)
    used_for = models.CharField(
        max_length=200,
        blank=True,
        help_text="A note for you on where the photo appears. Not shown on the website.",
    )

    class Meta:
        ordering = ("title",)

    def __str__(self) -> str:
        return self.title
