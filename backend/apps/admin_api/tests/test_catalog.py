import json

from django.urls import reverse

import pytest

from apps.admin_api.models import ActivityLog
from apps.catalog.models import Destination, PhotoCredit, Review, TourPackage
from apps.catalog.tests.factories import make_destination, make_package

from .conftest import api_for, grant, png

pytestmark = pytest.mark.django_db

PACKAGES = reverse("admin_api:package-list")
DESTINATIONS = reverse("admin_api:destination-list")
REVIEWS = reverse("admin_api:review-list")
CREDITS = reverse("admin_api:photo-credit-list")


def package_url(pk) -> str:
    return reverse("admin_api:package-detail", args=[pk])


def multipart(data: dict, **files) -> dict:
    """JSON in `data`, files under dotted paths (see base.JSONWithFilesParser)."""
    return {"data": json.dumps(data), **files}


PACKAGE = {
    "name": "Kerala Backwaters",
    "slug": "kerala-backwaters",
    "days": 6,
    "nights": 5,
    "priceFrom": 27999,
    "tripTypes": ["couple", "family"],
    "category": "nature",
    "budget": "comfort",
    "summary": "Houseboats and hills.",
    "overview": "Six days in Kerala.",
    "highlights": ["Houseboat night"],
    "coverAlt": "Houseboat at dusk",
    "itinerary": [
        {"title": "Arrive in Kochi", "description": "Fort Kochi walk"},
        {"title": "Munnar", "description": "Tea estates", "meals": "Breakfast"},
    ],
    "photos": [{"alt": "Tea hills"}],
}


def test_create_package_with_cover_itinerary_and_photos(boss_api):
    destination = make_destination(name="Kerala", slug="kerala")
    res = boss_api.post(
        PACKAGES,
        multipart(
            {**PACKAGE, "destination": destination.pk},
            cover=png("cover.png"),
            **{"photos.0.image": png()},
        ),
        format="multipart",
    )
    assert res.status_code == 201, res.data
    assert res.data["destinationName"] == "Kerala"
    assert res.data["cover"].startswith("http://testserver/media/packages/")
    assert [d["title"] for d in res.data["itinerary"]] == ["Arrive in Kochi", "Munnar"]
    assert res.data["photos"][0]["alt"] == "Tea hills"
    assert ActivityLog.objects.get().action == "added"


def test_update_reorders_and_removes_children(boss_api):
    package = make_package(make_destination())
    first = package.itinerary.create(title="One", description="a", position=0)
    second = package.itinerary.create(title="Two", description="b", position=1)
    package.itinerary.create(title="Three", description="c", position=2)

    res = boss_api.patch(
        package_url(package.pk),
        {
            "itinerary": [
                {"id": second.pk, "title": "Two"},
                {"id": first.pk, "title": "One!"},
                {"title": "New", "description": "d"},
            ]
        },
        format="json",
    )
    assert res.status_code == 200, res.data
    assert [d["title"] for d in res.data["itinerary"]] == ["Two", "One!", "New"]
    assert package.itinerary.count() == 3  # "Three" removed, "New" added
    assert "itinerary" in ActivityLog.objects.get().changed_fields


def test_package_validation(boss_api):
    destination = make_destination()
    res = boss_api.post(
        PACKAGES,
        {
            **PACKAGE,
            "destination": destination.pk,
            "nights": 9,
            "tripTypes": [],
            "photos": [{"alt": "x"}],
        },
        format="json",
    )
    assert res.status_code == 400
    assert "tripTypes" in {f["path"] for f in res.data["fields"]}

    # A package needs a cover: an uploaded photo or a photo link.
    no_cover = boss_api.post(PACKAGES, {**PACKAGE, "destination": destination.pk}, format="json")
    assert no_cover.status_code == 400
    assert "cover" in {f["path"] for f in no_cover.data["fields"]}

    # Cross-field rules run once every field is valid.
    package = make_package(destination)
    res = boss_api.patch(package_url(package.pk), {"nights": 9}, format="json")
    assert res.status_code == 400 and res.data["fields"][0]["path"] == "nights"


def test_package_list_filters_and_ordering(boss_api):
    kerala = make_destination(name="Kerala", slug="kerala")
    goa = make_destination(name="Goa", slug="goa")
    make_package(kerala, slug="a", name="Alpha", price_from=30000)
    make_package(goa, slug="b", name="Beta", price_from=10000, is_published=False)

    names = lambda **q: [p["name"] for p in boss_api.get(PACKAGES, q).data["results"]]  # noqa: E731
    assert names(ordering="price_from") == ["Beta", "Alpha"]
    assert names(destination=goa.pk) == ["Beta"]
    assert names(published="false") == ["Beta"]
    assert names(q="alp") == ["Alpha"]


def test_duplicate_package(boss_api):
    package = make_package(make_destination())
    package.itinerary.create(title="Day one", description="x")
    res = boss_api.post(reverse("admin_api:package-duplicate", args=[package.pk]))
    assert res.status_code == 201
    copy = TourPackage.objects.get(pk=res.data["id"])
    assert copy.slug == f"{package.slug}-copy" and not copy.is_published
    assert copy.itinerary.get().title == "Day one"
    assert (
        boss_api.post(reverse("admin_api:package-duplicate", args=[package.pk]))
        .data["slug"]
        .endswith("-copy-2")
    )


def test_destination_crud_and_protected_delete(boss_api):
    res = boss_api.post(
        DESTINATIONS,
        multipart(
            {
                "name": "Goa",
                "slug": "goa",
                "region": "West",
                "tagline": "Beaches",
                "description": "Sun",
                "knownFor": ["Beaches"],
            },
            image=png(),
        ),
        format="multipart",
    )
    assert res.status_code == 201, res.data
    goa = Destination.objects.get(slug="goa")
    assert res.data["packageCount"] == 0 and goa.known_for == ["Beaches"]

    # Leaving the image out keeps it.
    assert (
        boss_api.patch(
            reverse("admin_api:destination-detail", args=[goa.pk]),
            {"tagline": "Sand"},
            format="json",
        ).status_code
        == 200
    )
    goa.refresh_from_db()
    assert goa.tagline == "Sand" and goa.image

    make_package(goa)
    res = boss_api.delete(reverse("admin_api:destination-detail", args=[goa.pk]))
    assert res.status_code == 409 and res.data["code"] == "protected"


def test_reviews_and_credits(boss_api):
    assert (
        boss_api.post(
            REVIEWS, {"text": "Lovely", "name": "Asha", "isPublished": False}, format="json"
        ).status_code
        == 201
    )
    assert boss_api.get(REVIEWS, {"published": "false"}).data["count"] == 1
    assert (
        boss_api.post(
            CREDITS, {"title": "Lake", "licence": "CC0", "source": "not a url"}, format="json"
        ).status_code
        == 400
    )
    assert (
        boss_api.post(
            CREDITS,
            {"title": "Lake", "licence": "CC0", "source": "https://example.com"},
            format="json",
        ).status_code
        == 201
    )
    assert Review.objects.count() == 1 and PhotoCredit.objects.count() == 1


def test_model_permissions(agent):
    client = api_for(agent)
    assert client.get(PACKAGES).status_code == 403
    grant(agent, "catalog.view_tourpackage")
    client = api_for(agent)
    assert client.get(PACKAGES).status_code == 200
    assert client.post(PACKAGES, PACKAGE, format="json").status_code == 403
