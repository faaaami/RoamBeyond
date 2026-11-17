"""
Input validation for enquiry submissions.

Field names are camelCase to match the JSON the Next.js forms already send,
and the error messages mirror the Zod schema in src/lib/enquiry-schema.ts so
visitors see the same wording whichever side rejects the input.
"""

from rest_framework import serializers

from .enums import EnquiryKind, TripType
from .validators import INDIAN_MOBILE_RE, MOBILE_ERROR, normalize_indian_mobile


class BlankableDateField(serializers.DateField):
    """Accepts "" as "not given", which is what an empty HTML date input submits."""

    def __init__(self, **kwargs):
        kwargs.setdefault("allow_null", True)
        kwargs.setdefault("required", False)
        super().__init__(**kwargs)

    def validate_empty_values(self, data):
        if data == "":
            return True, None
        return super().validate_empty_values(data)


class TrackingField(serializers.CharField):
    """
    Optional attribution data. Over-long values are cut to fit instead of
    rejected: a visitor must never see an error because of a long referrer URL.
    """

    def __init__(self, *, limit: int, **kwargs):
        self.limit = limit
        super().__init__(required=False, allow_blank=True, trim_whitespace=True, **kwargs)

    def to_internal_value(self, data) -> str:
        return super().to_internal_value(data)[: self.limit]


class BaseEnquirySerializer(serializers.Serializer):
    """Fields every enquiry kind has. Subclasses add their own and set `enquiry_kind`."""

    enquiry_kind: EnquiryKind

    name = serializers.CharField(
        min_length=2,
        max_length=80,
        trim_whitespace=True,
        error_messages={
            "min_length": "Please enter your full name",
            "max_length": "Name is too long",
            "blank": "Please enter your full name",
        },
    )
    mobile = serializers.RegexField(
        INDIAN_MOBILE_RE,
        trim_whitespace=True,
        error_messages={"invalid": MOBILE_ERROR, "blank": MOBILE_ERROR},
    )
    consent = serializers.BooleanField()
    # Honeypot. Real visitors never see it; the view rejects filled ones before validation.
    website = serializers.CharField(required=False, allow_blank=True, max_length=200)

    sourcePage = TrackingField(source="source_page", limit=300)
    referrer = TrackingField(limit=500)
    utmSource = TrackingField(source="utm_source", limit=100)
    utmMedium = TrackingField(source="utm_medium", limit=100)
    utmCampaign = TrackingField(source="utm_campaign", limit=100)

    def validate_mobile(self, value: str) -> str:
        return normalize_indian_mobile(value)

    def validate_consent(self, value: bool) -> bool:
        if value is not True:
            raise serializers.ValidationError("Please tick the box so we can contact you")
        return value

    def validate(self, attrs: dict) -> dict:
        # Not model fields: the view already used `kind`, and `website` is the honeypot.
        attrs.pop("kind", None)
        attrs.pop("website", None)
        return attrs


class TravelDetailsMixin(serializers.Serializer):
    """Shared by package and custom-trip enquiries."""

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        error_messages={"invalid": "Enter a valid email address"},
    )
    travelDate = BlankableDateField(
        source="travel_date", error_messages={"invalid": "Choose a valid date"}
    )
    tripType = serializers.ChoiceField(
        choices=TripType.choices,
        source="trip_type",
        error_messages={"invalid_choice": "Choose a trip type", "required": "Choose a trip type"},
    )
    adults = serializers.IntegerField(
        min_value=1,
        max_value=200,
        error_messages={
            "required": "Enter the number of adults",
            "invalid": "Enter the number of adults",
            "min_value": "At least 1 adult",
            "max_value": "For groups above 200, please call us",
        },
    )
    children = serializers.IntegerField(
        min_value=0,
        max_value=100,
        error_messages={
            "required": "Enter 0 if no children are travelling",
            "invalid": "Enter 0 if no children are travelling",
            "min_value": "Cannot be negative",
            "max_value": "Please call us for large groups",
        },
    )
    message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1500,
        trim_whitespace=True,
        error_messages={"max_length": "Please keep this under 1500 characters"},
    )


class CallbackEnquirySerializer(BaseEnquirySerializer):
    enquiry_kind = EnquiryKind.CALLBACK
    kind = serializers.ChoiceField(choices=[EnquiryKind.CALLBACK.value])

    message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1500,
        trim_whitespace=True,
        error_messages={"max_length": "Please keep this under 1500 characters"},
    )


class PackageEnquirySerializer(TravelDetailsMixin, BaseEnquirySerializer):
    enquiry_kind = EnquiryKind.PACKAGE
    kind = serializers.ChoiceField(choices=[EnquiryKind.PACKAGE.value])

    packageName = serializers.CharField(source="package_name", max_length=120, trim_whitespace=True)
    packageSlug = serializers.CharField(
        source="package_slug", max_length=120, allow_blank=True, trim_whitespace=True
    )


class CustomTripEnquirySerializer(TravelDetailsMixin, BaseEnquirySerializer):
    enquiry_kind = EnquiryKind.CUSTOM
    kind = serializers.ChoiceField(choices=[EnquiryKind.CUSTOM.value])

    departureCity = serializers.CharField(
        source="departure_city",
        required=False,
        allow_blank=True,
        max_length=80,
        trim_whitespace=True,
        error_messages={"max_length": "City name is too long"},
    )
    destination = serializers.CharField(
        min_length=2,
        max_length=120,
        trim_whitespace=True,
        error_messages={
            "min_length": "Tell us where you would like to go",
            "blank": "Tell us where you would like to go",
            "max_length": "Please shorten this",
        },
    )
    duration = serializers.CharField(required=False, allow_blank=True, max_length=40)
    budget = serializers.CharField(required=False, allow_blank=True, max_length=40)


SERIALIZERS_BY_KIND: dict[str, type[BaseEnquirySerializer]] = {
    EnquiryKind.CALLBACK: CallbackEnquirySerializer,
    EnquiryKind.PACKAGE: PackageEnquirySerializer,
    EnquiryKind.CUSTOM: CustomTripEnquirySerializer,
}


class EnquiryCreatedSerializer(serializers.Serializer):
    """Response body for a successful submission. Documentation only."""

    ok = serializers.BooleanField()
    reference = serializers.UUIDField()
