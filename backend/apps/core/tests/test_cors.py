"""The website may call the API from its own origin only."""

from django.test import Client

import pytest

pytestmark = pytest.mark.django_db


@pytest.fixture
def allowed(settings):
    settings.CORS_ALLOWED_ORIGINS = ["https://www.example.com"]
    return "https://www.example.com"


def test_preflight_from_allowed_origin_is_answered(allowed):
    res = Client().options(
        "/api/v1/navigation/",
        HTTP_ORIGIN=allowed,
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
    )
    assert res["Access-Control-Allow-Origin"] == allowed


def test_foreign_origin_gets_no_allow_header(allowed):
    res = Client().options(
        "/api/v1/navigation/",
        HTTP_ORIGIN="https://evil.example",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
    )
    assert "Access-Control-Allow-Origin" not in res
