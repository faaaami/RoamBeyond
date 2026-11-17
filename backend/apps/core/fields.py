"""
Model and form fields shared by the content apps.

`StringListField` stores a list of strings as JSON and is edited in the admin
as a textarea with one item per line, which is how editors think about lists
such as "Highlights" or "Known for".
"""

from typing import Any

from django import forms
from django.core.exceptions import ValidationError
from django.db import models


class LinesFormField(forms.CharField):
    """A textarea whose lines become a list. Blank lines are dropped."""

    widget = forms.Textarea(attrs={"rows": 5})

    def __init__(self, *, max_items: int | None = None, max_length_each: int | None = None, **kw):
        kw.pop("encoder", None)
        kw.pop("decoder", None)
        kw.pop("max_length", None)
        self.max_items = max_items
        self.max_length_each = max_length_each
        super().__init__(**kw)

    def prepare_value(self, value: Any) -> str:
        if isinstance(value, list | tuple):
            return "\n".join(str(v) for v in value)
        return "" if value is None else str(value)

    def to_python(self, value: Any) -> list[str]:  # type: ignore[override]
        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]
        text = super().to_python(value) or ""
        return [line.strip() for line in text.splitlines() if line.strip()]

    def validate(self, value: list[str]) -> None:
        if self.required and not value:
            raise ValidationError(self.error_messages["required"], code="required")
        if self.max_items is not None and len(value) > self.max_items:
            raise ValidationError(f"Keep this to {self.max_items} lines or fewer.")
        if self.max_length_each is not None:
            for line in value:
                if len(line) > self.max_length_each:
                    raise ValidationError(
                        f"Each line must be {self.max_length_each} characters or fewer."
                    )

    def has_changed(self, initial: Any, data: Any) -> bool:
        return self.to_python(initial) != self.to_python(data)


class StringListField(models.JSONField):
    """A list of strings, edited one per line."""

    def __init__(
        self,
        *args,
        max_items: int | None = None,
        max_length_each: int | None = None,
        **kwargs,
    ):
        self.max_items = max_items
        self.max_length_each = max_length_each
        kwargs.setdefault("default", list)
        kwargs.setdefault("blank", True)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        if self.max_items is not None:
            kwargs["max_items"] = self.max_items
        if self.max_length_each is not None:
            kwargs["max_length_each"] = self.max_length_each
        return name, path, args, kwargs

    def validate(self, value: Any, model_instance: models.Model | None) -> None:
        super().validate(value, model_instance)
        if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            raise ValidationError("Must be a list of text lines.")

    def formfield(self, **kwargs):
        defaults: dict[str, Any] = {
            "form_class": LinesFormField,
            "max_items": self.max_items,
            "max_length_each": self.max_length_each,
            "required": not self.blank,
        }
        defaults.update(kwargs)
        return super().formfield(**defaults)


class MultipleChoiceListField(models.JSONField):
    """A list of choice values (for example trip types), edited as checkboxes."""

    def __init__(self, *args, choices_list: list[tuple[str, str]] | None = None, **kwargs):
        self.choices_list = list(choices_list or [])
        kwargs.setdefault("default", list)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs["choices_list"] = self.choices_list
        return name, path, args, kwargs

    def validate(self, value: Any, model_instance: models.Model | None) -> None:
        super().validate(value, model_instance)
        allowed = {key for key, _ in self.choices_list}
        if not isinstance(value, list) or not set(value) <= allowed:
            raise ValidationError("Choose from the listed options.")
        if not self.blank and not value:
            raise ValidationError("Choose at least one option.")

    def formfield(self, **kwargs):
        return forms.TypedMultipleChoiceField(
            choices=self.choices_list,
            widget=forms.CheckboxSelectMultiple,
            required=not self.blank,
            label=kwargs.get("label") or self.verbose_name.capitalize(),
            help_text=self.help_text,
        )
