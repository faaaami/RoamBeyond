import json

from django.contrib.auth.models import Group
from django.urls import reverse

import pytest

from apps.admin_api.models import ActivityLog
from apps.catalog.tests.factories import make_destination
from apps.pages.models import AboutPage, HomePage, LegalPage, SiteSettings

from .conftest import api_for, grant, png

pytestmark = pytest.mark.django_db

USERS = reverse("admin_api:user-list")


# ---------------------------------------------------------------------------
# Website pages
# ---------------------------------------------------------------------------


def test_site_settings_get_and_patch(boss_api):
    url = reverse("admin_api:site-settings")
    assert "phoneDisplay" in boss_api.get(url).data
    res = boss_api.patch(
        url,
        {"phoneDisplay": "+91 98765 43210", "cancellationTerms": ["Full refund"]},
        format="json",
    )
    assert res.status_code == 200
    settings = SiteSettings.load()
    assert settings.phone_display == "+91 98765 43210" and settings.cancellation_terms == [
        "Full refund"
    ]
    assert ActivityLog.objects.get().changed_fields == [
        "phone shown to visitors",
        "cancellation terms",
    ]
    bad = boss_api.patch(url, {"phoneHref": "98765"}, format="json")
    assert bad.status_code == 400 and bad.data["fields"][0]["path"] == "phoneHref"


def test_home_page_children_and_scene_images(boss_api):
    kashmir = make_destination()
    url = reverse("admin_api:home-page")
    body = {
        "heroEyebrow": "Hello",
        "steps": [{"title": "Choose", "text": "Pick"}, {"title": "Call", "text": ""}],
        "scenes": [{"destination": kashmir.pk, "title": "Lake"}],
    }
    res = boss_api.patch(
        url, {"data": json.dumps(body), "scenes.0.image": png()}, format="multipart"
    )
    assert res.status_code == 200, res.data
    page = HomePage.load()
    assert page.hero_eyebrow == "Hello" and [s.title for s in page.steps.all()] == [
        "Choose",
        "Call",
    ]
    scene = page.scenes.get()
    assert scene.image and res.data["scenes"][0]["destinationName"] == "Kashmir"

    # Keep the scene (by id) without re-sending its image: the image stays.
    res = boss_api.patch(
        url,
        {"scenes": [{"id": scene.pk, "destination": kashmir.pk, "title": "Dal Lake"}]},
        format="json",
    )
    scene.refresh_from_db()
    assert scene.title == "Dal Lake" and scene.image


def test_about_photo_can_be_removed(boss_api):
    url = reverse("admin_api:about-page")
    boss_api.patch(
        url, {"data": json.dumps({"teamPhotoAlt": "Team"}), "team_photo": png()}, format="multipart"
    )
    assert AboutPage.load().team_photo
    boss_api.patch(url, {"teamPhoto": None}, format="json")
    assert not AboutPage.load().team_photo


def test_legal_pages_edit_only(boss_api):
    terms = LegalPage.objects.get(kind="terms")
    url = reverse("admin_api:legal-page-detail", args=[terms.pk])
    assert len(boss_api.get(reverse("admin_api:legal-page-list")).data) == 2
    res = boss_api.patch(
        url,
        {"hideTemplateNotice": True, "sections": [{"heading": "Prices", "body": "Indicative"}]},
        format="json",
    )
    assert res.status_code == 200 and res.data["sections"][0]["heading"] == "Prices"
    assert boss_api.delete(url).status_code == 405
    assert boss_api.post(reverse("admin_api:legal-page-list"), {}, format="json").status_code == 405


def test_pages_need_permission(agent):
    assert api_for(agent).get(reverse("admin_api:site-settings")).status_code == 403
    grant(agent, "pages.view_sitesettings")
    client = api_for(agent)
    assert client.get(reverse("admin_api:site-settings")).status_code == 200
    assert (
        client.patch(
            reverse("admin_api:site-settings"), {"hours": "9-6"}, format="json"
        ).status_code
        == 403
    )


# ---------------------------------------------------------------------------
# Staff accounts and roles
# ---------------------------------------------------------------------------


def test_only_administrators_manage_accounts(agent):
    assert api_for(agent).get(USERS).status_code == 403
    assert api_for(agent).get(reverse("admin_api:role-list")).status_code == 403


def test_create_account_with_role(boss_api, django_user_model):
    sales = Group.objects.get(name="Sales")
    weak = boss_api.post(
        USERS, {"username": "neha", "email": "neha@example.com", "password": "123"}, format="json"
    )
    assert weak.status_code == 400 and weak.data["fields"][0]["path"] == "password"

    res = boss_api.post(
        USERS,
        {
            "username": "neha",
            "firstName": "Neha",
            "email": "Neha@Example.com",
            "password": "Strong-Pass-123",
            "roles": [sales.pk],
        },
        format="json",
    )
    assert res.status_code == 201, res.data
    assert res.data["roleNames"] == ["Sales"] and "password" not in res.data
    neha = django_user_model.objects.get(username="neha")
    assert (
        neha.is_staff
        and neha.email == "neha@example.com"
        and neha.check_password("Strong-Pass-123")
    )
    assert neha.has_perm("enquiries.view_enquiry")

    duplicate = boss_api.post(
        USERS,
        {"username": "other", "email": "neha@example.com", "password": "Strong-Pass-123"},
        format="json",
    )
    assert duplicate.data["fields"][0]["path"] == "email"


def test_cannot_lock_yourself_out(boss_api, superuser):
    url = reverse("admin_api:user-detail", args=[superuser.pk])
    assert boss_api.patch(url, {"isActive": False}, format="json").status_code == 400
    assert boss_api.patch(url, {"isSuperuser": False}, format="json").status_code == 400
    assert boss_api.delete(url).status_code == 403


def test_reset_someone_elses_password(boss_api, agent):
    url = reverse("admin_api:user-detail", args=[agent.pk])
    assert boss_api.patch(url, {"password": "New-Strong-Pass-9"}, format="json").status_code == 200
    agent.refresh_from_db()
    assert agent.check_password("New-Strong-Pass-9")


def test_roles_list(boss_api):
    roles = {r["name"]: r for r in boss_api.get(reverse("admin_api:role-list")).data}
    assert roles["Sales"]["sections"] == ["Enquiries"]
    assert "Tour packages" in roles["Content editor"]["sections"]
