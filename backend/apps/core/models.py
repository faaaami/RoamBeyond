from typing import Self

from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base that records when a row was created and last changed."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SingletonModel(TimeStampedModel):
    """
    A model with exactly one row, such as site settings or a page's text.

    The row always has primary key 1. Use `load()` to read it; it is created
    with the field defaults the first time.
    """

    SINGLETON_PK = 1

    class Meta:
        abstract = True

    def save(self, *args, **kwargs) -> None:
        self.pk = self.SINGLETON_PK
        if self._state.adding:
            # A fresh instance replaces the existing row; keep its creation time.
            created = (
                type(self)
                ._default_manager.filter(pk=self.pk)
                .values_list("created_at", flat=True)
                .first()
            )
            if created is not None:
                self.created_at = created
                self._state.adding = False
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise NotImplementedError(f"{type(self).__name__} is a singleton and cannot be deleted.")

    @classmethod
    def load(cls) -> Self:
        obj, _ = cls._default_manager.get_or_create(pk=cls.SINGLETON_PK)
        return obj


class Orderable(models.Model):
    """Rows the admin sorts by hand. Lower numbers come first."""

    sort_order = models.PositiveIntegerField(
        "sort order", default=100, help_text="Lower numbers are shown first."
    )

    class Meta:
        abstract = True
