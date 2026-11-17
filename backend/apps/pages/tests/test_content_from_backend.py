"""Content that used to live in the website's code: vocabulary, page titles and photos."""

from django.urls import reverse

import pytest

from apps.pages.models import AboutPage, PageSeo

pytestmark = pytest.mark.django_db


def test_vocabulary_lists_categories_durations_and_budgets(client):
    data = client.get(reverse("v1:pages:vocabulary")).json()
    assert {c["id"] for c in data["categories"]} == {
        "hills",
        "beach",
        "heritage",
        "adventure",
        "pilgrimage",
        "nature",
    }
    durations = {d["id"]: (d["min"], d["max"]) for d in data["durations"]}
    assert durations == {"short": (1, 4), "medium": (5, 7), "long": (8, 99)}
    assert [b["id"] for b in data["budgets"]] == ["value", "comfort", "premium"]


def test_page_titles_are_served_by_path(client):
    data = client.get(reverse("v1:pages:seo")).json()
    assert data["/about"]["title"] == "About us"
    assert data["/packages"]["description"].startswith("Browse tour packages")


def test_saved_page_title_is_served(client):
    PageSeo.objects.filter(path="/about").update(title="Our story")
    assert client.get(reverse("v1:pages:seo")).json()["/about"]["title"] == "Our story"


def test_about_page_has_its_photos():
    page = AboutPage.load()
    assert page.team_photo.name and page.office_photo.name
