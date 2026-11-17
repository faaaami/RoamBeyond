import uuid

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel

from .enums import EnquiryKind, EnquiryStatus, TripType


class Enquiry(TimeStampedModel):
    """
    A lead submitted from the website.

    One table holds all three enquiry kinds (call-back, package, custom trip).
    Fields that do not apply to a kind are left blank or null. The columns are
    explicit rather than a JSON blob so the team can filter and search them in
    the admin.
    """

    reference = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    kind = models.CharField(max_length=16, choices=EnquiryKind.choices, db_index=True)
    status = models.CharField(
        max_length=16, choices=EnquiryStatus.choices, default=EnquiryStatus.NEW, db_index=True
    )

    # Visitor
    name = models.CharField(max_length=80)
    mobile = models.CharField("mobile (E.164)", max_length=16)
    email = models.EmailField(blank=True)
    message = models.TextField(blank=True)
    consent_given_at = models.DateTimeField()

    # Package enquiry. The name and slug are kept as sent, so the lead still
    # reads correctly if the package is later renamed or deleted.
    package = models.ForeignKey(
        "catalog.TourPackage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enquiries",
    )
    package_name = models.CharField(max_length=120, blank=True)
    package_slug = models.SlugField(max_length=120, blank=True)

    # Custom trip
    departure_city = models.CharField(max_length=80, blank=True)
    destination = models.CharField(max_length=120, blank=True)
    duration = models.CharField(max_length=40, blank=True)
    budget = models.CharField(max_length=40, blank=True)

    # Package and custom trip
    travel_date = models.DateField(null=True, blank=True)
    trip_type = models.CharField(max_length=16, choices=TripType.choices, blank=True)
    adults = models.PositiveSmallIntegerField(null=True, blank=True)
    children = models.PositiveSmallIntegerField(null=True, blank=True)

    # Request metadata
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)

    # Where the lead came from: the page the form was on, the site that sent
    # the visitor, and the campaign tags from the landing URL.
    source_page = models.CharField(max_length=300, blank=True)
    referrer = models.CharField(max_length=500, blank=True)
    utm_source = models.CharField("UTM source", max_length=100, blank=True, db_index=True)
    utm_medium = models.CharField("UTM medium", max_length=100, blank=True)
    utm_campaign = models.CharField("UTM campaign", max_length=100, blank=True)

    # Emails
    notified_at = models.DateTimeField(null=True, blank=True)
    notification_error = models.TextField(blank=True)
    acknowledged_at = models.DateTimeField("confirmation sent to visitor", null=True, blank=True)

    # Team workflow
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_enquiries",
        limit_choices_to={"is_staff": True},
    )
    follow_up_on = models.DateField("follow up on", null=True, blank=True, db_index=True)
    internal_notes = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "enquiries"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "-created_at"], name="enquiry_status_created")]

    def __str__(self) -> str:
        return f"{self.get_kind_display()} from {self.name}"

    @property
    def title(self) -> str:
        return EnquiryKind(self.kind).label

    @property
    def subject(self) -> str:
        detail = f": {self.package_name}" if self.kind == EnquiryKind.PACKAGE else ""
        return f"{self.title}{detail} ({self.name})"
