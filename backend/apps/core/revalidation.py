"""
Tells the Next.js site to refresh its cached content after an edit.

The site caches everything it reads from the content API under one cache tag.
When an editor saves anything in the admin, `request_revalidation()` queues a
call to the site's /api/revalidate route; the call is sent once, after the
database transaction commits, however many rows the save touched (a package
and its itinerary days are one admin save).

Failures are logged and never block the save: the site also refreshes on its
own after the cache lifetime set in src/lib/content.ts.
"""

import json
import logging
import threading
import urllib.error
import urllib.request

from django.conf import settings
from django.db import transaction

logger = logging.getLogger(__name__)

CONTENT_TAG = "content"

_state = threading.local()


def request_revalidation() -> None:
    """Queue one revalidation call for when the current transaction commits."""
    if not settings.FRONTEND_REVALIDATE_URL:
        return
    if getattr(_state, "queued", False):
        return
    _state.queued = True
    transaction.on_commit(_send)


def _send() -> None:
    _state.queued = False
    send_revalidation()


def send_revalidation() -> bool:
    """POST to the frontend now. Returns True if the site accepted it."""
    url = settings.FRONTEND_REVALIDATE_URL
    if not url:
        return False
    request = urllib.request.Request(
        url,
        data=json.dumps({"tags": [CONTENT_TAG]}).encode(),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.FRONTEND_REVALIDATE_SECRET}",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=settings.FRONTEND_REVALIDATE_TIMEOUT):
            return True
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        logger.warning("Could not ask the website to refresh its content: %s", exc)
        return False
