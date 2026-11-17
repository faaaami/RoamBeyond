from django.core.exceptions import ValidationError
from django.db import IntegrityError

import pytest

from apps.core.fields import LinesFormField

from .factories import make_destination, make_package

pytestmark = pytest.mark.django_db


def test_lines_field_splits_and_strips():
    field = LinesFormField(required=False, max_items=3)
    assert field.clean("  one \n\n two\n") == ["one", "two"]
    assert field.prepare_value(["a", "b"]) == "a\nb"
    with pytest.raises(ValidationError):
        field.clean("1\n2\n3\n4")


def test_trip_types_must_be_known_values():
    package = make_package(make_destination())
    package.trip_types = ["family", "aliens"]
    with pytest.raises(ValidationError) as exc:
        package.full_clean()
    assert "trip_types" in exc.value.message_dict


def test_nights_cannot_exceed_days():
    with pytest.raises(IntegrityError):
        make_package(make_destination(), days=2, nights=3)
