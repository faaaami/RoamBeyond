"""
Enquiries: list, view, edit the follow-up, delete. No create: they come from the website.

    GET    /api/admin/enquiries/?view=open|new|due|mine|unassigned|closed|all
                                    &kind=&q=&ordering=&page=
    GET    /api/admin/enquiries/<reference>/
    PATCH  /api/admin/enquiries/<reference>/   {status?, assignedTo?, followUpOn?, internalNotes?}
    DELETE /api/admin/enquiries/<reference>/
    POST   /api/admin/enquiries/bulk/          {references, status? | assignedTo?}
    GET    /api/admin/enquiries/export/        CSV of the current filters
    POST   /api/admin/enquiries/<reference>/resend-email/
"""

import csv
import logging
import re

from django.db import transaction
from django.db.models import Q, QuerySet
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

from apps.core.exceptions import ApiError
from apps.enquiries import notifications, services
from apps.enquiries.enums import EnquiryStatus
from apps.enquiries.models import Enquiry

from .. import activity
from ..base import DeclaredFilters, StaffModelViewSet
from ..permissions import IsStaff
from ..serializers.enquiries import (
    EnquiryBulkSerializer,
    EnquiryDetailSerializer,
    EnquiryListSerializer,
    EnquiryUpdateSerializer,
)

OPEN = (EnquiryStatus.NEW, EnquiryStatus.CONTACTED)
VIEWS = {"open", "new", "due", "mine", "unassigned", "closed", "all"}


def filter_view(request: Request, qs: QuerySet[Enquiry]) -> QuerySet[Enquiry]:
    view = request.query_params.get("view", "open")
    today = timezone.localdate()
    if view not in VIEWS or view == "open":
        return qs.filter(status__in=OPEN)
    if view == "new":
        return qs.filter(status=EnquiryStatus.NEW)
    if view == "due":
        return qs.filter(status__in=OPEN, follow_up_on__lte=today).order_by("follow_up_on")
    if view == "mine":
        return qs.filter(status__in=OPEN, assigned_to=request.user.pk)
    if view == "unassigned":
        return qs.filter(status__in=OPEN, assigned_to__isnull=True)
    if view == "closed":
        return qs.filter(status__in=(EnquiryStatus.CONVERTED, EnquiryStatus.CLOSED))
    return qs


def filter_search(request: Request, qs: QuerySet[Enquiry]) -> QuerySet[Enquiry]:
    """Name, email, package or destination; phone numbers match on their digits."""
    q = request.query_params.get("q", "").strip()[:100]
    if not q:
        return qs
    match = (
        Q(name__icontains=q)
        | Q(email__icontains=q)
        | Q(package_name__icontains=q)
        | Q(destination__icontains=q)
    )
    digits = "".join(ch for ch in q if ch.isdigit())
    if len(digits) >= 4:
        match |= Q(mobile__contains=digits)
    return qs.filter(match)


logger = logging.getLogger(__name__)


