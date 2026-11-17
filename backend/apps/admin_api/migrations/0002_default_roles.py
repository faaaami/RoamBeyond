"""
Starting roles for the admin panel. A role is a Django group; its model
permissions decide which sections a member of staff can see and edit.
Administrators (superusers) see everything and do not need a role.
"""

from django.contrib.auth.management import create_permissions
from django.db import migrations

ALL = ("view", "add", "change", "delete")
CATALOG = ("tourpackage", "destination", "review", "photocredit", "itineraryday", "packagephoto")
PAGES = ("sitesettings", "homepage", "homestep", "storyscene", "aboutpage", "aboutfact", "aboutvalue", "otherpages", "legalpage", "legalsection")

ROLES = {
    "Sales": [("enquiries", "enquiry", ("view", "change"))],
    "Content editor": [
        *(("catalog", model, ALL) for model in CATALOG),
        *(("pages", model, ("view", "change")) for model in PAGES),
    ],
    "Manager": [
        ("enquiries", "enquiry", ALL),
        *(("catalog", model, ALL) for model in CATALOG),
        *(("pages", model, ("view", "change")) for model in PAGES),
    ],
}


def create_roles(apps, schema_editor):
    # Permissions are normally created after all migrations; make sure they exist now.
    for app_config in apps.get_app_configs():
        app_config.models_module = True
        create_permissions(app_config, verbosity=0)
        app_config.models_module = None

    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    for name, grants in ROLES.items():
        group, _ = Group.objects.get_or_create(name=name)
        for app_label, model, actions in grants:
            for action in actions:
                perm = Permission.objects.filter(
                    content_type__app_label=app_label, codename=f"{action}_{model}"
                ).first()
                if perm:
                    group.permissions.add(perm)


def remove_roles(apps, schema_editor):
    apps.get_model("auth", "Group").objects.filter(name__in=ROLES).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("admin_api", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("catalog", "0001_initial"),
        ("enquiries", "0002_tracking_and_follow_up"),
        ("pages", "0002_create_legal_pages"),
    ]

    operations = [migrations.RunPython(create_roles, remove_roles)]
