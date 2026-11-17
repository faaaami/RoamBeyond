"""
The model sections the admin panel manages, in sidebar order.

One registry drives the sidebar (which sections a user may see), the stat
cards and the links in the activity feed, so adding a section is one entry
here plus its endpoints and pages.
"""

from dataclasses import dataclass
from functools import cached_property

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import models


@dataclass(frozen=True)
class Section:
    key: str  # URL segment in the admin panel and the API: /<key>
    model_label: str  # "app_label.ModelName"
    title: str
    group: str
    icon: str  # lucide-react icon name used by the website
    singleton: bool = False  # one record: edit only, no list/create/delete
    superuser_only: bool = False
    # Limits what the stat card counts, e.g. only staff among all users.
    count_filter: tuple[tuple[str, object], ...] = ()

    @cached_property
    def model(self) -> type[models.Model]:
        return apps.get_model(self.model_label)

    def perm(self, action: str) -> str:
        """Django permission codename, e.g. perm("change") -> "catalog.change_tourpackage"."""
        opts = self.model._meta
        return f"{opts.app_label}.{action}_{opts.model_name}"

    def permissions_for(self, user) -> dict[str, bool]:
        if self.superuser_only and not user.is_superuser:
            return {"view": False, "add": False, "change": False, "delete": False}
        allowed = {
            action: user.has_perm(self.perm(action))
            for action in ("view", "add", "change", "delete")
        }
        # Changing implies seeing; Django's admin treats them the same way.
        allowed["view"] = allowed["view"] or allowed["change"]
        if self.singleton:
            allowed["add"] = allowed["delete"] = False
        return allowed

    def count(self) -> int:
        return self.model._default_manager.filter(**dict(self.count_filter)).count()

    def path(self, object_id: object | None = None) -> str:
        """Page in the admin panel on the website, e.g. /admin/packages/12."""
        base = f"/admin/{self.key}"
        if self.singleton or object_id is None:
            return base
        return f"{base}/{object_id}"


SECTIONS: tuple[Section, ...] = (
    Section("enquiries", "enquiries.Enquiry", "Enquiries", "Leads", "inbox"),
    Section("packages", "catalog.TourPackage", "Tour packages", "Catalog", "luggage"),
    Section("destinations", "catalog.Destination", "Destinations", "Catalog", "map-pin"),
    Section("reviews", "catalog.Review", "Reviews", "Catalog", "message-square-quote"),
    Section("photo-credits", "catalog.PhotoCredit", "Photo credits", "Catalog", "camera"),
    Section(
        "site-settings",
        "pages.SiteSettings",
        "Site settings",
        "Website pages",
        "settings",
        singleton=True,
    ),
    Section("home-page", "pages.HomePage", "Home page", "Website pages", "house", singleton=True),
    Section(
        "about-page", "pages.AboutPage", "About page", "Website pages", "users", singleton=True
    ),
    Section(
        "other-pages", "pages.OtherPages", "Other pages", "Website pages", "files", singleton=True
    ),
    Section("legal-pages", "pages.LegalPage", "Privacy & terms", "Website pages", "scale"),
    Section("nav-links", "pages.NavLink", "Navigation", "Website pages", "menu"),
    Section("trip-types", "pages.TripTypeInfo", "Trip types", "Website pages", "tags"),
    Section("page-seo", "pages.PageSeo", "Page titles", "Website pages", "search"),
    Section(
        "users",
        get_user_model()._meta.label,
        "Staff accounts",
        "Team",
        "user-cog",
        superuser_only=True,
        count_filter=(("is_staff", True),),
    ),
)

BY_KEY = {s.key: s for s in SECTIONS}


def section_for_model(model: type[models.Model]) -> Section | None:
    """The section that manages a model, e.g. for linking an activity entry."""
    label = model._meta.label
    return next((s for s in SECTIONS if s.model_label == label), None)
