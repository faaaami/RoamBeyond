"""
Staff sign-in rules, independent of HTTP.

- Only active staff accounts may sign in.
- The identifier may be a username or an email address.
- After LOGIN_MAX_FAILURES wrong attempts an account is locked for
  LOGIN_LOCKOUT_MINUTES (counted in the cache, so it works across workers
  when CACHE_URL points at Redis). The per-IP throttle on the view limits
  guessing across many accounts.
- Error messages never reveal whether an account exists.
"""

import hashlib
import logging

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import update_last_login
from django.core.cache import cache
from django.http import HttpRequest
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.exceptions import ApiError

logger = logging.getLogger(__name__)

INVALID_CREDENTIALS = "Incorrect username or password."
LOCKED = "Too many failed attempts. Please wait {minutes} minutes, or ask an administrator."


def _key(identifier: str) -> str:
    digest = hashlib.sha256(identifier.strip().lower().encode()).hexdigest()[:32]
    return f"staff-login-failures:{digest}"


def is_locked(identifier: str) -> bool:
    return cache.get(_key(identifier), 0) >= settings.LOGIN_MAX_FAILURES


def record_failure(identifier: str) -> None:
    key = _key(identifier)
    timeout = settings.LOGIN_LOCKOUT_MINUTES * 60
    if cache.add(key, 1, timeout):
        return
    try:
        cache.incr(key)
    except ValueError:  # expired between add() and incr()
        cache.set(key, 1, timeout)


def clear_failures(identifier: str) -> None:
    cache.delete(_key(identifier))


def _username_for(identifier: str) -> str:
    """Map an email address to its username; anything else is a username already."""
    if "@" not in identifier:
        return identifier
    user_model = get_user_model()
    user = user_model._default_manager.filter(email__iexact=identifier, is_active=True).first()
    return user.get_username() if user else identifier


def sign_in(identifier: str, password: str, request: HttpRequest | None = None):
    """Return (user, refresh_token) or raise ApiError."""
    identifier = identifier.strip()
    if is_locked(identifier):
        logger.warning("Staff sign-in blocked: account locked (%s)", identifier[:3] + "***")
        raise ApiError(
            LOCKED.format(minutes=settings.LOGIN_LOCKOUT_MINUTES),
            code="account_locked",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    user = authenticate(request, username=_username_for(identifier), password=password)
    if user is None or not user.is_staff or not user.is_active:
        record_failure(identifier)
        logger.info("Staff sign-in failed (%s)", identifier[:3] + "***")
        raise ApiError(
            INVALID_CREDENTIALS,
            code="invalid_credentials",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    clear_failures(identifier)
    update_last_login(type(user), user)
    logger.info("Staff sign-in: user %s", user.pk)
    return user, issue_tokens(user)


def issue_tokens(user) -> RefreshToken:
    refresh = RefreshToken.for_user(user)
    # Display name only; permissions are always re-checked from the database.
    refresh["name"] = user.get_full_name() or user.get_username()
    return refresh