class EnquiryViewSet(StaffModelViewSet):
    queryset = Enquiry.objects.select_related("assigned_to").order_by("-created_at")
    lookup_field = "reference"
    http_method_names = ["get", "patch", "delete", "post", "head", "options"]
    filter_backends = [DeclaredFilters, filters.OrderingFilter]
    filter_fields = {"kind": "kind", "status": "status", "assigned": "assigned_to"}
    ordering_fields = ("created_at", "name", "status", "kind", "follow_up_on")

    def get_permissions(self):
        # Bulk changes and re-sending email are edits, not additions: they check the
        # `change` permission themselves rather than the `add` that POST implies.
        if self.action in ("bulk", "resend_email"):
            return [IsStaff()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list" or self.action == "export":
            qs = filter_search(self.request, filter_view(self.request, qs))
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return EnquiryListSerializer
        if self.action == "partial_update":
            return EnquiryUpdateSerializer
        return EnquiryDetailSerializer

    def create(self, request, *args, **kwargs):
        raise ApiError(
            "Enquiries come from the website and cannot be added here.",
            code="method_not_allowed",
            status_code=405,
        )

    def update(self, request, *args, **kwargs):
        if not kwargs.get("partial"):
            raise ApiError(
                "Use PATCH to change an enquiry.", code="method_not_allowed", status_code=405
            )
        enquiry = self.get_object()
        serializer = EnquiryUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changes = serializer.validated_data
        with transaction.atomic():
            before = {name: getattr(enquiry, name) for name in changes}
            try:
                services.update_enquiry(enquiry, changes)
            except services.InvalidStatusChange as exc:
                raise ApiError(str(exc), code="invalid_status_change", status_code=400) from exc
            changed = [n for n in changes if getattr(enquiry, n) != before[n]]
            if changed:
                activity.log_change(request.user, enquiry, changed)
        return Response(EnquiryDetailSerializer(enquiry, context={"request": request}).data)

    @extend_schema(request=EnquiryBulkSerializer, responses={200: None})
    @action(detail=False, methods=["post"])
    def bulk(self, request: Request) -> Response:
        if not request.user.has_perm("enquiries.change_enquiry"):
            raise ApiError(
                "You do not have permission to change enquiries.",
                code="permission_denied",
                status_code=403,
            )
        serializer = EnquiryBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        references = data.pop("references")
        updated = 0
        with transaction.atomic():
            for enquiry in Enquiry.objects.filter(reference__in=references):
                try:
                    services.update_enquiry(enquiry, data)
                except services.InvalidStatusChange as exc:
                    # Raising inside the transaction undoes the rows already changed too.
                    raise ApiError(
                        f"{enquiry.name}: {exc} No enquiries were changed.",
                        code="invalid_status_change",
                        status_code=400,
                    ) from exc
                activity.log_change(request.user, enquiry, data.keys())
                updated += 1
        return Response({"updated": updated})

    @action(detail=False, methods=["get"])
    def export(self, request: Request) -> HttpResponse:
        rows = self.filter_queryset(self.get_queryset())[:5000]
        # Exports contain personal details; record who took them and how many rows.
        logger.info(
            "Enquiry export by user %s: %d rows, filters=%s",
            request.user.pk,
            len(rows),
            dict(request.query_params),
        )
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        stamp = timezone.localtime().strftime("%Y-%m-%d")
        response["Content-Disposition"] = f'attachment; filename="enquiries-{stamp}.csv"'
        response.write("﻿")  # BOM, so Excel reads ₹ and Indian names correctly
        writer = csv.writer(response)
        writer.writerow(EXPORT_COLUMNS.keys())
        for enquiry in rows:
            writer.writerow(csv_safe(get(enquiry)) for get in EXPORT_COLUMNS.values())
        return response

    @action(detail=True, methods=["post"], url_path="resend-email")
    def resend_email(self, request: Request, reference: str) -> Response:
        enquiry = self.get_object()
        if not request.user.has_perm("enquiries.change_enquiry"):
            raise ApiError(
                "You do not have permission to change enquiries.",
                code="permission_denied",
                status_code=403,
            )
        if not notifications.notify_agency(enquiry):
            raise ApiError(
                "The email could not be sent. Check the email settings on the server.",
                code="email_failed",
                status_code=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(EnquiryDetailSerializer(enquiry, context={"request": request}).data)


EXPORT_COLUMNS = {
    "Received": lambda e: timezone.localtime(e.created_at).strftime("%Y-%m-%d %H:%M"),
    "Type": lambda e: e.get_kind_display(),
    "Status": lambda e: e.get_status_display(),
    "Name": lambda e: e.name,
    "Mobile": lambda e: e.mobile,
    "Email": lambda e: e.email,
    "Package": lambda e: e.package_name,
    "Destination": lambda e: e.destination,
    "Travel date": lambda e: e.travel_date or "",
    "Trip type": lambda e: e.get_trip_type_display() if e.trip_type else "",
    "Adults": lambda e: "" if e.adults is None else e.adults,
    "Children": lambda e: "" if e.children is None else e.children,
    "Budget": lambda e: e.budget,
    "Message": lambda e: e.message,
    "Assigned to": lambda e: e.assigned_to.get_username() if e.assigned_to else "",
    "Follow up on": lambda e: e.follow_up_on or "",
    "Source": lambda e: e.utm_source or ("referral" if e.referrer else "direct"),
    "Campaign": lambda e: e.utm_campaign,
    "Page": lambda e: e.source_page,
    "Notes": lambda e: e.internal_notes,
    "Reference": lambda e: e.reference,
}

PHONE_RE = re.compile(r"^\+\d{8,15}$")


def csv_safe(value: object) -> str:
    """
    Stop spreadsheet formula injection from visitor-typed text (=, +, -, @).
    Our own E.164 phone numbers stay as they are.
    """
    text = str(value)
    if text[:1] in ("=", "+", "-", "@", "\t", "\r") and not PHONE_RE.match(text):
        return f"'{text}"
    return text
