"""Content editors and managers can edit page titles and descriptions."""

from django.db import migrations

GRANTS = ["Content editor", "Manager"]
CODENAMES = ["view_pageseo", "change_pageseo"]


def grant(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    perms = Permission.objects.filter(content_type__app_label="pages", codename__in=CODENAMES)
    for group in Group.objects.filter(name__in=GRANTS):
        group.permissions.add(*perms)


def revoke(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    perms = Permission.objects.filter(content_type__app_label="pages", codename__in=CODENAMES)
    for group in Group.objects.filter(name__in=GRANTS):
        group.permissions.remove(*perms)


class Migration(migrations.Migration):
    dependencies = [
        ("admin_api", "0004_roles_for_navigation"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("pages", "0007_seed_about_photos"),
    ]

    operations = [migrations.RunPython(grant, revoke)]
