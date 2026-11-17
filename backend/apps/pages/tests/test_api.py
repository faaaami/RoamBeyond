from django.urls import reverse

import pytest

from apps.catalog.tests.factories import image_file, make_destination
from apps.pages.models import (
    AboutFact,
    AboutPage,
    HomePage,
    HomeStep,
    LegalPage,
    LegalSection,
    OtherPages,
    SiteSettings,
    StoryScene,
)

pytestmark = pytest.mark.django_db


def test_site_settings_nested_shape(api_client):
    settings = SiteSettings.load()
    settings.phone_display = "+91 98765 43210"
    settings.budget_value = "under ₹20,000"
    settings.cancellation_terms = ["30 days: full refund"]
    settings.save()

    body = api_client.get(reverse("v1:pages:site-settings")).json()

    assert body["phone"] == {"display": "+91 98765 43210", "href": ""}
    assert body["budgetRanges"]["value"] == "under ₹20,000"
    assert body["cancellationTerms"] == ["30 days: full refund"]
    assert set(body["address"]) == {"display", "locality", "region", "mapQuery"}


def test_empty_page_returns_blanks_for_frontend_defaults(api_client):
    body = api_client.get(reverse("v1:pages:page-home")).json()

    assert body["hero"]["headlineLine1"] == ""
    assert body["marquee"] == []
    assert body["howItWorks"]["steps"] == []
    assert body["scenes"] == []


def test_home_scenes_fall_back_to_destination(api_client):
    page = HomePage.load()
    kashmir = make_destination()
    hidden = make_destination(name="Hidden", slug="hidden", is_published=False)
    StoryScene.objects.create(page=page, destination=kashmir, title="Lake", position=1)
    StoryScene.objects.create(page=page, destination=hidden, title="Nope", position=2)
    HomeStep.objects.create(page=page, title="Choose", text="Pick one")

    body = api_client.get(reverse("v1:pages:page-home")).json()

    [scene] = body["scenes"]
    assert scene["slug"] == "kashmir"
    assert scene["label"] == "North India"  # destination region
    assert "/media/destinations/" in scene["image"]  # destination photo
    assert body["howItWorks"]["steps"] == [{"title": "Choose", "text": "Pick one"}]


def test_about_page_photos_and_facts(api_client):
    page = AboutPage.load()
    page.team_photo = image_file("team.jpg")
    page.team_photo_alt = "The team"
    page.save()
    AboutFact.objects.create(page=page, label="Founded", value="2012")

    body = api_client.get(reverse("v1:pages:page-about")).json()

    assert body["teamPhoto"]["alt"] == "The team"
    assert body["teamPhoto"]["src"].startswith("http://testserver/media/pages/about/")
    # The office photo is the seeded placeholder (see migration 0007).
    assert body["officePhoto"]["src"].startswith("http://testserver/media/pages/about/")
    assert body["facts"] == [{"label": "Founded", "value": "2012"}]


def test_other_pages_and_legal(api_client):
    other = OtherPages.load()
    other.plan_next_steps = ["We call you back {callback-time}."]
    other.save()
    terms = LegalPage.objects.get(kind="terms")
    terms.hide_template_notice = True
    terms.save()
    LegalSection.objects.create(page=terms, heading="Cancellations", body="{cancellation-terms}")

    plan = api_client.get(reverse("v1:pages:page-other")).json()["planTrip"]
    legal = api_client.get(reverse("v1:pages:page-terms")).json()

    assert plan["nextSteps"] == ["We call you back {callback-time}."]
    assert legal["hideTemplateNotice"] is True
    assert legal["sections"] == [{"heading": "Cancellations", "body": "{cancellation-terms}"}]
    assert api_client.get(reverse("v1:pages:page-privacy")).json()["sections"] == []


def test_singleton_always_uses_one_row():
    SiteSettings(hours="9 to 6").save()
    SiteSettings(hours="10 to 7").save()

    assert SiteSettings.objects.count() == 1
    assert SiteSettings.load().hours == "10 to 7"
    with pytest.raises(NotImplementedError):
        SiteSettings.load().delete()
