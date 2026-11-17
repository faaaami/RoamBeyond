"""Safety rules: no self-lockout, photo size limits, and logged exports."""

import logging

from django.urls import reverse

import pytest

from apps.admin_api.serializers import base as serializer_base
from apps.catalog.models import Destination

from .conftest import api_for, png

pytestmark = pytest.mark.django_db


def test_administrator_cannot_deactivate_or_demote_themselves(superuser):
    url = reverse("admin_api:user-detail", args=[superuser.pk])
    client = api_for(superuser)
    assert client.patch(url, {"isActive": False}, format="json").status_code == 400
    assert client.patch(url, {"isSuperuser": False}, format="json").status_code == 400
    superuser.refresh_from_db()
    assert superuser.is_active and superuser.is_superuser


def test_administrator_can_still_manage_other_staff(superuser, django_user_model):
    other = django_user_model.objects.create_user("other", "o@example.com", "pw", is_staff=True)
    url = reverse("admin_api:user-detail", args=[other.pk])
    assert api_for(superuser).patch(url, {"isActive": False}, format="json").status_code == 200
    other.refresh_from_db()
    assert other.is_active is False


def test_photo_over_the_size_limit_is_refused(superuser, monkeypatch):
    monkeypatch.setattr(serializer_base, "MAX_PHOTO_BYTES", 10)
    res = api_for(superuser).post(
        reverse("admin_api:destination-list"),
        {"data": '{"name": "Big", "slug": "big", "region": "x"}', "image": png()},
        format="multipart",
    )
    assert res.status_code == 400
    assert "8 MB" in str(res.data)
    assert not Destination.objects.filter(slug="big").exists()


def test_photo_with_too_many_pixels_is_refused(superuser, monkeypatch):
    monkeypatch.setattr(serializer_base, "MAX_PHOTO_PIXELS", 5)
    res = api_for(superuser).post(
        reverse("admin_api:destination-list"),
        {"data": '{"name": "Wide", "slug": "wide", "region": "x"}', "image": png()},
        format="multipart",
    )
    assert res.status_code == 400
    assert "megapixels" in str(res.data)


def test_csv_export_is_logged_with_who_and_how_many(superuser, caplog):
    from django.utils import timezone

    from apps.enquiries.models import Enquiry

    Enquiry.objects.create(
        kind="callback", name="Ravi", mobile="+919876543210", consent_given_at=timezone.now()
    )
    with caplog.at_level(logging.INFO, logger="apps.admin_api.views.enquiries"):
        res = api_for(superuser).get(reverse("admin_api:enquiry-export"))
    assert res.status_code == 200
    messages = [r.getMessage() for r in caplog.records]
    assert any("Enquiry export by user" in m and ": 1 rows" in m for m in messages)
