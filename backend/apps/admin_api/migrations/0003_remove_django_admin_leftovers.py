"""
django.contrib.admin is no longer installed. Remove what it left behind: its
change-history table (replaced by ActivityLog) and its content type, whose
permissions cascade with it.
"""

from django.db import migrations


def remove_admin_content_types(apps, schema_editor):
    apps.get_model("contenttypes", "ContentType").objects.filter(app_label="admin").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("admin_api", "0002_default_roles"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.RunSQL("DROP TABLE IF EXISTS django_admin_log", migrations.RunSQL.noop),
        migrations.RunPython(remove_admin_content_types, migrations.RunPython.noop),
    ]
