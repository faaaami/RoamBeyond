from django.urls import reverse

import pytest

from apps.catalog.models import ItineraryDay, PackagePhoto, PhotoCredit, Review

from .factories import image_file, make_destination, make_package

pytestmark = pytest.mark.django_db


def test_destinations_list_matches_frontend_shape(api_client):
    kashmir = make_destination(sort_order=20, popular=True)
    make_destination(name="Kerala", slug="kerala", sort_order=10)
    make_package(kashmir)
    make_package(kashmir, slug="hidden", is_published=False)

    res = api_client.get(reverse("v1:catalog:destination-list"))

    assert res.status_code == 200
    assert [d["slug"] for d in res.json()] == ["kerala", "kashmir"]  # sort_order wins
    first = res.json()[1]
    assert set(first) == {
        "slug",
        "name",
        "region",
        "tagline",
        "description",
        "bestSeason",
        "knownFor",
        "image",
        "popular",
        "packageCount",
    }
    assert first["packageCount"] == 1  # unpublished package not counted
    assert first["knownFor"] == ["Dal Lake houseboats"]
    assert first["image"].startswith("http://testserver/media/destinations/")


def test_unpublished_destination_hides_it_and_its_packages(api_client):
    hidden = make_destination(is_published=False)
    make_package(hidden)

    assert api_client.get(reverse("v1:catalog:destination-list")).json() == []
    assert api_client.get(reverse("v1:catalog:package-list")).json() == []


def test_package_list_has_card_fields_only(api_client):
    make_package(make_destination())

    [package] = api_client.get(reverse("v1:catalog:package-list")).json()

    assert package["destination"] == "kashmir"
    assert package["destinationName"] == "Kashmir"
    assert package["tripTypes"] == ["couple", "family"]
    assert package["priceFrom"] == 24999
    assert "itinerary" not in package


def test_package_detail_numbers_days_and_puts_cover_first(api_client):
    package = make_package(make_destination(), price_from=None)
    ItineraryDay.objects.create(package=package, position=2, title="Gulmarg", description="…")
    ItineraryDay.objects.create(package=package, position=1, title="Arrive", description="…")
    PackagePhoto.objects.create(package=package, image=image_file(), alt="Meadow")

    res = api_client.get(reverse("v1:catalog:package-detail", args=[package.slug]))

    assert res.status_code == 200
    body = res.json()
    assert body["priceFrom"] is None
    assert [(d["day"], d["title"]) for d in body["itinerary"]] == [(1, "Arrive"), (2, "Gulmarg")]
    assert [p["alt"] for p in body["gallery"]] == ["Dal Lake at dawn", "Meadow"]
    assert body["quickFacts"]["startCity"] == "Srinagar"


def test_unknown_or_unpublished_package_is_404(api_client):
    make_package(make_destination(), is_published=False)

    assert api_client.get(reverse("v1:catalog:package-detail", args=["nope"])).status_code == 404
    url = reverse("v1:catalog:package-detail", args=["kashmir-valley-escape"])
    assert api_client.get(url).status_code == 404


def test_reviews_and_credits(api_client):
    Review.objects.create(text="Lovely", name="Asha", sort_order=2)
    Review.objects.create(text="Great", name="Ravi", sort_order=1)
    Review.objects.create(text="Draft", name="Hidden", is_published=False)
    PhotoCredit.objects.create(title="B", licence="CC0", source="https://example.com/b")
    PhotoCredit.objects.create(title="A", licence="CC0", source="https://example.com/a")

    reviews = api_client.get(reverse("v1:catalog:review-list")).json()
    credits = api_client.get(reverse("v1:catalog:photo-credit-list")).json()

    assert [r["name"] for r in reviews] == ["Ravi", "Asha"]
    assert [c["title"] for c in credits] == ["A", "B"]


def test_catalog_is_read_only(api_client):
    assert api_client.post(reverse("v1:catalog:package-list"), {}).status_code == 405


def test_media_base_url_setting_overrides_request_host(api_client, settings):
    settings.PUBLIC_MEDIA_BASE_URL = "https://api.example.com"
    make_destination()

    [destination] = api_client.get(reverse("v1:catalog:destination-list")).json()

    assert destination["image"].startswith("https://api.example.com/media/")
