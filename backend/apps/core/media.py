from django.conf import settings
from django.db.models.fields.files import FieldFile
from rest_framework.request import Request


def media_url(file: FieldFile | None, request: Request | None) -> str:
    """
    Absolute URL for an uploaded file, or "" when there is none.

    Object storage (S3, R2) already returns absolute URLs. Local storage returns
    a path, which is made absolute with PUBLIC_MEDIA_BASE_URL if set, otherwise
    with the host of the incoming request.
    """
    if not file:
        return ""
    url = file.url
    if url.startswith(("http://", "https://")):
        return url
    if settings.PUBLIC_MEDIA_BASE_URL:
        return f"{settings.PUBLIC_MEDIA_BASE_URL.rstrip('/')}{url}"
    return request.build_absolute_uri(url) if request else url
