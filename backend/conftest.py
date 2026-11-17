from django.core.cache import cache
from rest_framework.test import APIClient

import pytest


@pytest.fixture(autouse=True)
def _clear_cache():
    """Throttle counters live in the cache; start every test clean."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()
