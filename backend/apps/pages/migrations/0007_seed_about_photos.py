"""Store the About page's placeholder photos in the backend, so the website no longer keeps its own."""

from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import migrations

# The repository's website folder sits next to backend/.
SOURCE_DIR = Path(settings.BASE_DIR).parent / "public" / "images"
PHOTOS = {"team_photo": "about-team.jpg", "office_photo": "about-office.jpg"}


def seed(apps, schema_editor):
    AboutPage = apps.get_model("pages", "AboutPage")
    page, _ = AboutPage.objects.get_or_create(pk=1)
    for field, filename in PHOTOS.items():
        source = SOURCE_DIR / filename
        if getattr(page, field) or not source.exists():
            continue
        getattr(page, field).save(filename, ContentFile(source.read_bytes()), save=False)
    page.save()


class Migration(migrations.Migration):
    dependencies = [("pages", "0006_seed_page_seo")]

    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
