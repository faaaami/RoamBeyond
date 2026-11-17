from django.core.exceptions import ValidationError

import pytest

from apps.enquiries.validators import normalize_indian_mobile, validate_indian_mobile


@pytest.mark.parametrize(
    "value",
    ["9876543210", "+91 98765 43210", "91-9876543210", "09876543210", "98765-43210"],
)
def test_accepts_indian_mobiles(value):
    validate_indian_mobile(value)
    assert normalize_indian_mobile(value) == "+919876543210"


@pytest.mark.parametrize("value", ["", "12345", "5876543210", "+1 555 123 4567", "98765432100"])
def test_rejects_other_numbers(value):
    with pytest.raises(ValidationError):
        validate_indian_mobile(value)
