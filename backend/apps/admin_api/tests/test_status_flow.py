"""Lead status moves follow the workflow: a New lead must be contacted before it can close."""

from django.urls import reverse
from django.utils import timezone

import pytest

from apps.enquiries.models import Enquiry

from .conftest import api_for

pytestmark = pytest.mark.django_db

BULK = reverse("admin_api:enquiry-bulk")


def make(status: str = "new", name: str = "Ravi Kumar") -> Enquiry:
    return Enquiry.objects.create(
        kind="callback",
        name=name,
        mobile="+919876543210",
        status=status,
        consent_given_at=timezone.now(),
    )


def detail(e: Enquiry) -> str:
    return reverse("admin_api:enquiry-detail", args=[e.reference])


def move(client, enquiry: Enquiry, status: str):
    return client.patch(detail(enquiry), {"status": status}, format="json")


def test_new_cannot_be_closed_or_converted_directly(superuser):
    client = api_for(superuser)
    for target in ("closed", "converted"):
        lead = make("new")
        res = move(client, lead, target)
        assert res.status_code == 400
        assert res.data["code"] == "invalid_status_change"
        assert "Set it to Contacted first" in res.data["error"]
        lead.refresh_from_db()
        assert lead.status == "new"


def test_normal_workflow_is_allowed(superuser):
    client = api_for(superuser)
    lead = make("new")
    assert move(client, lead, "contacted").status_code == 200
    assert move(client, lead, "converted").status_code == 200
    lead.refresh_from_db()
    assert lead.status == "converted"


def test_closing_after_contact_is_allowed(superuser):
    client = api_for(superuser)
    lead = make("contacted")
    assert move(client, lead, "closed").status_code == 200


def test_reopening_is_allowed_but_never_back_to_new(superuser):
    client = api_for(superuser)
    lead = make("closed")
    assert move(client, lead, "new").status_code == 400
    assert move(client, lead, "contacted").status_code == 200


def test_same_status_is_a_no_op(superuser):
    client = api_for(superuser)
    lead = make("new")
    assert move(client, lead, "new").status_code == 200


def test_detail_lists_the_statuses_a_lead_can_move_to(superuser):
    client = api_for(superuser)
    lead = make("new")
    values = [s["value"] for s in client.get(detail(lead)).data["allowedStatuses"]]
    assert values == ["new", "contacted"]
    lead.status = "contacted"
    lead.save()
    values = [s["value"] for s in client.get(detail(lead)).data["allowedStatuses"]]
    assert values == ["contacted", "closed", "converted"]


def test_bulk_change_is_all_or_nothing(superuser):
    client = api_for(superuser)
    fresh = make("new", name="Fresh lead")
    contacted = make("contacted", name="Called lead")
    references = [str(fresh.reference), str(contacted.reference)]
    res = client.post(BULK, {"references": references, "status": "closed"}, format="json")
    assert res.status_code == 400
    assert res.data["code"] == "invalid_status_change"
    fresh.refresh_from_db()
    contacted.refresh_from_db()
    assert fresh.status == "new" and contacted.status == "contacted"


def test_bulk_change_applies_when_every_lead_allows_it(superuser):
    client = api_for(superuser)
    a = make("contacted", name="A")
    b = make("contacted", name="B")
    references = [str(a.reference), str(b.reference)]
    res = client.post(BULK, {"references": references, "status": "closed"}, format="json")
    assert res.status_code == 200 and res.data["updated"] == 2
