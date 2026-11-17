"""
Business logic for enquiries.

Views call these functions and never touch the ORM directly, so the same
behaviour is available to management commands, admin actions and tests.
"""

import logging
from collections.abc import Iterable
from typing import Any

from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.db import transaction
from django.utils import timezone

from apps.catalog.models import TourPackage

from . import notifications
from .enums import TRANSITIONS, EnquiryKind, EnquiryStatus
from .models import Enquiry

logger = logging.getLogger(__name__)


def create_enquiry(
    *,
    kind: EnquiryKind,
    data: dict[str, Any],
    client_ip: str | None = None,
    user_agent: str = "",
) -> Enquiry:
    """
    Persist a validated enquiry and notify the agency.

    `data` is the validated output of the matching serializer (model field
    names). The enquiry is saved first so a lead is never lost because email
    delivery failed; the failure is recorded on the row instead.
    """
    data.pop("consent", None)
    with transaction.atomic():
        enquiry = Enquiry.objects.create(
            kind=kind,
            consent_given_at=timezone.now(),
            client_ip=client_ip,
            user_agent=user_agent[:512],
            package=_find_package(data.get("package_slug", "")),
            **data,
        )
    logger.info("Enquiry %s created (kind=%s)", enquiry.reference, enquiry.kind)

    notifications.notify_agency(enquiry)
    if enquiry.email and settings.ENQUIRY_ACKNOWLEDGE_VISITORS:
        notifications.acknowledge_visitor(enquiry)
    return enquiry


def _find_package(slug: str) -> TourPackage | None:
    """The package the visitor enquired about, if it still exists under that slug."""
    return TourPackage.objects.filter(slug=slug).first() if slug else None


def assign(enquiries: Iterable[Enquiry], user: AbstractBaseUser | None) -> int:
    count = 0
    for enquiry in enquiries:
        enquiry.assigned_to = user  # type: ignore[assignment]
        enquiry.save(update_fields=["assigned_to", "updated_at"])
        count += 1
    return count


def mark_status(enquiry: Enquiry, status: str) -> Enquiry:
    enquiry.status = status
    enquiry.save(update_fields=["status", "updated_at"])
    return enquiry


class InvalidStatusChange(ValueError):
    """A status move the workflow does not allow, e.g. New straight to Closed."""


def allowed_statuses(status: str) -> list[str]:
    """The status itself plus every status a lead in `status` may move to."""
    return [status, *sorted(TRANSITIONS.get(status, ()))]


def check_status_change(enquiry: Enquiry, new_status: str) -> None:
    if new_status == enquiry.status:
        return
    if new_status in TRANSITIONS.get(enquiry.status, frozenset()):
        return
    labels = dict(EnquiryStatus.choices)
    current = labels.get(enquiry.status, enquiry.status)
    options = [labels[s] for s in TRANSITIONS.get(enquiry.status, ())]
    if options:
        hint = " or ".join(options)
        raise InvalidStatusChange(
            f"A {current} lead cannot be set to {labels.get(new_status, new_status)} directly. "
            f"Set it to {hint} first."
        )
    raise InvalidStatusChange(f"A {current} lead cannot be changed to another status.")


def update_enquiry(enquiry: Enquiry, changes: dict[str, Any]) -> Enquiry:
    """
    Apply a staff edit. Only workflow fields can change; what the visitor
    submitted is never edited. Status moves must follow TRANSITIONS.
    """
    allowed = {"status", "assigned_to", "follow_up_on", "internal_notes"}
    unknown = set(changes) - allowed
    if unknown:
        raise ValueError(f"Cannot change {', '.join(sorted(unknown))}")
    if "status" in changes:
        check_status_change(enquiry, changes["status"])
    for field, value in changes.items():
        setattr(enquiry, field, value)
    if changes:
        enquiry.save(update_fields=[*changes, "updated_at"])
    return enquiry
