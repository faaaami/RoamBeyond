"""The global error handling: one JSON shape for every failure."""

from unittest import mock

from django.db import OperationalError
from django.test import Client, override_settings
from django.urls import reverse

import pytest

pytestmark = pytest.mark.django_db

PACKAGES = reverse("v1:catalog:package-list")


def test_unhandled_exception_is_a_logged_generic_500(api_client, caplog):
    with mock.patch(
        "apps.catalog.views.selectors.published_packages", side_effect=RuntimeError("secret detail")
    ):
        res = api_client.get(PACKAGES)

    assert res.status_code == 500
    body = res.json()
    assert body["code"] == "server_error"
    assert body["error"] == "Something went wrong on our side. Please try again in a moment."
    assert "secret detail" not in res.content.decode()  # internals never leak
    assert body["requestId"] == res.headers["X-Request-ID"]
    assert "Unhandled exception in PackageListView" in caplog.text
    assert "secret detail" in caplog.text  # ...but they are in the log


def test_database_outage_is_503(api_client):
    with mock.patch(
        "apps.catalog.views.selectors.published_packages", side_effect=OperationalError("down")
    ):
        res = api_client.get(PACKAGES)
    assert res.status_code == 503
    assert res.json()["code"] == "service_unavailable"


def test_method_not_allowed_has_the_shape(api_client):
    res = api_client.delete(PACKAGES)
    assert res.status_code == 405
    assert set(res.json()) == {"error", "code", "requestId"}
    assert res.json()["code"] == "method_not_allowed"


def test_unknown_api_url_is_json_404():
    res = Client().get("/api/v1/does-not-exist/")
    assert res.status_code == 404
    assert res["Content-Type"] == "application/json"
    assert res.json()["code"] == "not_found"


def test_unknown_non_api_url_stays_html():
    res = Client().get("/not-an-api-page/")
    assert res.status_code == 404
    assert "application/json" not in res["Content-Type"]


def test_request_id_header_on_every_response(api_client):
    res = api_client.get(PACKAGES)
    assert len(res.headers["X-Request-ID"]) == 32


@override_settings(TRUST_PROXY_HEADERS=True)
def test_trusted_proxy_request_id_is_reused_if_safe(api_client):
    assert api_client.get(PACKAGES, HTTP_X_REQUEST_ID="lb-1234abcd").headers["X-Request-ID"] == (
        "lb-1234abcd"
    )
    # Anything that could inject into logs is replaced.
    injected = api_client.get(PACKAGES, HTTP_X_REQUEST_ID="bad\nid").headers["X-Request-ID"]
    assert injected != "bad\nid"


def test_untrusted_request_id_is_ignored(api_client):
    assert (
        api_client.get(PACKAGES, HTTP_X_REQUEST_ID="spoofed-id-123").headers["X-Request-ID"]
        != "spoofed-id-123"
    )
