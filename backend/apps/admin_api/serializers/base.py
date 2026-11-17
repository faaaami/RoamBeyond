"""
Shared serializer pieces for the admin API.

The API speaks camelCase JSON (like the public API) while models use
snake_case. `CamelCaseMixin` converts both ways, recursively, including the
field paths in validation errors, so serializers can declare plain model
field names.
"""

import re
from typing import Any

from django.db import models
from rest_framework import serializers
from rest_framework.utils.serializer_helpers import ReturnDict

from apps.core.media import media_url

_CAMEL_BOUNDARY = re.compile(r"_([a-z0-9])")
_SNAKE_BOUNDARY = re.compile(r"([a-z0-9])([A-Z])")


def to_camel(name: str) -> str:
    return _CAMEL_BOUNDARY.sub(lambda m: m.group(1).upper(), name)


def to_snake(name: str) -> str:
    return _SNAKE_BOUNDARY.sub(r"\1_\2", name).lower()


def camelize(value: Any) -> Any:
    if isinstance(value, dict):
        return {to_camel(str(k)): camelize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [camelize(v) for v in value]
    return value


def decamelize(value: Any) -> Any:
    if isinstance(value, dict):
        return {to_snake(str(k)): decamelize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [decamelize(v) for v in value]
    return value


class CamelCaseMixin:
    """Put on the outermost serializer only; nested ones are converted with it."""

    def to_internal_value(self, data: Any) -> Any:
        return super().to_internal_value(decamelize(dict(data)))  # type: ignore[misc]

    def to_representation(self, instance: Any) -> Any:
        return camelize(super().to_representation(instance))  # type: ignore[misc]

    @property
    def errors(self) -> Any:
        errors = super().errors  # type: ignore[misc]
        return ReturnDict(camelize(dict(errors)), serializer=self)  # type: ignore[call-overload]


MAX_PHOTO_BYTES = 8 * 1024 * 1024
# Refuse huge images before decoding them (a "decompression bomb" can fill memory).
MAX_PHOTO_PIXELS = 40_000_000


class MediaField(serializers.ImageField):
    """
    An image: absolute URL out, uploaded file in. To keep the current image,
    leave the field out of the request; send null to remove an optional one.
    """

    default_error_messages = {
        **serializers.ImageField.default_error_messages,
        "null": "Choose a photo.",
        "too_large": "Photos must be 8 MB or smaller.",
        "too_many_pixels": "This photo is too large. Use one under 40 megapixels.",
    }

    def to_internal_value(self, data: Any) -> Any:
        upload = super().to_internal_value(data)
        if upload.size > MAX_PHOTO_BYTES:
            self.fail("too_large")
        width, height = _image_size(upload)
        if width * height > MAX_PHOTO_PIXELS:
            self.fail("too_many_pixels")
        return upload

    def to_representation(self, value: Any) -> str:
        return media_url(value, self.context.get("request")) if value else ""


class ChildSerializer(serializers.ModelSerializer):
    """A row in an ordered child list (itinerary day, section...). `id` identifies existing rows."""

    id = serializers.IntegerField(required=False)


def label(obj: models.Model, field: str) -> str:
    """Display value of a choice field, e.g. label(pkg, "category") -> "Hills and valleys"."""
    return str(getattr(obj, f"get_{field}_display")())


def _image_size(upload: Any) -> tuple[int, int]:
    """Width and height read from the file header only, without decoding the image."""
    from PIL import Image

    upload.seek(0)
    try:
        with Image.open(upload) as image:
            size = image.size
    finally:
        upload.seek(0)
    return size
