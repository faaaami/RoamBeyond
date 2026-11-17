"""Sections, stats, activity history, options, password change, and the camelCase contract."""

from django.urls import reverse
from django.utils import timezone

import pytest

from apps.admin_api import activity
from apps.admin_api.models import ActivityLog
from apps.admin_api.serializers.base import camelize, decamelize
from apps.catalog.models import PhotoCredit
from apps.enquiries.models import Enquiry

from .conftest import api_for

pytestmark = pytest.mark.django_db

ME = reverse("admin_api:me")
STATS = reverse("admin_api:stats")
ACTIVITY = reverse("admin_api:activity")
OPTIONS = reverse("admin_api:options")
PASSWORD = reverse("admin_api:password")


def test_me_lists_only_permitted_sections(agent, superuser):
    agent_sections = {s["key"]: s for s in api_for(agent).get(ME).data["sections"]}
    assert set(agent_sections) == {"enquiries"}
    assert agent_sections["enquiries"]["permissions"] == {
        "view": True,
        "add": False,
        "change": True,
        "delete": False,
    }
    boss = {s["key"]: s for s in api_for(superuser).get(ME).data["sections"]}
    assert {"users", "packages", "site-settings"} <= set(boss)
    assert boss["site-settings"]["permissions"]["add"] is False  # singletons: edit only


def test_every_endpoint_needs_staff(django_user_model, client):
    visitor = django_user_model.objects.create_user("v", "v@example.com", "pw")
    for name in ("stats", "activity", "options", "me"):
        url = reverse(f"admin_api:{name}")
        assert client.get(url).status_code == 401  # no token
        assert api_for(visitor).get(url).status_code == 403  # not staff
    assert api_for(visitor).get(reverse("admin_api:package-list")).status_code == 403


def test_stats_follow_permissions(agent, superuser, django_user_model):
    django_user_model.objects.create_user("visitor", "visitor@example.com", "pw")
    PhotoCredit.objects.create(title="Lake", licence="CC0", source="https://example.com")

    agent_stats = api_for(agent).get(STATS).data
    assert [t["key"] for t in agent_stats["totals"]] == ["enquiries"]
    assert agent_stats["counts"]["new"] == 0

    boss = api_for(superuser).get(STATS).data
    totals = {t["key"]: t["count"] for t in boss["totals"]}
    assert totals["photo-credits"] == 1
    assert totals["users"] == 2  # staff only: the superuser and the agent
    assert "site-settings" not in totals


def test_stats_hide_enquiries_without_permission(django_user_model):
    editor = django_user_model.objects.create_user("e", "e@example.com", "pw", is_staff=True)
    Enquiry.objects.create(
        kind="callback", name="Ravi", mobile="+919876543210", consent_given_at=timezone.now()
    )
    data = api_for(editor).get(STATS).data
    assert data["counts"] is None
    assert all(e["kind"] != "enquiry" for e in data["activity"])


def test_activity_history(superuser):
    credit = PhotoCredit.objects.create(title="Lake", licence="CC0", source="https://example.com")
    activity.log_change(superuser, credit, ["title"])
    Enquiry.objects.create(
        kind="callback", name="Ravi", mobile="+919876543210", consent_given_at=timezone.now()
    )

    feed = api_for(superuser).get(STATS).data["activity"]
    edit = next(e for e in feed if e["kind"] == "edit")
    assert edit["who"] == "Boss"
    assert edit["detail"] == "Changed photo title."
    assert edit["link"] == f"/admin/photo-credits/{credit.pk}"
    assert any(e["kind"] == "enquiry" and e["link"].startswith("/admin/enquiries/") for e in feed)

    page = api_for(superuser).get(ACTIVITY).data
    assert page["count"] == 1 and page["results"][0]["section"] == "Photo credits"


def test_history_survives_deletion(superuser):
    credit = PhotoCredit.objects.create(title="Lake", licence="CC0", source="https://example.com")
    activity.log_deletion(superuser, credit)
    credit.delete()
    superuser.delete()
    entry = ActivityLog.objects.get()
    assert entry.user is None and entry.user_name == "Boss" and entry.object_repr == "Lake"


def test_options(agent):
    data = api_for(agent).get(OPTIONS).data
    assert {"value": "family", "label": "Family"} in data["tripTypes"]
    assert any(o["label"] == "agent" for o in data["staff"])
    assert {r["label"] for r in data["roles"]} >= {"Sales", "Content editor", "Manager"}


def test_password_change(agent):
    client = api_for(agent)
    wrong = client.post(PASSWORD, {"currentPassword": "nope", "newPassword": "Another-Strong-1"})
    assert wrong.status_code == 400 and wrong.data["fields"][0]["path"] == "currentPassword"
    weak = client.post(PASSWORD, {"currentPassword": "pw", "newPassword": "123"})
    assert weak.status_code == 400
    ok = client.post(PASSWORD, {"currentPassword": "pw", "newPassword": "Another-Strong-1"})
    assert ok.status_code == 204
    agent.refresh_from_db()
    assert agent.check_password("Another-Strong-1")


def test_camelcase_round_trip():
    data = {"is_published": True, "photos": [{"cover_alt": "x"}], "price_from": 1}
    assert camelize(data) == {"isPublished": True, "photos": [{"coverAlt": "x"}], "priceFrom": 1}
    assert decamelize(camelize(data)) == data
