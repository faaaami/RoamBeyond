"""
One-time move of the website content from Sanity into this database.

    python manage.py import_sanity --project-id <id> [--dataset production] [--replace]

Reads the *published* documents through Sanity's public query API (no token
needed for a public dataset), downloads every photo into media storage and
creates the matching rows. Everything runs in one transaction: if anything
fails, nothing is written to the database.

Without --replace the command refuses to run when the catalog already has
content, so it cannot create duplicates by accident.
"""

import json
import logging
import mimetypes
import urllib.parse
import urllib.request
from typing import Any

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import models, transaction
from django.utils.text import slugify

from apps.catalog.models import (
    Destination,
    ItineraryDay,
    PackagePhoto,
    PhotoCredit,
    Review,
    TourPackage,
)
from apps.pages import layout
from apps.pages.models import (
    AboutFact,
    AboutPage,
    AboutValue,
    HomePage,
    HomeStep,
    LegalPage,
    LegalSection,
    OtherPages,
    SiteSettings,
    StoryScene,
)

logger = logging.getLogger(__name__)

API_VERSION = "v2025-02-19"
# Photos are downloaded at most this wide; next/image resizes further per device.
IMAGE_PARAMS = "w=2400&fit=max&q=90"
TIMEOUT = 30

QUERY = """{
  "siteSettings": *[_id == "siteSettings"][0],
  "homePage": *[_id == "homePage"][0]{
    ...,
    "scenes": scenes[]{
      "destination": destination._ref, label, title, text, "image": image.asset->url
    }
  },
  "aboutPage": *[_id == "aboutPage"][0]{
    ...,
    "teamPhoto": {"url": teamPhoto.asset->url, "alt": teamPhoto.alt},
    "officePhoto": {"url": officePhoto.asset->url, "alt": officePhoto.alt}
  },
  "otherPages": *[_id == "otherPages"][0],
  "privacyPage": *[_id == "privacyPage"][0],
  "termsPage": *[_id == "termsPage"][0],
  "destinations": *[_type == "destination" && defined(slug.current)]{
    _id, name, "slug": slug.current, region, tagline, description, bestSeason, knownFor,
    "image": image.asset->url, popular, order
  },
  "packages": *[_type == "tourPackage" && defined(slug.current)] | order(_createdAt asc){
    ..., "slug": slug.current, "destination": destination._ref,
    "cover": cover.asset->url, "coverAlt": cover.alt,
    "gallery": gallery[defined(asset)]{"url": asset->url, alt}
  },
  "reviews": *[_type == "review" && defined(text)] | order(_createdAt asc),
  "photoCredits": *[_type == "photoCredit" && defined(source)]
}"""


