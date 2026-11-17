import io

from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

import pytest
from PIL import Image
from rest_framework_simplejwt.tokens import RefreshToken


def grant(user, *codenames: str) -> None:
    """grant(user, "enquiries.view_enquiry", ...) then clear Django's permission cache."""
    for codename in codenames:
        app_label, name = codename.split(".")
        user.user_permissions.add(
            Permission.objects.get(content_type__app_label=app_label, codename=name)
        )
    for cache in ("_perm_cache", "_user_perm_cache"):
        if hasattr(user, cache):
            delattr(user, cache)


def api_for(user) -> APIClient:
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return client


def png(name: str = "photo.png") -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", (4, 3), "teal").save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


@pytest.fixture
def superuser(django_user_model):
    return django_user_model.objects.create_superuser(
        "boss", "boss@example.com", "pw", first_name="Boss"
    )


@pytest.fixture
def boss_api(superuser) -> APIClient:
    return api_for(superuser)


@pytest.fixture
def agent(django_user_model):
    """A sales agent: staff who may see and work enquiries only."""
    user = django_user_model.objects.create_user("agent", "agent@example.com", "pw", is_staff=True)
    grant(user, "enquiries.view_enquiry", "enquiries.change_enquiry")
    return user
