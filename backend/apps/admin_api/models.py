"""
Change history for the admin panel.

Replaces Django's admin LogEntry (django.contrib.admin is not installed). One
row per create, edit or delete made through /api/admin/. The user's name and
the object's label are copied in, so the history still reads correctly after
the user or the record is deleted.
"""

from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    class Action(models.TextChoices):
        ADDED = "added", "Added"
        CHANGED = "changed", "Changed"
        DELETED = "deleted", "Deleted"

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    user_name = models.CharField(max_length=150)
    action = models.CharField(max_length=10, choices=Action.choices)
    model_label = models.CharField(max_length=100, help_text='e.g. "catalog.TourPackage"')
    object_id = models.CharField(max_length=64)
    object_repr = models.CharField(max_length=200)
    changed_fields = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["model_label", "object_id"], name="activity_object")]

    def __str__(self) -> str:
        return f"{self.user_name} {self.action} {self.object_repr}"

    @property
    def summary(self) -> str:
        """'Changed price, overview.' in the style of Django's admin history."""
        if self.action == self.Action.CHANGED and self.changed_fields:
            return f"Changed {', '.join(self.changed_fields)}."
        return f"{self.get_action_display()}."
