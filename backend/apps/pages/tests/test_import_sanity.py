import io
import json
from unittest import mock

from django.core.management import CommandError, call_command

import pytest
from PIL import Image

from apps.catalog.models import Destination, TourPackage
from apps.pages.models import HomePage, LegalPage, SiteSettings

pytestmark = pytest.mark.django_db

RESULT = {
    "siteSettings": {
        "phone": {"display": "+91 98", "href": "+919800000000"},
        "email": "[EMAIL]",
        "budgetRanges": {"value": "under ₹20,000"},
        "cancellationTerms": ["Full refund", ""],
    },
    "homePage": {
        "hero": {"headlineLine1": "See India your way."},
        "marquee": ["Leh", "Goa"],
        "howItWorks": {"title": "Three steps", "steps": [{"title": "Choose", "text": "Pick"}]},
        "scenes": [{"destination": "d1", "title": "Lake", "image": None}],
    },
    "aboutPage": {"storyTitle": "Our story", "facts": [{"label": "Founded", "value": "2012"}]},
    "otherPages": {"planTrip": {"title": "Plan", "nextSteps": ["We call you"]}},
    "privacyPage": None,
    "termsPage": {"title": "Terms", "sections": [{"heading": "Prices", "body": "Indicative"}]},
    "destinations": [
        {
            "_id": "d1",
            "name": "Kashmir",
            "slug": "kashmir",
            "region": "North",
            "tagline": "Lakes",
            "description": "…",
            "knownFor": ["Dal Lake"],
            "image": "https://cdn.sanity.io/images/x/y/kashmir.jpg",
            "popular": True,
            "order": 10,
        }
    ],
    "packages": [
        {
            "name": "Kashmir Valley Escape",
            "slug": "kve",
            "destination": "d1",
            "days": 6,
            "nights": 5,
            "priceFrom": 24999,
            "tripTypes": ["couple"],
            "category": "hills",
            "budget": "comfort",
            "summary": "s",
            "overview": "o",
            "highlights": ["h"],
            "quickFacts": {"startCity": "Srinagar"},
            "itinerary": [{"title": "Arrive", "description": "d", "meals": "Dinner"}],
            "cover": "https://cdn.sanity.io/images/x/y/cover.jpg",
            "coverAlt": "Lake",
            "gallery": [{"url": "https://cdn.sanity.io/images/x/y/kashmir.jpg", "alt": "Again"}],
        },
        {"name": "Orphan", "slug": "orphan", "destination": None},
    ],
    "reviews": [{"text": "Lovely", "name": "Asha"}],
    "photoCredits": [{"title": "Lake", "licence": "CC0", "source": "https://example.com"}],
}


def fake_urlopen(url, timeout=None):
    response = mock.MagicMock()
    if "/data/query/" in url:
        body = json.dumps({"result": RESULT}).encode()
        response.__enter__.return_value = io.BytesIO(body)
    else:
        buffer = io.BytesIO()
        Image.new("RGB", (2, 2)).save(buffer, format="JPEG")
        photo = mock.Mock()
        photo.read.return_value = buffer.getvalue()
        photo.headers.get_content_type.return_value = "image/jpeg"
        response.__enter__.return_value = photo
    return response


@pytest.fixture
def sanity():
    target = "apps.pages.management.commands.import_sanity.urllib.request.urlopen"
    with mock.patch(target, side_effect=fake_urlopen) as urlopen:
        yield urlopen


def test_imports_everything(sanity):
    call_command("import_sanity", project_id="abc", stdout=io.StringIO(), stderr=io.StringIO())

    package = TourPackage.objects.get()
    assert package.destination.slug == "kashmir"
    assert package.itinerary.get().meals == "Dinner"
    # A photo used twice (destination image and gallery photo) is downloaded once.
    assert package.photos.get().image.name == Destination.objects.get().image.name
    assert sanity.call_count == 1 + 2

    settings = SiteSettings.load()
    assert settings.email == "[EMAIL]"
    assert settings.cancellation_terms == ["Full refund"]
    assert settings.budget_value == "under ₹20,000"

    home = HomePage.load()
    assert home.hero_headline_line1 == "See India your way."
    assert home.how_title == "Three steps"
    assert home.marquee == ["Leh", "Goa"]
    assert home.scenes.get().destination.slug == "kashmir"
    assert LegalPage.objects.get(kind="terms").sections.get().heading == "Prices"


def test_refuses_to_duplicate_without_replace(sanity):
    call_command("import_sanity", project_id="abc", stdout=io.StringIO(), stderr=io.StringIO())
    with pytest.raises(CommandError, match="--replace"):
        call_command("import_sanity", project_id="abc", stdout=io.StringIO())

    call_command(
        "import_sanity", project_id="abc", replace=True, stdout=io.StringIO(), stderr=io.StringIO()
    )
    assert TourPackage.objects.count() == 1
    assert HomePage.load().steps.count() == 1
