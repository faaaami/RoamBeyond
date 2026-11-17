"""A photo can be a file upload or a link. The upload wins when both are set."""

from django.urls import reverse

import pytest

from apps.catalog.tests.factories import make_destination, make_package

pytestmark = pytest.mark.django_db


def test_destination_shows_its_link_when_no_photo_is_uploaded(api_client):
    destination = make_destination(slug="goa-link", image="")
    destination.image_link = "/images/destination-goa.jpg"
    destination.save()
    body = api_client.get(reverse("v1:catalog:destination-list")).json()
    row = next(d for d in body if d["slug"] == "goa-link")
    assert row["image"] == "/images/destination-goa.jpg"


def test_package_cover_falls_back_to_link(api_client):
    destination = make_destination()
    package = make_package(destination)
    package.cover = ""
    package.cover_link = "https://example.com/cover.jpg"
    package.save()
    body = api_client.get(reverse("v1:catalog:package-detail", args=[package.slug])).json()
    assert body["cover"] == "https://example.com/cover.jpg"
