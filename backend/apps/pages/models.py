"""
Site settings and the editable wording of each page.

Every text field is optional. The website fills an empty field with the
original wording from src/content/defaults.ts, so a page never shows a blank
heading. Placeholders such as {callback-time} are replaced on the website with
values from Site settings.
"""

from django.core.validators import RegexValidator
from django.db import models

from apps.core.enums import TripType
from apps.core.fields import StringListField
from apps.core.models import SingletonModel, TimeStampedModel

TOKENS_HINT = (
    "You can type {callback-time}, {phone}, {email} or {hours} to insert the value "
    "from Site settings."
)


def line(verbose_name: str, help_text: str = "") -> models.CharField:
    return models.CharField(verbose_name, max_length=255, blank=True, help_text=help_text)


def paragraph(verbose_name: str, help_text: str = "") -> models.TextField:
    return models.TextField(verbose_name, blank=True, help_text=help_text)


class SiteSettings(SingletonModel):
    phone_display = line("phone shown to visitors", 'e.g. "+91 98XXX XXXXX"')
    phone_href = models.CharField(
        "phone number to dial",
        max_length=20,
        blank=True,
        help_text='Country code and digits only, e.g. "+919800000000".',
        validators=[RegexValidator(r"^\+\d{8,15}$", 'Use "+" then digits only.')],
    )
    whatsapp_display = line("WhatsApp shown to visitors")
    whatsapp_number = models.CharField(
        "WhatsApp number",
        max_length=20,
        blank=True,
        help_text='Country code and digits only, no "+", e.g. "919800000000".',
        validators=[RegexValidator(r"^\d{8,15}$", "Digits only, e.g. 919800000000.")],
    )
    # Plain text, not EmailField: the template ships with "[EMAIL]" until the agency fills it in.
    email = models.CharField(max_length=254, blank=True)
    address_display = paragraph("full address")
    address_locality = line("city")
    address_region = line("state")
    address_map_query = line(
        "Google Maps search",
        "What to search for on the contact page map, e.g. your office name and area.",
    )
    hours = line("opening hours")
    callback_window = line(
        "call-back time",
        'Completes the sentence "We call you back …", e.g. "within 2 working hours".',
    )
    instagram = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    youtube = models.URLField("YouTube", blank=True)

    tagline = line("tagline")
    description = paragraph("short description", "Shown in the footer and in Google results.")

    budget_value = line("value budget range", 'e.g. "under ₹20,000"')
    budget_comfort = line("comfort budget range")
    budget_premium = line("premium budget range")
    cancellation_terms = StringListField(
        "cancellation terms",
        max_length_each=500,
        help_text="One point per line. Shown on every package page and on the terms page.",
    )

    class Meta:
        verbose_name = verbose_name_plural = "site settings"

    def __str__(self) -> str:
        return "Site settings"


class HomePage(SingletonModel):
    hero_eyebrow = line("small label above the headline")
    hero_headline_line1 = line("headline, first line")
    hero_headline_line2 = line("headline, second line", "Shown in cream.")
    hero_intro = paragraph("text under the headline")
    hero_primary_button = line("first button (goes to Packages)")
    hero_secondary_button = line("second button (goes to Plan my trip)")
    hero_rotating_label = line(
        "label before the rotating destination name", 'e.g. "Now planning trips to"'
    )
    marquee = StringListField("moving strip of place names", max_length_each=60)

    trip_types_eyebrow = line("small label")
    trip_types_title = line("title")
    trip_types_lead = paragraph("intro line")
    featured_eyebrow = line("small label")
    featured_title = line("title")
    featured_lead = paragraph("intro line")
    destinations_eyebrow = line("small label")
    destinations_title = line("title")
    route_map_eyebrow = line("small label")
    route_map_title = line("title")
    route_map_lead = paragraph("intro line")
    reviews_eyebrow = line("small label")
    reviews_title = line("title")

    how_eyebrow = line("small label")
    how_title = line("title")
    how_lead = paragraph("intro line")

    callback_eyebrow = line("small label")
    callback_title = line("title")
    callback_lead = paragraph("intro line", TOKENS_HINT)
    callback_call_now = line("line under the phone number", TOKENS_HINT)

    class Meta:
        verbose_name = verbose_name_plural = "home page"

    def __str__(self) -> str:
        return "Home page"


