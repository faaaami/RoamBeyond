import json
from unittest import mock

import pytest

from apps.catalog.tests.factories import make_destination
from apps.core import revalidation

pytestmark = pytest.mark.django_db


@pytest.fixture
def frontend(settings):
    settings.FRONTEND_REVALIDATE_URL = "http://site.test/api/revalidate"
    settings.FRONTEND_REVALIDATE_SECRET = "s3cret"
    with mock.patch("urllib.request.urlopen") as urlopen:
        urlopen.return_value.__enter__.return_value = mock.Mock()
        yield urlopen


def test_one_call_per_transaction_however_many_rows(frontend, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        destination = make_destination()
        destination.tagline = "Changed"
        destination.save()

    assert frontend.call_count == 1
    request = frontend.call_args.args[0]
    assert request.full_url == "http://site.test/api/revalidate"
    assert request.get_header("Authorization") == "Bearer s3cret"
    assert json.loads(request.data) == {"tags": ["content"]}


def test_failure_is_logged_not_raised(frontend, caplog):
    frontend.side_effect = OSError("connection refused")
    assert revalidation.send_revalidation() is False
    assert "Could not ask the website" in caplog.text


def test_disabled_without_url(settings, django_capture_on_commit_callbacks):
    settings.FRONTEND_REVALIDATE_URL = ""
    with (
        mock.patch("urllib.request.urlopen") as urlopen,
        django_capture_on_commit_callbacks(execute=True) as callbacks,
    ):
        make_destination()
    assert callbacks == []
    urlopen.assert_not_called()
