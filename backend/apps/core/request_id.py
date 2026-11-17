"""
A request ID for every request, so one visitor's error can be traced in the logs.

The ID comes from an incoming X-Request-ID header when a trusted proxy sets
one (TRUST_PROXY_HEADERS), otherwise it is generated. It is returned in the
X-Request-ID response header, included in every error body, and added to
every log line written while the request is handled.
"""

import logging
import re
import uuid
from collections.abc import Callable
from contextvars import ContextVar

from django.conf import settings
from django.http import HttpRequest, HttpResponse

HEADER = "X-Request-ID"
_SAFE_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")
_current: ContextVar[str] = ContextVar("request_id", default="-")


def get_request_id() -> str:
    return _current.get()


class RequestIDMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        incoming = request.headers.get(HEADER, "") if settings.TRUST_PROXY_HEADERS else ""
        request_id = incoming if _SAFE_ID.match(incoming) else uuid.uuid4().hex
        token = _current.set(request_id)
        request.request_id = request_id  # type: ignore[attr-defined]
        try:
            response = self.get_response(request)
        finally:
            _current.reset(token)
        response[HEADER] = request_id
        return response


class RequestIDLogFilter(logging.Filter):
    """Adds `request_id` to log records for the formatter."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        return True