class HomeStep(models.Model):
    """A step in the home page's "How it works" section."""

    page = models.ForeignKey(HomePage, on_delete=models.CASCADE, related_name="steps")
    position = models.PositiveSmallIntegerField(default=0)
    title = models.CharField(max_length=160)
    text = models.TextField(blank=True, help_text=TOKENS_HINT)

    class Meta:
        ordering = ("position", "id")
        verbose_name = "how it works step"

    def __str__(self) -> str:
        return self.title


class StoryScene(models.Model):
    """A full-screen scene in the home page scroll story."""

    page = models.ForeignKey(HomePage, on_delete=models.CASCADE, related_name="scenes")
    position = models.PositiveSmallIntegerField(default=0)
    destination = models.ForeignKey(
        "catalog.Destination",
        on_delete=models.CASCADE,
        related_name="+",
        help_text="The button links here, and its photo is used unless you add one.",
    )
    label = line("small label", 'e.g. "North". Defaults to the destination region.')
    title = models.CharField(max_length=160)
    text = models.TextField(blank=True)
    image = models.ImageField(
        "photo (optional)",
        upload_to="pages/scenes/",
        blank=True,
        help_text="Leave empty to use the destination's photo.",
    )

    class Meta:
        ordering = ("position", "id")
        verbose_name = "scroll story scene"

    def __str__(self) -> str:
        return self.title


class AboutPage(SingletonModel):
    header_eyebrow = line("small label above the title")
    header_title = line("title")
    header_lead = paragraph("intro line")
    story_title = line("story heading")
    story = paragraph("our story", "Leave an empty line between paragraphs.")
    team_photo = models.ImageField("team photo (tall)", upload_to="pages/about/", blank=True)
    team_photo_alt = line("description of the team photo")
    office_photo = models.ImageField("office photo (tall)", upload_to="pages/about/", blank=True)
    office_photo_alt = line("description of the office photo")
    values_title = line("values heading")
    cta_title = line("closing call-to-action title")

    class Meta:
        verbose_name = verbose_name_plural = "about page"

    def __str__(self) -> str:
        return "About page"


class AboutFact(models.Model):
    """Short facts shown in boxes, e.g. Founded: 2012."""

    page = models.ForeignKey(AboutPage, on_delete=models.CASCADE, related_name="facts")
    position = models.PositiveSmallIntegerField(default=0)
    label = models.CharField(max_length=80)
    value = models.CharField(max_length=160)

    class Meta:
        ordering = ("position", "id")
        verbose_name = "fact"

    def __str__(self) -> str:
        return f"{self.label}: {self.value}"


class AboutValue(models.Model):
    page = models.ForeignKey(AboutPage, on_delete=models.CASCADE, related_name="values")
    position = models.PositiveSmallIntegerField(default=0)
    title = models.CharField(max_length=160)
    text = models.TextField(blank=True)

    class Meta:
        ordering = ("position", "id")
        verbose_name = "value"

    def __str__(self) -> str:
        return self.title


