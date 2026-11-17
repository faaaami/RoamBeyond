"""Give the existing roles permission to manage navigation links and trip-type wording."""

from django.db import migrations

ALL = ("view", "add", "change", "delete")
GRANTS = {
    # group name: [(model, actions)]
    "Content editor": [("navlink", ALL), ("triptypeinfo", ("view", "change"))],
    "Manager": [("navlink", ALL), ("triptypeinfo", ("view", "change"))],
}


def grant(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    for name, models in GRANTS.items():
        group = Group.objects.filter(name=name).first()
        if group is None:  # roles are created by 0002; a fresh database always has them
            continue
        for model, actions in models:
            for action in actions:
                perm = Permission.objects.filter(
                    content_type__app_label="pages", codename=f"{action}_{model}"
                ).first()
                if perm:
                    group.permissions.add(perm)


def revoke(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    for name, models in GRANTS.items():
        group = Group.objects.filter(name=name).first()
        if group is None:
            continue
        codenames = [f"{a}_{m}" for m, actions in models for a in actions]
        group.permissions.remove(
            *Permission.objects.filter(content_type__app_label="pages", codename__in=codenames)
        )


class Migration(migrations.Migration):
    dependencies = [
        ("admin_api", "0003_remove_django_admin_leftovers"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("pages", "0004_seed_navigation_and_trip_types"),
    ]

    operations = [migrations.RunPython(grant, revoke)]
