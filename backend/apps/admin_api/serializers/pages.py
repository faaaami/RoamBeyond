from typing import Any

from django.db import transaction
from rest_framework import serializers

from drf_spectacular.utils import extend_schema_serializer

from apps.catalog.models import Destination
from apps.pages.models import (
    AboutFact,
    AboutPage,
    AboutValue,
    HomePage,
    HomeStep,
    LegalPage,
    LegalSection,
    NavLink,
    OtherPages,
    PageSeo,
    SiteSettings,
    StoryScene,
    TripTypeInfo,
)

from ..base import sync_children
from .base import CamelCaseMixin, ChildSerializer, MediaField

LINES = serializers.ListField(child=serializers.CharField(max_length=500), required=False)


def _page_fields(model, exclude: tuple[str, ...] = ()) -> tuple[str, ...]:
    """Every editable column of a page singleton, in model order."""
    skip = {"id", "created_at", "updated_at", *exclude}
    return tuple(f.name for f in model._meta.concrete_fields if f.name not in skip)


class NestedPageSerializer(CamelCaseMixin, serializers.ModelSerializer):
    """A page whose child lists (`children`: name -> fields) are saved with it."""

    children: dict[str, tuple[str, ...]] = {}

    @transaction.atomic
    def update(self, instance: Any, validated: dict[str, Any]) -> Any:
        lists = {name: validated.pop(name) for name in list(self.children) if name in validated}
        page = super().update(instance, validated)
        for name, items in lists.items():
            sync_children(page, name, items, self.children[name])
        return page


# ---------------------------------------------------------------------------
# Site settings and other pages: plain fields
# ---------------------------------------------------------------------------


class SiteSettingsSerializer(CamelCaseMixin, serializers.ModelSerializer):
    cancellation_terms = LINES

    class Meta:
        model = SiteSettings
        fields = (*_page_fields(SiteSettings), "updated_at")
        read_only_fields = ("updated_at",)


class OtherPagesSerializer(CamelCaseMixin, serializers.ModelSerializer):
    plan_next_steps = LINES

    class Meta:
        model = OtherPages
        fields = (*_page_fields(OtherPages), "updated_at")
        read_only_fields = ("updated_at",)


# ---------------------------------------------------------------------------
# Home page: steps and scroll story scenes
# ---------------------------------------------------------------------------


class HomeStepSerializer(ChildSerializer):
    class Meta:
        model = HomeStep
        fields = ("id", "title", "text")


class StorySceneSerializer(ChildSerializer):
    destination = serializers.PrimaryKeyRelatedField(queryset=Destination.objects.all())
    destination_name = serializers.CharField(source="destination.name", read_only=True)
    image = MediaField(required=False, allow_null=True)

    class Meta:
        model = StoryScene
        fields = (
            "id",
            "destination",
            "destination_name",
            "label",
            "title",
            "text",
            "image",
            "image_link",
        )


class HomePageSerializer(NestedPageSerializer):
    marquee = LINES
    steps = HomeStepSerializer(many=True, required=False)
    scenes = StorySceneSerializer(many=True, required=False)
    children = {
        "steps": ("title", "text"),
        "scenes": ("destination", "label", "title", "text", "image", "image_link"),
    }

    class Meta:
        model = HomePage
        fields = (*_page_fields(HomePage), "steps", "scenes", "updated_at")
        read_only_fields = ("updated_at",)


# ---------------------------------------------------------------------------
# About page: facts, values, two photos
# ---------------------------------------------------------------------------


class AboutFactSerializer(ChildSerializer):
    class Meta:
        model = AboutFact
        fields = ("id", "label", "value")


class AboutValueSerializer(ChildSerializer):
    class Meta:
        model = AboutValue
        fields = ("id", "title", "text")


class AboutPageSerializer(NestedPageSerializer):
    team_photo = MediaField(required=False, allow_null=True)
    office_photo = MediaField(required=False, allow_null=True)
    facts = AboutFactSerializer(many=True, required=False)
    values = AboutValueSerializer(many=True, required=False)
    children = {"facts": ("label", "value"), "values": ("title", "text")}

    class Meta:
        model = AboutPage
        fields = (*_page_fields(AboutPage), "facts", "values", "updated_at")
        read_only_fields = ("updated_at",)


# ---------------------------------------------------------------------------
# Legal pages
# ---------------------------------------------------------------------------


class LegalSectionSerializer(ChildSerializer):
    class Meta:
        model = LegalSection
        fields = ("id", "heading", "body")


class LegalPageSerializer(NestedPageSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)
    sections = LegalSectionSerializer(many=True, required=False)
    children = {"sections": ("heading", "body")}

    class Meta:
        model = LegalPage
        fields = (
            "id",
            "kind",
            "kind_label",
            "title",
            "intro",
            "last_updated",
            "hide_template_notice",
            "sections",
            "updated_at",
        )
        read_only_fields = ("kind", "updated_at")


# ---------------------------------------------------------------------------
# Navigation and trip types
# ---------------------------------------------------------------------------


@extend_schema_serializer(component_name="AdminNavLink")
class NavLinkSerializer(CamelCaseMixin, serializers.ModelSerializer):
    class Meta:
        model = NavLink
        fields = ("id", "label", "href", "position", "is_published", "updated_at")
        read_only_fields = ("updated_at",)


@extend_schema_serializer(component_name="AdminTripType")
class TripTypeInfoSerializer(CamelCaseMixin, serializers.ModelSerializer):
    class Meta:
        model = TripTypeInfo
        fields = ("id", "code", "label", "blurb", "position", "updated_at")
        read_only_fields = ("code", "position", "updated_at")


@extend_schema_serializer(component_name="AdminPageSeo")
class PageSeoSerializer(CamelCaseMixin, serializers.ModelSerializer):
    class Meta:
        model = PageSeo
        fields = ("id", "path", "title", "description", "updated_at")
        read_only_fields = ("path", "updated_at")