class OtherPages(SingletonModel):
    """Headings and short texts for the smaller pages."""

    packages_eyebrow = line("small label")
    packages_title = line("title")
    packages_lead = paragraph("intro line")
    packages_cta_title = line("closing banner title")

    destinations_eyebrow = line("small label")
    destinations_title = line("title")
    destinations_lead = paragraph("intro line")
    destinations_cta_title = line("closing banner title")
    destinations_cta_text = paragraph("closing banner text")

    plan_eyebrow = line("small label")
    plan_title = line("title")
    plan_lead = paragraph("intro line")
    plan_next_title = line("“What happens next” heading")
    plan_next_steps = StringListField(
        "“What happens next” points", max_length_each=300, help_text=f"One per line. {TOKENS_HINT}"
    )
    plan_talk_prompt = line("line above the phone number")

    contact_eyebrow = line("small label")
    contact_title = line("title")
    contact_lead = paragraph("intro line")
    contact_direct_title = line("contact details heading")
    contact_form_title = line("form heading")
    contact_form_lead = line("line under the form heading", TOKENS_HINT)
    contact_map_title = line("map heading")

    thank_you_title = line("title")
    thank_you_text = paragraph("text", TOKENS_HINT)
    thank_you_hurry_title = line("second box heading")
    thank_you_hurry_text = line("second box text")

    enquiry_cta_title = line("title")
    enquiry_cta_text = paragraph("text")

    class Meta:
        verbose_name = verbose_name_plural = "other pages"

    def __str__(self) -> str:
        return "Other pages"


class LegalPage(TimeStampedModel):
    """The privacy policy and the terms. Both rows are created by a migration."""

    class Kind(models.TextChoices):
        PRIVACY = "privacy", "Privacy policy"
        TERMS = "terms", "Terms and conditions"

    kind = models.CharField(max_length=20, choices=Kind.choices, unique=True, editable=False)
    title = line("page title")
    intro = paragraph("intro line")
    last_updated = line("last updated", 'e.g. "12 November 2026"')
    hide_template_notice = models.BooleanField(
        "hide the “template text” warning",
        default=False,
        help_text="Turn this on once a legal adviser has reviewed the page.",
    )

    class Meta:
        ordering = ("kind",)
        verbose_name = "legal page"

    def __str__(self) -> str:
        return self.get_kind_display()


class LegalSection(models.Model):
    page = models.ForeignKey(LegalPage, on_delete=models.CASCADE, related_name="sections")
    position = models.PositiveSmallIntegerField(default=0)
    heading = models.CharField(max_length=200)
    body = models.TextField(
        "text",
        blank=True,
        help_text=(
            "Leave an empty line between paragraphs. Start lines with “- ” for a bullet list. "
            "Type {email} or {phone} for the contact details. On the terms page, put "
            "{cancellation-terms} on a line of its own to show the cancellation terms."
        ),
    )

    class Meta:
        ordering = ("position", "id")
        verbose_name = "section"

    def __str__(self) -> str:
        return self.heading


class NavLink(TimeStampedModel):
    """A link in the website header and the footer's Explore column."""

    label = models.CharField(max_length=60)
    href = models.CharField(
        "link", max_length=200, help_text='A page on this website, e.g. "/packages".'
    )
    position = models.PositiveSmallIntegerField(default=0)
    is_published = models.BooleanField("show on the website", default=True)

    class Meta:
        ordering = ("position", "id")
        verbose_name = "navigation link"

    def __str__(self) -> str:
        return self.label


class TripTypeInfo(TimeStampedModel):
    """The wording shown for each trip type. The five types themselves are fixed."""

    code = models.CharField(max_length=20, choices=TripType.choices, unique=True)
    label = models.CharField(max_length=60)
    blurb = models.CharField(max_length=200, blank=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")
        verbose_name = "trip type"

    def __str__(self) -> str:
        return self.label


class PageSeo(TimeStampedModel):
    """The search-engine title and description of one page on the website."""

    path = models.CharField(
        "page", max_length=200, unique=True, help_text='The page address, e.g. "/about".'
    )
    title = models.CharField(max_length=200)
    description = models.CharField(
        max_length=320,
        blank=True,
        help_text="Shown under the title in search results. Keep it under about 160 characters.",
    )

    class Meta:
        ordering = ("path",)
        verbose_name = "page title and description"

    def __str__(self) -> str:
        return f"{self.path}: {self.title}"
