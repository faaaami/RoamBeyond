"""
Dashboard numbers, the activity feed, and the choices forms need.

    GET /api/admin/stats/      totals per section, enquiry figures, recent activity
    GET /api/admin/activity/   change history, paginated (?page=)
    GET /api/admin/options/    dropdown choices: trip types, categories, destinations, staff...
"""

from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from apps.catalog.enums import BudgetBand, Category, TripType
from apps.catalog.models import Destination
from apps.enquiries.enums import EnquiryKind, EnquiryStatus
from apps.enquiries.models import Enquiry

from .. import activity
from ..base import StaffAPIMixin, StaffPagination
from ..models import ActivityLog
from ..sections import SECTIONS
from ..serializers.enquiries import EnquiryListSerializer

OPEN = (EnquiryStatus.NEW, EnquiryStatus.CONTACTED)


def _choices(enum) -> list[dict[str, str]]:
    return [{"value": value, "label": label} for value, label in enum.choices]


class StatsView(StaffAPIMixin, APIView):
    """Totals have one entry per section the user may see; enquiry figures need enquiry access."""

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        user = request.user
        totals = [
            {"key": s.key, "title": s.title, "icon": s.icon, "count": s.count()}
            for s in SECTIONS
            if not s.singleton and s.permissions_for(user)["view"]
        ]
        data: dict[str, Any] = {
            "totals": totals,
            "counts": None,
            "byStatus": [],
            "topPackages": [],
            "recentEnquiries": [],
            "activity": activity.recent_activity(12),
        }
        if not user.has_perm("enquiries.view_enquiry"):
            data["activity"] = [e for e in data["activity"] if e["kind"] == "edit"]
            return Response(data)

        now = timezone.now()
        today = timezone.localdate()
        data["counts"] = Enquiry.objects.aggregate(
            new=Count("pk", filter=Q(status=EnquiryStatus.NEW)),
            due=Count("pk", filter=Q(status__in=OPEN, follow_up_on__lte=today)),
            mine=Count("pk", filter=Q(status__in=OPEN, assigned_to=user.pk)),
            unassigned=Count("pk", filter=Q(status__in=OPEN, assigned_to__isnull=True)),
            thisWeek=Count("pk", filter=Q(created_at__gte=now - timedelta(days=7))),
            convertedThisMonth=Count(
                "pk",
                filter=Q(status=EnquiryStatus.CONVERTED, updated_at__gte=now - timedelta(days=30)),
            ),
            emailFailed=Count("pk", filter=Q(notified_at__isnull=True) & ~Q(notification_error="")),
        )
        per_status = dict(Enquiry.objects.order_by().values_list("status").annotate(n=Count("pk")))
        data["byStatus"] = [
            {"status": v, "label": label, "count": per_status.get(v, 0)}
            for v, label in EnquiryStatus.choices
        ]
        data["topPackages"] = [
            {"name": row["package_name"], "slug": row["package_slug"], "count": row["n"]}
            for row in Enquiry.objects.filter(created_at__gte=now - timedelta(days=30))
            .exclude(package_name="")
            .values("package_name", "package_slug")
            .annotate(n=Count("pk"))
            .order_by("-n")[:5]
        ]
        recent = Enquiry.objects.select_related("assigned_to").order_by("-created_at")[:5]
        data["recentEnquiries"] = EnquiryListSerializer(recent, many=True).data
        return Response(data)


class ActivityView(StaffAPIMixin, APIView):
    """The full change history, newest first."""

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        paginator = StaffPagination()
        page = paginator.paginate_queryset(
            ActivityLog.objects.order_by("-created_at"), request, self
        )
        refs = activity.enquiry_refs_for(page or [])
        return paginator.get_paginated_response(
            [activity.serialize_entry(e, refs) for e in page or []]
        )


class OptionsView(StaffAPIMixin, APIView):
    """Everything a form's dropdowns need, in one request."""

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        staff = get_user_model()._default_manager.filter(is_staff=True, is_active=True)
        return Response(
            {
                "tripTypes": _choices(TripType),
                "categories": _choices(Category),
                "budgets": _choices(BudgetBand),
                "enquiryStatuses": _choices(EnquiryStatus),
                "enquiryKinds": _choices(EnquiryKind),
                "destinations": [
                    {"value": str(pk), "label": name}
                    for pk, name in Destination.objects.order_by("name").values_list("pk", "name")
                ],
                "staff": [
                    {"value": str(u.pk), "label": u.get_full_name() or u.get_username()}
                    for u in staff.order_by("first_name", "username")
                ],
                "roles": [
                    {"value": str(pk), "label": name}
                    for pk, name in Group.objects.order_by("name").values_list("pk", "name")
                ],
            }
        )
