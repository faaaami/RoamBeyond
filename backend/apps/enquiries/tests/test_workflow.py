from django.core import mail
from django.urls import reverse

import pytest

from apps.catalog.tests.factories import make_destination, make_package
from apps.enquiries.models import Enquiry
from apps.pages.models import SiteSettings

pytestmark = pytest.mark.django_db

URL = reverse("v1:enquiries:create")
PACKAGE = {
    "kind": "package",
    "packageName": "Kashmir Valley Escape",
    "packageSlug": "kashmir-valley-escape",
    "name": "Asha Rao",
    "mobile": "9876543210",
    "email": "asha@example.com",
    "travelDate": "",
    "tripType": "family",
    "adults": 2,
    "children": 0,
    "consent": True,
}


def test_links_package_and_stores_tracking(api_client):
    package = make_package(make_destination())
    res = api_client.post(
        URL,
        {
            **PACKAGE,
            "sourcePage": "/packages/kashmir-valley-escape",
            "referrer": "https://www.google.com/" + "x" * 600,
            "utmSource": "instagram",
            "utmCampaign": "winter-2026",
        },
    )

    assert res.status_code == 201
    enquiry = Enquiry.objects.get()
    assert enquiry.package == package
    assert enquiry.source_page == "/packages/kashmir-valley-escape"
    assert len(enquiry.referrer) == 500  # cut to fit, not rejected
    assert enquiry.utm_source == "instagram"


def test_unknown_package_slug_still_saves(api_client):
    assert api_client.post(URL, PACKAGE).status_code == 201
    assert Enquiry.objects.get().package is None


def test_visitor_gets_a_confirmation_email(api_client):
    settings = SiteSettings.load()
    settings.callback_window = "within 2 working hours"
    settings.phone_display = "[PHONE]"  # placeholders are never sent to visitors
    settings.save()

    api_client.post(URL, {**PACKAGE, "utmSource": "instagram"})

    agency, visitor = mail.outbox
    assert visitor.to == ["asha@example.com"]
    assert "within 2 working hours" in visitor.body
    assert "[PHONE]" not in visitor.body
    assert "instagram" not in visitor.body  # tracking stays internal
    assert "Campaign: instagram" in agency.body
    assert Enquiry.objects.get().acknowledged_at is not None


def test_no_confirmation_without_email(api_client, settings):
    api_client.post(URL, {**PACKAGE, "email": ""})
    assert len(mail.outbox) == 1
