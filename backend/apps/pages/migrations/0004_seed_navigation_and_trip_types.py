"""Copy the wording that used to live in src/config/site.ts and src/data/types.ts."""

from django.db import migrations

NAV_LINKS = [
    ("Packages", "/packages"),
    ("Destinations", "/destinations"),
    ("Plan my trip", "/plan-my-trip"),
    ("About us", "/about"),
    ("Contact", "/contact"),
]

TRIP_TYPES = [
    ("solo", "Solo", "Small groups and safe stays, at your own pace."),
    ("couple", "Couple", "Honeymoons, anniversaries and quiet getaways."),
    ("family", "Family", "Easy days, child-friendly stays, no rushing."),
    ("friends", "Friends group", "Road trips, treks and beach breaks together."),
    ("corporate", "Corporate", "Offsites and team outings handled end to end."),
]


def seed(apps, schema_editor):
    NavLink = apps.get_model("pages", "NavLink")
    TripTypeInfo = apps.get_model("pages", "TripTypeInfo")
    if not NavLink.objects.exists():
        for position, (label, href) in enumerate(NAV_LINKS):
            NavLink.objects.create(label=label, href=href, position=position)
    if not TripTypeInfo.objects.exists():
        for position, (code, label, blurb) in enumerate(TRIP_TYPES):
            TripTypeInfo.objects.create(code=code, label=label, blurb=blurb, position=position)


class Migration(migrations.Migration):
    dependencies = [("pages", "0003_navigation_and_trip_types")]

    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
