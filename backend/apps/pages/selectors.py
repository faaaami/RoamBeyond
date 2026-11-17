"""
Builds the JSON for each page. Shapes match what src/lib/content.ts reads:
empty strings and empty lists mean "use the website's default wording".
"""

from typing import Any

from rest_framework.request import Request

from apps.catalog.enums import BudgetBand, Category
from apps.core.enums import DURATION_RANGES, DurationBand
from apps.core.media import media_url

from . import layout
from .models import (
    AboutPage,
    HomePage,
    LegalPage,
    NavLink,
    OtherPages,
    PageSeo,
    SiteSettings,
    TripTypeInfo,
)


def site_settings() -> dict[str, Any]:
    return layout.nest(SiteSettings.load(), layout.SITE_SETTINGS)


def home_page(request: Request | None) -> dict[str, Any]:
    page = HomePage.load()
    data = layout.nest(page, layout.HOME_PAGE)
    data["howItWorks"]["steps"] = [{"title": s.title, "text": s.text} for s in page.steps.all()]
    scenes = page.scenes.select_related("destination").filter(destination__is_published=True)
    data["scenes"] = [
        {
            "key": str(scene.pk),
            "slug": scene.destination.slug,
            "label": scene.label or scene.destination.region,
            "title": scene.title or scene.destination.name,
            "text": scene.text,
            "image": media_url(scene.image or scene.destination.image, request),
        }
        for scene in scenes
    ]
    return data


def about_page(request: Request | None) -> dict[str, Any]:
    page = AboutPage.load()
    data = layout.nest(page, layout.ABOUT_PAGE)
    data["facts"] = [{"label": f.label, "value": f.value} for f in page.facts.all()]
    data["values"] = [{"title": v.title, "text": v.text} for v in page.values.all()]
    data["teamPhoto"] = {"src": media_url(page.team_photo, request), "alt": page.team_photo_alt}
    data["officePhoto"] = {
        "src": media_url(page.office_photo, request),
        "alt": page.office_photo_alt,
    }
    return data


def other_pages() -> dict[str, Any]:
    return layout.nest(OtherPages.load(), layout.OTHER_PAGES)


def legal_page(kind: str) -> dict[str, Any]:
    page, _ = LegalPage.objects.get_or_create(kind=kind)
    data = layout.nest(page, layout.LEGAL_PAGE)
    data["sections"] = [{"heading": s.heading, "body": s.body} for s in page.sections.all()]
    return data


def navigation() -> list[dict[str, str]]:
    """Header and footer links, in the order the agency chose."""
    links = NavLink.objects.filter(is_published=True)
    return [{"label": link.label, "href": link.href} for link in links]


def trip_types() -> list[dict[str, str]]:
    return [{"id": t.code, "label": t.label, "blurb": t.blurb} for t in TripTypeInfo.objects.all()]


def vocabulary() -> dict[str, Any]:
    """The fixed choices the website filters and labels by. Labels come from the enums."""
    return {
        "categories": [{"id": c.value, "label": c.label} for c in Category],
        "durations": [
            {
                "id": d.value,
                "label": d.label,
                "min": DURATION_RANGES[d][0],
                "max": DURATION_RANGES[d][1],
            }
            for d in DurationBand
        ],
        "budgets": [{"id": b.value, "label": b.label} for b in BudgetBand],
    }


def page_seo() -> dict[str, dict[str, str]]:
    """Titles and descriptions keyed by page path, e.g. {"/about": {"title": "...", ...}}."""
    return {
        row.path: {"title": row.title, "description": row.description}
        for row in PageSeo.objects.all()
    }
