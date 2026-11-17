"""
Maps flat model columns to the nested JSON the website expects.

A layout is a dict whose values are either a column name or another layout:

    {"hero": {"eyebrow": "hero_eyebrow"}, "storyTitle": "story_title"}

`nest()` builds the API response from a row; `flatten()` does the reverse for
importing a nested document. Keeping both directions on one map means the API
shape and the import can never drift apart.
"""

from collections.abc import Mapping
from typing import Any

from django.db import models

type Layout = Mapping[str, str | Layout]


def nest(obj: models.Model, layout: Layout) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, spec in layout.items():
        out[key] = getattr(obj, spec) if isinstance(spec, str) else nest(obj, spec)
    return out


def flatten(doc: dict[str, Any] | None, layout: Layout) -> dict[str, Any]:
    """Column values found in `doc`. Missing or null values are skipped."""
    out: dict[str, Any] = {}
    doc = doc or {}
    for key, spec in layout.items():
        value = doc.get(key)
        if isinstance(spec, str):
            if value is not None:
                out[spec] = value
        else:
            out.update(flatten(value if isinstance(value, dict) else {}, spec))
    return out


def columns(layout: Layout) -> list[str]:
    """Every column a layout names, in order. Used for admin fieldsets."""
    names: list[str] = []
    for spec in layout.values():
        names.extend([spec] if isinstance(spec, str) else columns(spec))
    return names


SITE_SETTINGS: Layout = {
    "tagline": "tagline",
    "description": "description",
    "phone": {"display": "phone_display", "href": "phone_href"},
    "whatsapp": {"display": "whatsapp_display", "number": "whatsapp_number"},
    "email": "email",
    "address": {
        "display": "address_display",
        "locality": "address_locality",
        "region": "address_region",
        "mapQuery": "address_map_query",
    },
    "hours": "hours",
    "callbackWindow": "callback_window",
    "social": {"instagram": "instagram", "facebook": "facebook", "youtube": "youtube"},
    "cancellationTerms": "cancellation_terms",
    "budgetRanges": {
        "value": "budget_value",
        "comfort": "budget_comfort",
        "premium": "budget_premium",
    },
}

HOME_PAGE: Layout = {
    "hero": {
        "eyebrow": "hero_eyebrow",
        "headlineLine1": "hero_headline_line1",
        "headlineLine2": "hero_headline_line2",
        "intro": "hero_intro",
        "primaryButton": "hero_primary_button",
        "secondaryButton": "hero_secondary_button",
        "rotatingLabel": "hero_rotating_label",
    },
    "marquee": "marquee",
    "tripTypes": {
        "eyebrow": "trip_types_eyebrow",
        "title": "trip_types_title",
        "lead": "trip_types_lead",
    },
    "featured": {"eyebrow": "featured_eyebrow", "title": "featured_title", "lead": "featured_lead"},
    "destinations": {"eyebrow": "destinations_eyebrow", "title": "destinations_title"},
    "routeMap": {
        "eyebrow": "route_map_eyebrow",
        "title": "route_map_title",
        "lead": "route_map_lead",
    },
    "reviews": {"eyebrow": "reviews_eyebrow", "title": "reviews_title"},
    "howItWorks": {"eyebrow": "how_eyebrow", "title": "how_title", "lead": "how_lead"},
    "callback": {
        "eyebrow": "callback_eyebrow",
        "title": "callback_title",
        "lead": "callback_lead",
        "callNow": "callback_call_now",
    },
}

ABOUT_PAGE: Layout = {
    "header": {"eyebrow": "header_eyebrow", "title": "header_title", "lead": "header_lead"},
    "storyTitle": "story_title",
    "story": "story",
    "valuesTitle": "values_title",
    "ctaTitle": "cta_title",
}

OTHER_PAGES: Layout = {
    "packages": {
        "eyebrow": "packages_eyebrow",
        "title": "packages_title",
        "lead": "packages_lead",
        "ctaTitle": "packages_cta_title",
    },
    "destinations": {
        "eyebrow": "destinations_eyebrow",
        "title": "destinations_title",
        "lead": "destinations_lead",
        "ctaTitle": "destinations_cta_title",
        "ctaText": "destinations_cta_text",
    },
    "planTrip": {
        "eyebrow": "plan_eyebrow",
        "title": "plan_title",
        "lead": "plan_lead",
        "nextTitle": "plan_next_title",
        "nextSteps": "plan_next_steps",
        "talkPrompt": "plan_talk_prompt",
    },
    "contact": {
        "eyebrow": "contact_eyebrow",
        "title": "contact_title",
        "lead": "contact_lead",
        "directTitle": "contact_direct_title",
        "formTitle": "contact_form_title",
        "formLead": "contact_form_lead",
        "mapTitle": "contact_map_title",
    },
    "thankYou": {
        "title": "thank_you_title",
        "text": "thank_you_text",
        "hurryTitle": "thank_you_hurry_title",
        "hurryText": "thank_you_hurry_text",
    },
    "enquiryCta": {"title": "enquiry_cta_title", "text": "enquiry_cta_text"},
}

LEGAL_PAGE: Layout = {
    "title": "title",
    "intro": "intro",
    "lastUpdated": "last_updated",
    "hideTemplateNotice": "hide_template_notice",
}
