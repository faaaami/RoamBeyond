"""Staff management of navigation links and trip-type wording."""

from django.urls import reverse

import pytest

from apps.pages.models import NavLink, TripTypeInfo

from .conftest import api_for

pytestmark = pytest.mark.django_db

NAV = reverse("admin_api:nav-link-list")
TRIP = reverse("admin_api:trip-type-list")


def test_staff_can_add_edit_and_delete_links(superuser):
    client = api_for(superuser)
    created = client.post(NAV, {"label": "Blog", "href": "/blog", "position": 9})
    assert created.status_code == 201
    link_url = reverse("admin_api:nav-link-detail", args=[created.data["id"]])
    assert client.patch(link_url, {"isPublished": False}, format="json").status_code == 200
    assert NavLink.objects.get(label="Blog").is_published is False
    assert client.delete(link_url).status_code == 204


def test_trip_types_can_be_edited_but_not_created_or_removed(superuser):
    client = api_for(superuser)
    solo = TripTypeInfo.objects.get(code="solo")
    url = reverse("admin_api:trip-type-detail", args=[solo.pk])
    assert client.patch(url, {"blurb": "Updated wording."}, format="json").status_code == 200
    solo.refresh_from_db()
    assert solo.blurb == "Updated wording."
    assert client.post(TRIP, {"code": "solo", "label": "x"}).status_code == 405
    assert client.delete(url).status_code == 405


def test_non_staff_cannot_read_links(django_user_model, client):
    visitor = django_user_model.objects.create_user("v2", "v2@example.com", "pw")
    assert api_for(visitor).get(NAV).status_code == 403
