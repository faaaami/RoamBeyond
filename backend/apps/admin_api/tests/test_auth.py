from datetime import timedelta
from unittest import mock

from django.urls import reverse

import pytest
from rest_framework_simplejwt.tokens import AccessToken

from apps.admin_api.views.auth import LoginThrottle

pytestmark = pytest.mark.django_db

LOGIN = reverse("admin_api:login")
REFRESH = reverse("admin_api:refresh")
LOGOUT = reverse("admin_api:logout")
ME = reverse("admin_api:me")


@pytest.fixture
def staff(django_user_model):
    return django_user_model.objects.create_user(
        "asha", "asha@example.com", "correct-horse", is_staff=True, first_name="Asha"
    )


@pytest.fixture(autouse=True)
def _generous_ip_throttle(monkeypatch):
    # These tests exercise the per-account lockout; keep the per-IP limit out of the way.
    monkeypatch.setattr(LoginThrottle, "THROTTLE_RATES", {"login": "100/m"})


def login(client, username="asha", password="correct-horse"):
    return client.post(LOGIN, {"username": username, "password": password})


def test_login_with_username_or_email_returns_tokens_and_user(api_client, staff):
    for identifier in ("asha", "ASHA@example.com"):
        res = login(api_client, identifier)
        assert res.status_code == 200, res.data
        assert {"access", "refresh", "user"} <= set(res.data)
        assert res.data["user"]["name"] == "Asha"
        assert AccessToken(res.data["access"])["user_id"] == str(staff.pk)


def test_wrong_password_and_unknown_user_look_the_same(api_client, staff):
    wrong = login(api_client, password="nope")
    unknown = login(api_client, username="nobody")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.data["error"] == unknown.data["error"] == "Incorrect username or password."
    assert wrong.data["code"] == "invalid_credentials"


def test_non_staff_cannot_sign_in(api_client, django_user_model):
    django_user_model.objects.create_user("visitor", password="correct-horse")
    assert login(api_client, "visitor").status_code == 401


def test_account_locks_after_repeated_failures(api_client, staff, settings):
    settings.LOGIN_MAX_FAILURES = 3
    for _ in range(3):
        assert login(api_client, password="nope").status_code == 401

    locked = login(api_client)  # even the right password is refused while locked
    assert locked.status_code == 429
    assert locked.data["code"] == "account_locked"


def test_ip_throttle(api_client, staff, monkeypatch):
    monkeypatch.setattr(LoginThrottle, "THROTTLE_RATES", {"login": "2/m"})
    login(api_client, password="nope")
    login(api_client, password="nope")
    res = login(api_client)
    assert res.status_code == 429
    assert res.data["code"] == "throttled"


def test_blank_fields_use_the_validation_shape(api_client):
    res = api_client.post(LOGIN, {"username": "", "password": ""})
    assert res.status_code == 400
    assert {f["path"] for f in res.data["fields"]} == {"username", "password"}


def test_refresh_rotates_and_old_token_is_rejected(api_client, staff):
    tokens = login(api_client).data

    first = api_client.post(REFRESH, {"refresh": tokens["refresh"]})
    assert first.status_code == 200
    assert first.data["refresh"] != tokens["refresh"]

    replay = api_client.post(REFRESH, {"refresh": tokens["refresh"]})
    assert replay.status_code == 401
    assert replay.data["code"] == "token_not_valid"


def test_refresh_refused_once_staff_access_is_removed(api_client, staff):
    tokens = login(api_client).data
    staff.is_staff = False
    staff.save()
    assert api_client.post(REFRESH, {"refresh": tokens["refresh"]}).status_code == 401


def test_logout_blacklists_refresh_token(api_client, staff):
    tokens = login(api_client).data
    assert api_client.post(LOGOUT, {"refresh": tokens["refresh"]}).status_code == 204
    assert api_client.post(REFRESH, {"refresh": tokens["refresh"]}).status_code == 401
    # Logging out twice is harmless.
    assert api_client.post(LOGOUT, {"refresh": tokens["refresh"]}).status_code == 204


def test_me_requires_a_valid_access_token(api_client, staff):
    anonymous = api_client.get(ME)
    assert anonymous.status_code == 401
    assert anonymous.data["code"] == "not_authenticated"

    garbage = api_client.get(ME, HTTP_AUTHORIZATION="Bearer not-a-token")
    assert garbage.status_code == 401
    assert garbage.data["code"] == "token_not_valid"

    access = login(api_client).data["access"]
    me = api_client.get(ME, HTTP_AUTHORIZATION=f"Bearer {access}")
    assert me.status_code == 200
    assert me.data["username"] == "asha"


def test_expired_access_token_says_session_expired(api_client, staff):
    token = AccessToken.for_user(staff)
    token.set_exp(lifetime=-timedelta(minutes=1))
    res = api_client.get(ME, HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res.status_code == 401
    assert res.data["error"] == "Your session has expired. Please sign in again."


def test_session_cookie_does_not_authenticate_staff_api(client, staff):
    """JWT only: a logged-in admin browser session cannot call the staff API (no CSRF risk)."""
    client.force_login(staff)
    assert client.get(ME).status_code == 401


def test_last_login_is_recorded(api_client, staff):
    assert staff.last_login is None
    login(api_client)
    staff.refresh_from_db()
    assert staff.last_login is not None


def test_login_never_logs_the_password(api_client, staff, caplog):
    with mock.patch("apps.admin_api.auth.logger") as log:
        login(api_client, password="super-secret-pw")
    assert "super-secret-pw" not in str(log.mock_calls)
