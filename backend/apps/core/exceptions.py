"""
Global error handling: every error the API returns has one shape.

    {
      "error": "<message safe to show to visitors>",
      "code": "<stable machine-readable code>",
      "requestId": "<matches the X-Request-ID header and the server logs>",
      "fields": [{"path": "mobile", "message": "..."}]   # validation errors only
    }

Three layers produce it:

1. `exception_handler` (DRF's EXCEPTION_HANDLER) for errors raised in API views,
   including unexpected exceptions, which are logged with their traceback and
   returned as a generic 500 so internals never leak.
2. `api_error_view` for Django's own 400/403/404/500 handlers, so a bad URL
   under /api/ also answers in JSON rather than an HTML page.
3. `ApiError` for code that wants to fail with a specific status and code.
"""

import logging
from collections.abc import Iterator
from typing import Any

from django.core.exceptions import PermissionDenied
from django.db import DatabaseError
from django.http import Http404, HttpRequest, HttpResponse, JsonResponse
from django.views.defaults import bad_request, page_not_found, permission_denied, server_error
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .request_id import get_request_id

logger = logging.getLogger(__name__)

VALIDATION_MESSAGE = "Please check the form and try again."
THROTTLED_MESSAGE = "Too many requests. Please try again in a few minutes, or call us."
SERVER_ERROR_MESSAGE = "Something went wrong on our side. Please try again in a moment."
UNAVAILABLE_MESSAGE = "The service is temporarily unavailable. Please try again shortly."
NOT_FOUND_MESSAGE = "Not found."
FORBIDDEN_MESSAGE = "You do not have permission to do that."
NOT_AUTHENTICATED_MESSAGE = "Please sign in to continue."
SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again."


class ApiError(APIException):
    """Raise from services or views to fail with a chosen status, message and code."""

    def __init__(self, message: str, *, code: str = "error", status_code: int = 400):
        self.status_code = status_code
        super().__init__(detail=message, code=code)


def error_body(message: str, code: str, **extra: Any) -> dict[str, Any]:
    return {"error": message, "code": code, "requestId": get_request_id(), **extra}


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = drf_exception_handler(exc, context)

    if response is None:
        # Not an API exception: a bug or an outage. Log it in full, answer generically.
        if isinstance(exc, DatabaseError):
            logger.exception("Database error in %s", _view_name(context))
            return Response(
                error_body(UNAVAILABLE_MESSAGE, "service_unavailable"),
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        logger.exception("Unhandled exception in %s", _view_name(context))
        return Response(
            error_body(SERVER_ERROR_MESSAGE, "server_error"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, ValidationError):
        response.data = error_body(
            VALIDATION_MESSAGE,
            "invalid",
            fields=[{"path": path, "message": msg} for path, msg in _flatten(exc.detail)],
        )
    elif isinstance(exc, Throttled):
        wait = getattr(exc, "wait", None)  # seconds until the client may retry
        response.data = error_body(THROTTLED_MESSAGE, "throttled", retryAfter=wait)
    elif isinstance(exc, NotAuthenticated):
        response.data = error_body(NOT_AUTHENTICATED_MESSAGE, "not_authenticated")
    elif isinstance(exc, AuthenticationFailed) and _is_token_error(exc):
        # SimpleJWT's InvalidToken: expired or tampered access/refresh token.
        response.data = error_body(SESSION_EXPIRED_MESSAGE, "token_not_valid")
    elif isinstance(exc, APIException):
        response.data = error_body(_message(exc), _code(exc))
    elif isinstance(exc, Http404):
        response.data = error_body(NOT_FOUND_MESSAGE, "not_found")
    elif isinstance(exc, PermissionDenied):
        response.data = error_body(FORBIDDEN_MESSAGE, "permission_denied")

    if response.status_code >= 500:
        logger.error("API error %s in %s: %s", response.status_code, _view_name(context), exc)
    return response


# ---------------------------------------------------------------------------
# Django-level handlers (config/urls.py): JSON under /api/, HTML elsewhere
# ---------------------------------------------------------------------------


def _wants_json(request: HttpRequest) -> bool:
    return request.path.startswith("/api/") or "application/json" in request.headers.get(
        "Accept", ""
    )


def api_error_view(status_code: int, message: str, code: str, html_view):
    def view(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
        if not _wants_json(request):
            return html_view(request) if exception is None else html_view(request, exception)
        return JsonResponse(error_body(message, code), status=status_code)

    return view


handler400 = api_error_view(400, "Bad request.", "bad_request", bad_request)
handler403 = api_error_view(403, FORBIDDEN_MESSAGE, "permission_denied", permission_denied)
handler404 = api_error_view(404, NOT_FOUND_MESSAGE, "not_found", page_not_found)
handler500 = api_error_view(500, SERVER_ERROR_MESSAGE, "server_error", server_error)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _view_name(context: dict[str, Any]) -> str:
    view = context.get("view")
    return type(view).__name__ if view is not None else "unknown view"


def _message(exc: APIException) -> str:
    detail: Any = exc.detail
    if isinstance(detail, dict):
        detail = detail.get("detail", next(iter(detail.values()), ""))
    if isinstance(detail, list):
        detail = detail[0] if detail else ""
    return str(detail) or "Request failed."


def _code(exc: APIException) -> str:
    codes: Any = exc.get_codes()
    if isinstance(codes, dict):
        codes = codes.get("detail", next(iter(codes.values()), exc.default_code))
    if isinstance(codes, list):
        codes = codes[0] if codes else exc.default_code
    return str(codes)


def _is_token_error(exc: AuthenticationFailed) -> bool:
    return _code(exc) in {"token_not_valid", "user_not_found", "user_inactive"}


def _flatten(detail: Any, path: str = "") -> Iterator[tuple[str, str]]:
    """Walk DRF's nested error structure and yield dotted paths with messages."""
    if isinstance(detail, dict):
        for key, value in detail.items():
            key = "" if key == "non_field_errors" else str(key)
            yield from _flatten(value, _join(path, key))
    elif isinstance(detail, list):
        for index, value in enumerate(detail):
            # A list of messages belongs to `path`; a list of dicts is a nested list field.
            yield from _flatten(value, path if isinstance(value, str) else _join(path, str(index)))
    else:
        yield path, str(detail)


def _join(parent: str, child: str) -> str:
    return f"{parent}.{child}" if parent and child else parent or child
