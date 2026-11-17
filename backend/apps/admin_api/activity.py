"""
Write and read the admin panel's change history (models.ActivityLog).

The activity feed on the dashboard home merges these edits with incoming
enquiries from the website.
"""

from collections.abc import Iterable
from typing import Any

from django.db import models

from apps.enquiries.models import Enquiry

from .models import ActivityLog
from .sections import section_for_model


def _field_labels(model: type[models.Model], names: Iterable[str]) -> list[str]:
    labels = []
    for name in names:
        try:
            field = model._meta.get_field(name)
        except Exception:
            labels.append(name.replace("_", " "))
            continue
        labels.append(str(getattr(field, "verbose_name", name)))
    return labels


def _record(user, obj: models.Model, action: str, fields: Iterable[str] = ()) -> ActivityLog:
    return ActivityLog.objects.create(
        user=user if getattr(user, "pk", None) else None,
        user_name=(user.get_full_name() or user.get_username()) if user else "System",
        action=action,
        model_label=obj._meta.label,
        object_id=str(obj.pk),
        object_repr=str(obj)[:200],
        changed_fields=_field_labels(type(obj), fields),
    )


def log_addition(user, obj: models.Model) -> ActivityLog:
    return _record(user, obj, ActivityLog.Action.ADDED)


def log_change(user, obj: models.Model, changed_fields: Iterable[str]) -> ActivityLog:
    return _record(user, obj, ActivityLog.Action.CHANGED, changed_fields)


def log_deletion(user, obj: models.Model) -> ActivityLog:
    """Call before deleting, while the object still has its primary key."""
    return _record(user, obj, ActivityLog.Action.DELETED)


def _link(entry: ActivityLog, enquiry_refs: dict[str, Any]) -> str | None:
    from django.apps import apps

    if entry.action == ActivityLog.Action.DELETED:
        return None
    try:
        model = apps.get_model(entry.model_label)
    except LookupError:
        return None
    section = section_for_model(model)
    if section is None:
        return None
    object_id: Any = entry.object_id
    if model is Enquiry:  # enquiry pages are addressed by reference
        object_id = enquiry_refs.get(entry.object_id)
        if object_id is None:
            return None
    return section.path(object_id)


def _section_title(label: str) -> str:
    from django.apps import apps

    try:
        model = apps.get_model(label)
    except LookupError:
        return ""
    section = section_for_model(model)
    return section.title if section else str(model._meta.verbose_name).title()


def serialize_entry(entry: ActivityLog, enquiry_refs: dict[str, Any]) -> dict[str, Any]:
    return {
        "kind": "edit",
        "action": entry.action,
        "who": entry.user_name,
        "what": entry.object_repr,
        "section": _section_title(entry.model_label),
        "detail": entry.summary,
        "link": _link(entry, enquiry_refs),
        "at": entry.created_at,
    }


def enquiry_refs_for(entries: Iterable[ActivityLog]) -> dict[str, Any]:
    ids = [e.object_id for e in entries if e.model_label == Enquiry._meta.label]
    return {
        str(pk): ref
        for pk, ref in Enquiry.objects.filter(pk__in=ids).values_list("pk", "reference")
    }


def recent_activity(limit: int = 15) -> list[dict[str, Any]]:
    """Staff edits and incoming enquiries, newest first."""
    entries = list(ActivityLog.objects.order_by("-created_at")[:limit])
    refs = enquiry_refs_for(entries)
    events = [serialize_entry(e, refs) for e in entries]

    for enquiry in Enquiry.objects.order_by("-created_at")[:limit]:
        events.append(
            {
                "kind": "enquiry",
                "action": "received",
                "who": enquiry.name,
                "what": enquiry.package_name or enquiry.destination or enquiry.get_kind_display(),
                "section": "Enquiries",
                "detail": enquiry.get_kind_display(),
                "link": f"/admin/enquiries/{enquiry.reference}",
                "at": enquiry.created_at,
            }
        )

    events.sort(key=lambda e: e["at"], reverse=True)
    return events[:limit]
