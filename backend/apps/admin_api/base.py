"""
Building blocks for the admin API's endpoints.

A section's API is a `StaffModelViewSet` subclass that sets `queryset`,
`serializer_class`, and optionally:

    search_fields   = ("name", "summary")          # ?q=kashmir
    ordering_fields = ("name", "price_from")       # ?ordering=-price_from
    filter_fields   = {"published": "is_published", "destination": "destination__slug"}
                                                   # ?published=true&destination=kerala

Every request needs an active staff account plus the matching Django model
permission. Creates, edits and deletes are written to the change history,
and responses use the global error shape (apps/core/exceptions.py).
"""

import json
from collections.abc import Iterable, Sequence
from typing import TYPE_CHECKING, Any

from django.db import models, transaction
from django.db.models import QuerySet
from rest_framework import filters, parsers, viewsets
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import ParseError
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from rest_framework_simplejwt.authentication import JWTAuthentication

from . import activity
from .permissions import IsStaff, StaffModelPermissions

if TYPE_CHECKING:
    from rest_framework.permissions import _PermissionClass

TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}


# ---------------------------------------------------------------------------
# Parsing: JSON, or JSON plus files
# ---------------------------------------------------------------------------


class JSONWithFilesParser(parsers.MultiPartParser):
    """
    multipart/form-data whose `data` field holds the JSON body, plus files.

    A file field's name is a dotted path into that JSON, so a form can send
    nested data and photos in one request:

        data            {"name": "Kerala", "scenes": [{"id": 3, "title": "..."}]}
        image           <file>        ->  body["image"]
        scenes.0.image  <file>        ->  body["scenes"][0]["image"]
    """

    def parse(self, stream, media_type=None, parser_context=None):
        result = super().parse(stream, media_type, parser_context)
        try:
            body: Any = json.loads(result.data.get("data") or "{}")
        except json.JSONDecodeError as exc:
            raise ParseError("The `data` field must be valid JSON.") from exc
        for path, upload in result.files.items():
            _set_path(body, path.split("."), upload)
        return parsers.DataAndFiles(body, {})


def _set_path(target: Any, parts: list[str], value: Any) -> None:
    for i, part in enumerate(parts):
        last = i == len(parts) - 1
        key: Any = int(part) if part.isdigit() else part
        if isinstance(target, list):
            while len(target) <= key:
                target.append({})
        if last:
            target[key] = value
            return
        nxt = target[key] if (isinstance(target, list) or key in target) else None
        if nxt is None:
            nxt = [] if parts[i + 1].isdigit() else {}
            target[key] = nxt
        target = nxt


# ---------------------------------------------------------------------------
# Filtering and pagination
# ---------------------------------------------------------------------------


class StaffPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "pageSize"
    max_page_size = 100


class SearchFilter(filters.SearchFilter):
    search_param = "q"


class DeclaredFilters(filters.BaseFilterBackend):
    """
    Exact-match filters declared on the view as {query param: ORM lookup}.
    "true"/"false" become booleans; "none" means "is null". Unknown params and
    blank values are ignored, so a stale link never errors.
    """

    def filter_queryset(self, request: Request, queryset: QuerySet, view: APIView) -> QuerySet:
        for param, lookup in getattr(view, "filter_fields", {}).items():
            raw = request.query_params.get(param, "").strip()
            if not raw:
                continue
            value: Any = raw
            if raw.lower() in TRUE_VALUES:
                value = True
            elif raw.lower() in FALSE_VALUES:
                value = False
            elif raw.lower() == "none":
                queryset = queryset.filter(**{f"{lookup}__isnull": True})
                continue
            queryset = queryset.filter(**{lookup: value})
        return queryset


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


class StaffAPIMixin:
    """Authentication and permissions shared by every admin endpoint."""

    # JWT only: browser session cookies never authenticate the admin API.
    authentication_classes: Sequence[type[BaseAuthentication]] = [JWTAuthentication]
    # String annotation: _PermissionClass exists only for type checkers, not at runtime.
    permission_classes: Sequence["_PermissionClass"] = [IsStaff]


class StaffModelViewSet(StaffAPIMixin, viewsets.ModelViewSet):
    permission_classes = [IsStaff, StaffModelPermissions]
    pagination_class = StaffPagination
    parser_classes = [parsers.JSONParser, JSONWithFilesParser]
    filter_backends = [SearchFilter, DeclaredFilters, filters.OrderingFilter]
    filter_fields: dict[str, str] = {}
    search_fields: tuple[str, ...] = ()
    ordering_fields: tuple[str, ...] = ()

    @transaction.atomic
    def perform_create(self, serializer: BaseSerializer) -> None:
        instance = serializer.save()
        activity.log_addition(self.request.user, instance)

    @transaction.atomic
    def perform_update(self, serializer: BaseSerializer) -> None:
        before = snapshot(serializer.instance, serializer.validated_data)
        instance = serializer.save()
        activity.log_change(self.request.user, instance, changed_fields(instance, before))

    @transaction.atomic
    def perform_destroy(self, instance: models.Model) -> None:
        activity.log_deletion(self.request.user, instance)
        instance.delete()


def snapshot(instance: Any, data: dict[str, Any]) -> dict[str, Any]:
    """Current values of the fields about to change (child lists compare by content)."""
    out: dict[str, Any] = {}
    for name in data:
        value: Any = getattr(instance, name, None)
        if hasattr(value, "all"):  # a related manager: compare the rows
            value = list(value.all().values())
        elif isinstance(value, models.fields.files.FieldFile):
            value = value.name
        out[name] = value
    return out


def changed_fields(instance: Any, before: dict[str, Any]) -> list[str]:
    after = snapshot(instance, before)
    return [name for name in before if after.get(name) != before.get(name)]


def sync_children(
    parent: models.Model,
    related_name: str,
    items: Iterable[dict[str, Any]],
    fields: Iterable[str],
    order_field: str = "position",
) -> None:
    """
    Make a parent's child rows match `items`, in order: rows with an `id` are
    updated, rows without one are created, and rows not listed are deleted.
    Positions follow the list order. A file field left out keeps its file.
    """
    manager = getattr(parent, related_name)
    existing = {obj.pk: obj for obj in manager.all()}
    keep: set[int] = set()
    fk_name = manager.field.name
    for index, item in enumerate(items):
        obj = existing.get(item.get("id")) if item.get("id") else None
        if obj is None:
            obj = manager.model(**{fk_name: parent})
        for name in fields:
            if name in item:
                setattr(obj, name, item[name])
        if order_field:
            setattr(obj, order_field, index)
        obj.full_clean(exclude=[fk_name])
        obj.save()
        keep.add(obj.pk)
    manager.exclude(pk__in=keep).delete()
