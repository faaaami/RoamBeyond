from django.core import mail
from django.urls import reverse

import pytest

from apps.enquiries.enums import EnquiryKind, EnquiryStatus
from apps.enquiries.models import Enquiry
from apps.enquiries.views import EnquiryThrottle

pytestmark = pytest.mark.django_db

URL = reverse("v1:enquiries:create")

CALLBACK = {"kind": "callback", "name": "Asha Rao", "mobile": "98765 43210", "consent": True}

PACKAGE = {
    "kind": "package",
    "packageName": "Kashmir Valley Escape",
    "packageSlug": "kashmir-valley-escape",
    "name": "Asha Rao",
    "mobile": "+91 98765 43210",
    "email": "asha@example.com",
    "travelDate": "2026-12-20",
    "tripType": "family",
    "adults": 2,
    "children": 1,
    "message": "Prefer a houseboat night.",
    "consent": True,
}

CUSTOM = {
    "kind": "custom",
    "name": "Asha Rao",
    "mobile": "9876543210",
    "email": "",
    "departureCity": "Delhi",
    "destination": "Kerala backwaters",
    "travelDate": "",
    "duration": "5 to 7 days",
    "budget": "comfort",
    "tripType": "couple",
    "adults": 2,
    "children": 0,
    "message": "",
    "consent": True,
}


def test_callback_is_stored_and_emailed(api_client):
    response = api_client.post(URL, CALLBACK)

    assert response.status_code == 201
    enquiry = Enquiry.objects.get(reference=response.data["reference"])
    assert enquiry.kind == EnquiryKind.CALLBACK
    assert enquiry.status == EnquiryStatus.NEW
    assert enquiry.mobile == "+919876543210"
    assert enquiry.consent_given_at is not None
    assert enquiry.notified_at is not None

    assert len(mail.outbox) == 1
    email = mail.outbox[0]
    assert email.to == ["agency@example.com"]
    assert email.subject == "Call-back request (Asha Rao)"
    assert "Mobile: +919876543210" in email.body
    assert str(enquiry.reference) in email.body


def test_package_enquiry_maps_camel_case_fields(api_client):
    response = api_client.post(URL, PACKAGE)

    assert response.status_code == 201
    enquiry = Enquiry.objects.get()
    assert enquiry.package_name == "Kashmir Valley Escape"
    assert enquiry.package_slug == "kashmir-valley-escape"
    assert str(enquiry.travel_date) == "2026-12-20"
    assert enquiry.trip_type == "family"
    assert (enquiry.adults, enquiry.children) == (2, 1)

    email = mail.outbox[0]
    assert email.subject == "Package enquiry: Kashmir Valley Escape (Asha Rao)"
    assert email.reply_to == ["asha@example.com"]
    assert "Trip type: Family" in email.body


def test_custom_trip_accepts_blank_optional_fields(api_client):
    response = api_client.post(URL, CUSTOM)

    assert response.status_code == 201
    enquiry = Enquiry.objects.get()
    assert enquiry.kind == EnquiryKind.CUSTOM
    assert enquiry.travel_date is None
    assert enquiry.email == ""
    assert enquiry.destination == "Kerala backwaters"
    assert "Travel date" not in mail.outbox[0].body


def test_validation_errors_use_the_shared_shape(api_client):
    response = api_client.post(
        URL, {**PACKAGE, "mobile": "12345", "adults": 0, "consent": False, "tripType": "group"}
    )

    assert response.status_code == 400
    assert response.data["error"] == "Please check the form and try again."
    fields = {f["path"]: f["message"] for f in response.data["fields"]}
    assert fields == {
        "mobile": "Enter a valid 10-digit Indian mobile number",
        "adults": "At least 1 adult",
        "consent": "Please tick the box so we can contact you",
        "tripType": "Choose a trip type",
    }
    assert not Enquiry.objects.exists()


def test_unknown_kind_is_rejected(api_client):
    response = api_client.post(URL, {**CALLBACK, "kind": "booking"})

    assert response.status_code == 400
    assert response.data["fields"] == [{"path": "kind", "message": "Choose a valid enquiry type"}]


def test_honeypot_pretends_to_succeed(api_client):
    response = api_client.post(URL, {**CALLBACK, "website": "http://spam.example"})

    assert response.status_code == 200
    assert response.data == {"ok": True}
    assert not Enquiry.objects.exists()
    assert mail.outbox == []


def test_rate_limit_per_client(api_client, monkeypatch):
    # DRF copies the rates onto the class at import time, so patch the class.
    monkeypatch.setattr(EnquiryThrottle, "THROTTLE_RATES", {"enquiry": "2/10m"})

    assert api_client.post(URL, CALLBACK).status_code == 201
    assert api_client.post(URL, CALLBACK).status_code == 201
    response = api_client.post(URL, CALLBACK)

    assert response.status_code == 429
    assert response.data["error"] == (
        "Too many requests. Please try again in a few minutes, or call us."
    )
    assert response.data["code"] == "throttled"
    assert response.data["retryAfter"] > 0
    assert response.data["requestId"] == response.headers["X-Request-ID"]
    assert "Retry-After" in response.headers


def test_email_failure_keeps_the_lead(api_client, monkeypatch):
    from django.core.mail import EmailMessage

    def fail(self, fail_silently=False):
        raise ConnectionError("smtp down")

    monkeypatch.setattr(EmailMessage, "send", fail)

    response = api_client.post(URL, CALLBACK)

    assert response.status_code == 201
    enquiry = Enquiry.objects.get()
    assert enquiry.notified_at is None
    assert enquiry.notification_error == "ConnectionError: smtp down"
