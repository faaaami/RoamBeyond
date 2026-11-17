from django.db import migrations


def create_legal_pages(apps, schema_editor):
    LegalPage = apps.get_model("pages", "LegalPage")
    for kind in ("privacy", "terms"):
        LegalPage.objects.get_or_create(kind=kind)


class Migration(migrations.Migration):
    dependencies = [("pages", "0001_initial")]

    operations = [migrations.RunPython(create_legal_pages, migrations.RunPython.noop)]