class Command(BaseCommand):
    help = "Import the published website content from Sanity (one-time migration)."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--project-id", required=True, help="Sanity project ID")
        parser.add_argument("--dataset", default="production")
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Delete the existing catalog and page content first.",
        )

    def handle(self, *args: Any, project_id: str, dataset: str, replace: bool, **opts: Any):
        if Destination.objects.exists() and not replace:
            raise CommandError(
                "The catalog already has content. Run again with --replace to overwrite it."
            )

        self.stdout.write(f"Reading published content from Sanity project {project_id}…")
        data = fetch_json(
            f"https://{project_id}.apicdn.sanity.io/{API_VERSION}/data/query/{dataset}?"
            + urllib.parse.urlencode({"query": QUERY, "perspective": "published"})
        )["result"]
        self._downloads: dict[str, str] = {}

        with transaction.atomic():
            if replace:
                clear_content()
            destinations = self.import_destinations(data["destinations"])
            self.import_packages(data["packages"], destinations)
            self.import_reviews(data["reviews"])
            self.import_photo_credits(data["photoCredits"])
            self.import_site_settings(data["siteSettings"])
            self.import_home(data["homePage"], destinations)
            self.import_about(data["aboutPage"])
            self.import_other_pages(data["otherPages"])
            self.import_legal(LegalPage.Kind.PRIVACY, data["privacyPage"])
            self.import_legal(LegalPage.Kind.TERMS, data["termsPage"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {Destination.objects.count()} destinations, "
                f"{TourPackage.objects.count()} packages, {Review.objects.count()} reviews, "
                f"{PhotoCredit.objects.count()} photo credits, the site settings and 5 pages "
                f"({len(self._downloads)} photos downloaded)."
            )
        )

    # ----- photos -----------------------------------------------------------

    def attach(self, field: models.fields.files.FieldFile, url: str | None, name: str) -> None:
        """Download `url` into `field`. A photo used twice is stored once."""
        if not url:
            return
        if url in self._downloads:
            field.name = self._downloads[url]
            return
        separator = "&" if "?" in url else "?"
        with urllib.request.urlopen(f"{url}{separator}{IMAGE_PARAMS}", timeout=TIMEOUT) as resp:
            content = resp.read()
            content_type = resp.headers.get_content_type()
        extension = mimetypes.guess_extension(content_type) or ".jpg"
        field.save(f"{slugify(name)[:60] or 'photo'}{extension}", ContentFile(content), save=False)
        self._downloads[url] = field.name or ""
        self.stdout.write(f"  photo {field.name}")

    # ----- catalog ----------------------------------------------------------

    def import_destinations(self, docs: list[dict]) -> dict[str, Destination]:
        by_sanity_id: dict[str, Destination] = {}
        for doc in docs:
            destination = Destination(
                name=doc["name"],
                slug=doc["slug"],
                region=doc.get("region") or "",
                tagline=doc.get("tagline") or "",
                description=doc.get("description") or "",
                best_season=doc.get("bestSeason") or "",
                known_for=strings(doc.get("knownFor")),
                popular=bool(doc.get("popular")),
                sort_order=order(doc),
            )
            self.attach(destination.image, doc.get("image"), doc["slug"])
            destination.save()
            by_sanity_id[doc["_id"]] = destination
        return by_sanity_id

    def import_packages(self, docs: list[dict], destinations: dict[str, Destination]) -> None:
        for doc in docs:
            destination = destinations.get(doc.get("destination") or "")
            if destination is None:
                self.stderr.write(f"  skipped package {doc['slug']}: it has no destination")
                continue
            facts = doc.get("quickFacts") or {}
            package = TourPackage(
                name=doc["name"],
                slug=doc["slug"],
                destination=destination,
                days=doc.get("days") or 1,
                nights=doc.get("nights") or 0,
                price_from=doc.get("priceFrom"),
                trip_types=strings(doc.get("tripTypes")),
                category=doc.get("category") or "",
                budget=doc.get("budget") or "",
                featured=bool(doc.get("featured")),
                sort_order=order(doc),
                summary=doc.get("summary") or "",
                overview=doc.get("overview") or "",
                highlights=strings(doc.get("highlights")),
                inclusions=strings(doc.get("inclusions")),
                exclusions=strings(doc.get("exclusions")),
                start_city=facts.get("startCity") or "",
                end_city=facts.get("endCity") or "",
                best_season=facts.get("bestSeason") or "",
                group_size=facts.get("groupSize") or "",
                stay=facts.get("stay") or "",
                transport=facts.get("transport") or "",
                cover_alt=doc.get("coverAlt") or doc["name"],
            )
            self.attach(package.cover, doc.get("cover"), doc["slug"])
            package.save()

            ItineraryDay.objects.bulk_create(
                ItineraryDay(
                    package=package,
                    position=i,
                    title=day.get("title") or f"Day {i + 1}",
                    description=day.get("description") or "",
                    meals=day.get("meals") or "",
                    stay=day.get("stay") or "",
                )
                for i, day in enumerate(doc.get("itinerary") or [])
            )
            for i, photo in enumerate(doc.get("gallery") or []):
                gallery_photo = PackagePhoto(
                    package=package, position=i, alt=photo.get("alt") or package.name
                )
                self.attach(gallery_photo.image, photo.get("url"), f"{doc['slug']}-{i + 1}")
                gallery_photo.save()

    def import_reviews(self, docs: list[dict]) -> None:
        Review.objects.bulk_create(
            Review(
                text=doc["text"],
                name=doc.get("name") or "",
                trip=doc.get("trip") or "",
                sort_order=order(doc),
            )
            for doc in docs
        )

    def import_photo_credits(self, docs: list[dict]) -> None:
        PhotoCredit.objects.bulk_create(
            PhotoCredit(
                title=doc.get("title") or doc["source"],
                author=doc.get("author") or "",
                licence=doc.get("licence") or "",
                source=doc["source"],
                used_for=doc.get("usedFor") or "",
            )
            for doc in docs
        )

    # ----- pages ------------------------------------------------------------

    def import_site_settings(self, doc: dict | None) -> None:
        settings = SiteSettings.load()
        assign(settings, layout.flatten(doc, layout.SITE_SETTINGS))
        settings.cancellation_terms = strings((doc or {}).get("cancellationTerms"))
        settings.save()

    def import_home(self, doc: dict | None, destinations: dict[str, Destination]) -> None:
        doc = doc or {}
        page = HomePage.load()
        assign(page, layout.flatten(doc, layout.HOME_PAGE))
        page.marquee = strings(doc.get("marquee"))
        page.save()

        steps = (doc.get("howItWorks") or {}).get("steps") or []
        HomeStep.objects.bulk_create(
            HomeStep(page=page, position=i, title=s.get("title") or "", text=s.get("text") or "")
            for i, s in enumerate(steps)
        )
        for i, scene_doc in enumerate(doc.get("scenes") or []):
            destination = destinations.get(scene_doc.get("destination") or "")
            if destination is None:
                continue
            scene = StoryScene(
                page=page,
                position=i,
                destination=destination,
                label=scene_doc.get("label") or "",
                title=scene_doc.get("title") or destination.name,
                text=scene_doc.get("text") or "",
            )
            self.attach(scene.image, scene_doc.get("image"), f"scene-{destination.slug}")
            scene.save()

    def import_about(self, doc: dict | None) -> None:
        doc = doc or {}
        page = AboutPage.load()
        assign(page, layout.flatten(doc, layout.ABOUT_PAGE))
        team, office = doc.get("teamPhoto") or {}, doc.get("officePhoto") or {}
        page.team_photo_alt = team.get("alt") or ""
        page.office_photo_alt = office.get("alt") or ""
        self.attach(page.team_photo, team.get("url"), "about-team")
        self.attach(page.office_photo, office.get("url"), "about-office")
        page.save()

        AboutFact.objects.bulk_create(
            AboutFact(page=page, position=i, label=f.get("label") or "", value=f.get("value") or "")
            for i, f in enumerate(doc.get("facts") or [])
        )
        AboutValue.objects.bulk_create(
            AboutValue(page=page, position=i, title=v.get("title") or "", text=v.get("text") or "")
            for i, v in enumerate(doc.get("values") or [])
        )

    def import_other_pages(self, doc: dict | None) -> None:
        page = OtherPages.load()
        assign(page, layout.flatten(doc, layout.OTHER_PAGES))
        page.plan_next_steps = strings(((doc or {}).get("planTrip") or {}).get("nextSteps"))
        page.save()

    def import_legal(self, kind: str, doc: dict | None) -> None:
        doc = doc or {}
        page, _ = LegalPage.objects.get_or_create(kind=kind)
        assign(page, layout.flatten(doc, layout.LEGAL_PAGE))
        page.hide_template_notice = bool(doc.get("hideTemplateNotice"))
        page.save()
        LegalSection.objects.bulk_create(
            LegalSection(
                page=page, position=i, heading=s.get("heading") or "", body=s.get("body") or ""
            )
            for i, s in enumerate(doc.get("sections") or [])
        )


def fetch_json(url: str) -> dict[str, Any]:
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT) as resp:
            return json.load(resp)
    except OSError as exc:
        raise CommandError(f"Could not read from Sanity: {exc}") from exc


def clear_content() -> None:
    """
    Remove everything this command creates. Queryset deletes bypass the
    singletons' delete() guard on purpose; load() recreates them empty.
    """
    TourPackage.objects.all().delete()  # cascades to itinerary days and photos
    # Page singletons cascade to their steps, scenes, facts and values.
    for singleton in (HomePage, AboutPage, OtherPages, SiteSettings):
        singleton.objects.all().delete()
    Destination.objects.all().delete()
    Review.objects.all().delete()
    PhotoCredit.objects.all().delete()
    LegalSection.objects.all().delete()


def assign(obj: models.Model, values: dict[str, Any]) -> None:
    """Set text columns. Lists are handled by the caller; non-strings are ignored."""
    for name, value in values.items():
        if isinstance(value, str | bool):
            setattr(obj, name, value)


def strings(value: Any) -> list[str]:
    return [str(v).strip() for v in value or [] if str(v).strip()]


def order(doc: dict) -> int:
    value = doc.get("order")
    return int(value) if isinstance(value, int | float) and value >= 0 else 100
