"""
Enquiry emails: the notification to the agency, and a confirmation to the
visitor when they gave an email address. Both are best-effort: the lead is
already saved, and failures are recorded on the row.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils import timezone

from apps.pages.models import SiteSettings

from .enums import TripType
from .models import Enquiry

logger = logging.getLogger(__name__)


def enquiry_lines(enquiry: Enquiry) -> list[tuple[str, str]]:
    """Label and value pairs for the email body, skipping anything not given."""
    candidates: list[tuple[str, object]] = [
        ("Package", enquiry.package_name),
        ("Name", enquiry.name),
        ("Mobile", enquiry.mobile),
        ("Email", enquiry.email),
        ("Travelling from", enquiry.departure_city),
        ("Destination", enquiry.destination),
        ("Travel date", enquiry.travel_date.isoformat() if enquiry.travel_date else ""),
        ("Duration", enquiry.duration),
        ("Budget", enquiry.budget),
        ("Trip type", TripType(enquiry.trip_type).label if enquiry.trip_type else ""),
        ("Adults", enquiry.adults),
        ("Children", enquiry.children),
        ("Message", enquiry.message),
        ("Sent from page", enquiry.source_page),
        ("Came from", enquiry.referrer),
        (
            "Campaign",
            " / ".join(
                v for v in (enquiry.utm_source, enquiry.utm_medium, enquiry.utm_campaign) if v
            ),
        ),
    ]
    return [(label, str(value)) for label, value in candidates if value not in ("", None)]


def build_agency_email(enquiry: Enquiry) -> EmailMessage:
    body = render_to_string(
        "enquiries/email/agency_notification.txt",
        {"enquiry": enquiry, "lines": enquiry_lines(enquiry), "admin_url": admin_url(enquiry)},
    )
    return EmailMessage(
        subject=enquiry.subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.ENQUIRY_TO_EMAIL],
        reply_to=[enquiry.email] if enquiry.email else None,
    )


def notify_agency(enquiry: Enquiry) -> bool:
    """
    Send the notification and record the outcome on the enquiry.

    Never raises: the lead is already saved, and the admin shows which
    enquiries still need a manual follow-up when delivery failed.
    """
    try:
        build_agency_email(enquiry).send(fail_silently=False)
    except Exception as exc:
        logger.exception("Agency notification failed for enquiry %s", enquiry.reference)
        enquiry.notification_error = f"{type(exc).__name__}: {exc}"[:2000]
        enquiry.save(update_fields=["notification_error", "updated_at"])
        return False

    enquiry.notified_at = timezone.now()
    enquiry.notification_error = ""
    enquiry.save(update_fields=["notified_at", "notification_error", "updated_at"])
    return True


def admin_url(enquiry: Enquiry) -> str:
    """Link to the enquiry in the admin panel, or "" when ADMIN_PANEL_URL is not set."""
    if not settings.ADMIN_PANEL_URL:
        return ""
    return f"{settings.ADMIN_PANEL_URL.rstrip('/')}/enquiries/{enquiry.reference}"


def build_visitor_email(enquiry: Enquiry) -> EmailMessage:
    site = SiteSettings.load()
    body = render_to_string(
        "enquiries/email/visitor_confirmation.txt",
        {
            "enquiry": enquiry,
            "lines": [(k, v) for k, v in enquiry_lines(enquiry) if k in VISITOR_LINES],
            "site_name": settings.SITE_NAME,
            "callback_window": site.callback_window,
            "phone": site.phone_display,
            "whatsapp": site.whatsapp_display,
        },
    )
    return EmailMessage(
        subject=f"We have your enquiry - {settings.SITE_NAME}",
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[enquiry.email],
        reply_to=[settings.ENQUIRY_TO_EMAIL],
    )


# What the visitor typed, without the internal tracking lines.
VISITOR_LINES = {
    "Package",
    "Name",
    "Mobile",
    "Travelling from",
    "Destination",
    "Travel date",
    "Duration",
    "Budget",
    "Trip type",
    "Adults",
    "Children",
    "Message",
}


def acknowledge_visitor(enquiry: Enquiry) -> bool:
    """Send the visitor a copy of their enquiry. Never raises."""
    try:
        build_visitor_email(enquiry).send(fail_silently=False)
    except Exception:
        logger.exception("Visitor confirmation failed for enquiry %s", enquiry.reference)
        return False
    enquiry.acknowledged_at = timezone.now()
    enquiry.save(update_fields=["acknowledged_at", "updated_at"])
    return True
