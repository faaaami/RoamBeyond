from datetime import timedelta
from unittest import mock

from django.core import mail
from django.urls import reverse
from django.utils import timezone

import pytest

from apps.admin_api.models import ActivityLog
from apps.enquiries.models import Enquiry

from .conftest import api_for, grant

pytestmark = pytest.mark.django_db

LIST = reverse("admin_api:enquiry-list")
BULK = reverse("admin_api:enquiry-bulk")
EXPORT = reverse("admin_api:enquiry-export")


def detail(e: Enquiry) -> str:
    return reverse("admin_api:enquiry-detail", args=[e.reference])


def make(**fields) -> Enquiry:
    values = {"kind": "callback", "name": "Ravi Kumar", "mobile": "+919876543210"}
    values.update(fields)
    return Enquiry.objects.create(consent_given_at=timezone.now(), **values)


@pytest.mark.parametrize(
    ("view", "expected"),
    [
        ("open", {"New lead", "Due lead", "Mine"}),
        ("new", {"New lead", "Mine"}),
        ("due", {"Due lead"}),
        ("mine", {"Mine"}),
        ("closed", {"Closed lead"}),
        ("all", {"New lead", "Due lead", "Mine", "Closed lead"}),
        ("bogus", {"New lead", "Due lead", "Mine"}),
    ],
)
def test_views(agent, view, expected):
    make(name="New lead")
    make(name="Due lead", status="contacted", follow_up_on=timezone.localdate() - timedelta(days=1))
    make(name="Mine", assigned_to=agent)
    make(name="Closed lead", status="closed")
    res = api_for(agent).get(LIST, {"view": view})
    assert {e["name"] for e in res.data["results"]} == expected


def test_search_filter_sort_paginate(agent):
    make(name="Asha Rao", mobile="+919811112222", kind="package", package_name="Kashmir")
    make(name="Ravi", mobile="+919733334444")
    for i in range(22):
        make(name=f"Bulk {i:02d}")
    client = api_for(agent)

    assert [e["name"] for e in client.get(LIST, {"q": "kashmir"}).data["results"]] == ["Asha Rao"]
    assert [e["name"] for e in client.get(LIST, {"q": "97333 34444"}).data["results"]] == ["Ravi"]
    assert [e["name"] for e in client.get(LIST, {"kind": "package"}).data["results"]] == [
        "Asha Rao"
    ]
    page = client.get(LIST, {"ordering": "name"}).data
    assert page["count"] == 24 and len(page["results"]) == 20
    assert page["results"][0]["name"] == "Asha Rao"


def test_detail_update_and_history(agent):
    enquiry = make(message="Call after 6pm", utm_source="instagram")
    client = api_for(agent)
    assert client.get(detail(enquiry)).data["leadSource"]["utmSource"] == "instagram"

    res = client.patch(
        detail(enquiry),
        {
            "status": "contacted",
            "assignedTo": agent.pk,
            "internalNotes": "Wants a houseboat",
            "name": "Hacked",
        },
    )
    assert res.status_code == 200 and res.data["statusLabel"] == "Contacted"
    enquiry.refresh_from_db()
    assert (enquiry.status, enquiry.assigned_to, enquiry.name) == ("contacted", agent, "Ravi Kumar")
    log = ActivityLog.objects.get()
    assert log.action == "changed" and "status" in log.changed_fields


def test_validation_errors_are_camelcase(agent, django_user_model):
    visitor = django_user_model.objects.create_user("v", "v@example.com", "pw")
    res = api_for(agent).patch(detail(make()), {"status": "lost", "assignedTo": visitor.pk})
    assert res.status_code == 400
    assert {f["path"] for f in res.data["fields"]} == {"status", "assignedTo"}


def test_no_create_and_delete_needs_permission(agent):
    enquiry = make()
    client = api_for(agent)
    assert client.post(LIST, {"name": "x"}).status_code in (403, 405)
    assert client.delete(detail(enquiry)).status_code == 403  # agents may not delete
    grant(agent, "enquiries.delete_enquiry")
    assert api_for(agent).delete(detail(enquiry)).status_code == 204
    assert not Enquiry.objects.exists()
    assert ActivityLog.objects.get().action == "deleted"


def test_bulk(agent):
    a, b = make(status="contacted"), make(status="contacted")  # New leads must be contacted first
    res = api_for(agent).post(
        BULK,
        {"references": [str(a.reference), str(b.reference)], "status": "closed"},
        format="json",
    )
    assert res.data == {"updated": 2}
    assert set(Enquiry.objects.values_list("status", flat=True)) == {"closed"}
    assert (
        api_for(agent).post(BULK, {"references": [str(a.reference)]}, format="json").status_code
        == 400
    )


def test_export_respects_filters_and_guards_formulas(agent):
    make(name='=HYPERLINK("evil")', kind="package")
    make(name="Not exported", kind="callback")
    res = api_for(agent).get(EXPORT, {"view": "all", "kind": "package"})
    body = res.content.decode("utf-8-sig")
    assert res["Content-Type"].startswith("text/csv")
    assert "'=HYPERLINK" in body and "Not exported" not in body
    assert "+919876543210" in body and "'+91" not in body


def test_resend_email(agent):
    enquiry = make()
    url = reverse("admin_api:enquiry-resend-email", args=[enquiry.reference])
    assert api_for(agent).post(url).status_code == 200
    assert len(mail.outbox) == 1
    with mock.patch("apps.enquiries.notifications.build_agency_email", side_effect=OSError("down")):
        res = api_for(agent).post(url)
    assert res.status_code == 502 and res.data["code"] == "email_failed"
