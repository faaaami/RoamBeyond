from django.db import models

from apps.core.enums import TripType

__all__ = ["EnquiryKind", "EnquiryStatus", "TripType"]


class EnquiryKind(models.TextChoices):
    CALLBACK = "callback", "Call-back request"
    PACKAGE = "package", "Package enquiry"
    CUSTOM = "custom", "Custom trip request"


class EnquiryStatus(models.TextChoices):
    NEW = "new", "New"
    CONTACTED = "contacted", "Contacted"
    CONVERTED = "converted", "Converted"
    CLOSED = "closed", "Closed"


# Where a lead may go from each status. Staying on the same status is always fine.
# A new lead must be contacted before it can be converted or closed, so every
# closed or converted lead has a record of someone calling.
TRANSITIONS: dict[str, frozenset[str]] = {
    EnquiryStatus.NEW: frozenset({EnquiryStatus.CONTACTED}),
    EnquiryStatus.CONTACTED: frozenset({EnquiryStatus.CONVERTED, EnquiryStatus.CLOSED}),
    # Reopening a closed or converted lead is allowed; going back to New is not.
    EnquiryStatus.CONVERTED: frozenset({EnquiryStatus.CONTACTED}),
    EnquiryStatus.CLOSED: frozenset({EnquiryStatus.CONTACTED}),
}
