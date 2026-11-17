from rest_framework.exceptions import ErrorDetail

from apps.core.exceptions import _flatten


def test_flatten_nested_errors():
    detail = {
        "mobile": [ErrorDetail("bad", code="invalid")],
        "non_field_errors": [ErrorDetail("conflict", code="invalid")],
        "travellers": {"adults": [ErrorDetail("min", code="min_value")]},
        "days": [{}, {"title": [ErrorDetail("required", code="required")]}],
    }

    assert list(_flatten(detail)) == [
        ("mobile", "bad"),
        ("", "conflict"),
        ("travellers.adults", "min"),
        ("days.1.title", "required"),
    ]
