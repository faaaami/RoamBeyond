"""Field-level validation shared by the API serializers and the model."""

import re

from django.core.exceptions import ValidationError

# Indian mobile: 10 digits starting 6 to 9, optional +91 / 91 / 0 prefix, spaces or dashes allowed.
INDIAN_MOBILE_RE = re.compile(r"^(?:(?:\+91|91)[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$")

MOBILE_ERROR = "Enter a valid 10-digit Indian mobile number"


def validate_indian_mobile(value: str) -> None:
    if not INDIAN_MOBILE_RE.match(value.strip()):
        raise ValidationError(MOBILE_ERROR, code="invalid")


def normalize_indian_mobile(value: str) -> str:
    """Return the number in E.164 form, e.g. "+919876543210". Assumes it already validated."""
    digits = re.sub(r"\D", "", value)
    return f"+91{digits[-10:]}"
