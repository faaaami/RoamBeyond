from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.enquiries import services as enquiry_services
from apps.enquiries.enums import EnquiryStatus
from apps.enquiries.models import Enquiry

User = get_user_model()


def _person(user) -> dict[str, Any] | None:
    if user is None:
        return None
    return {"id": user.pk, "name": user.get_full_name() or user.get_username()}


class EnquiryListSerializer(serializers.ModelSerializer):
    statusLabel = serializers.CharField(source="get_status_display")
    kindLabel = serializers.CharField(source="get_kind_display")
    summary = serializers.SerializerMethodField()
    assignedTo = serializers.SerializerMethodField()
    followUpOn = serializers.DateField(source="follow_up_on")
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Enquiry
        fields: tuple[str, ...] = (
            "reference",
            "kind",
            "kindLabel",
            "status",
            "statusLabel",
            "name",
            "mobile",
            "email",
            "summary",
            "assignedTo",
            "followUpOn",
            "createdAt",
        )

    def get_summary(self, obj: Enquiry) -> str:
        return obj.package_name or obj.destination or obj.message[:80]

    def get_assignedTo(self, obj: Enquiry) -> dict[str, Any] | None:
        return _person(obj.assigned_to)


class EnquiryDetailSerializer(EnquiryListSerializer):
    tripTypeLabel = serializers.SerializerMethodField()
    travelDate = serializers.DateField(source="travel_date")
    packageName = serializers.CharField(source="package_name")
    packageSlug = serializers.CharField(source="package_slug")
    departureCity = serializers.CharField(source="departure_city")
    internalNotes = serializers.CharField(source="internal_notes")
    leadSource = serializers.SerializerMethodField()
    notifiedAt = serializers.DateTimeField(source="notified_at")
    notificationError = serializers.CharField(source="notification_error")
    acknowledgedAt = serializers.DateTimeField(source="acknowledged_at")
    updatedAt = serializers.DateTimeField(source="updated_at")
    allowedStatuses = serializers.SerializerMethodField()

    class Meta(EnquiryListSerializer.Meta):
        fields = (
            *EnquiryListSerializer.Meta.fields,
            "allowedStatuses",
            "message",
            "packageName",
            "packageSlug",
            "departureCity",
            "destination",
            "travelDate",
            "duration",
            "budget",
            "tripTypeLabel",
            "adults",
            "children",
            "internalNotes",
            "leadSource",
            "notifiedAt",
            "notificationError",
            "acknowledgedAt",
            "updatedAt",
        )

    def get_allowedStatuses(self, obj: Enquiry) -> list[dict[str, str]]:
        """Statuses this lead may be set to now, for the status menu (current one included)."""
        labels = dict(EnquiryStatus.choices)
        return [
            {"value": s, "label": str(labels[s])}
            for s in enquiry_services.allowed_statuses(obj.status)
        ]

    def get_tripTypeLabel(self, obj: Enquiry) -> str:
        return obj.get_trip_type_display() if obj.trip_type else ""

    def get_leadSource(self, obj: Enquiry) -> dict[str, str]:
        return {
            "page": obj.source_page,
            "referrer": obj.referrer,
            "utmSource": obj.utm_source,
            "utmMedium": obj.utm_medium,
            "utmCampaign": obj.utm_campaign,
        }


_staff = User._default_manager.filter(is_staff=True, is_active=True)


class EnquiryUpdateSerializer(serializers.Serializer):
    """Only the workflow fields; what the traveller sent is never edited. All optional (PATCH)."""

    status = serializers.ChoiceField(choices=EnquiryStatus.choices, required=False)
    assignedTo = serializers.PrimaryKeyRelatedField(
        source="assigned_to",
        queryset=_staff,
        allow_null=True,
        required=False,
        error_messages={"does_not_exist": "Choose a member of staff."},
    )
    followUpOn = serializers.DateField(source="follow_up_on", allow_null=True, required=False)
    internalNotes = serializers.CharField(
        source="internal_notes", allow_blank=True, required=False, max_length=5000
    )


class EnquiryBulkSerializer(serializers.Serializer):
    """Apply one change to many enquiries: a status, or an assignee (null = nobody)."""

    references = serializers.ListField(child=serializers.UUIDField(), min_length=1, max_length=500)
    status = serializers.ChoiceField(choices=EnquiryStatus.choices, required=False)
    assignedTo = serializers.PrimaryKeyRelatedField(
        source="assigned_to", queryset=_staff, allow_null=True, required=False
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if "status" not in attrs and "assigned_to" not in attrs:
            raise serializers.ValidationError("Choose a status or a person to assign.")
        return attrs
