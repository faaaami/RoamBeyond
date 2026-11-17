"""Public navigation and trip-type wording."""

from django.core.exceptions import ValidationError
from django.urls import reverse

import pytest

from apps.pages.models import NavLink, TripTypeInfo

pytestmark = pytest.mark.django_db


def test_navigation_lists_only_published_links_in_order(client):
    NavLink.objects.all().delete()
    NavLink.objects.create(label="Contact", href="/contact", position=2)
    NavLink.objects.create(label="Hidden", href="/hidden", position=0, is_published=False)
    NavLink.objects.create(label="Packages", href="/packages", position=1)

    res = client.get(reverse("v1:pages:navigation"))
    assert res.status_code == 200
    assert res.json() == [
        {"label": "Packages", "href": "/packages"},
        {"label": "Contact", "href": "/contact"},
    ]


def test_seeded_trip_types_match_the_five_codes(client):
    data = client.get(reverse("v1:pages:trip-types")).json()
    assert [t["id"] for t in data] == ["solo", "couple", "family", "friends", "corporate"]
    assert data[3] == {"id": "friends", "label": "Friends group", "blurb": data[3]["blurb"]}
    assert all(t["blurb"] for t in data)


def test_trip_type_code_is_limited_to_the_enum():
    info = TripTypeInfo(code="cruise", label="Cruise")
    with pytest.raises(ValidationError):
        info.full_clean()
