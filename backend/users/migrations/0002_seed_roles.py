from django.db import migrations


def seed_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")

    roles = [
        {
            "name": "Super Admin",
            "code": "super-admin",
            "scope": "global",
            "description": "Platform-wide governance and tenant management.",
        },
        {
            "name": "Company Admin",
            "code": "company-admin",
            "scope": "company",
            "description": "Company-level HR administration and employee management.",
        },
        {
            "name": "Employee",
            "code": "employee",
            "scope": "company",
            "description": "Employee self-service access to profile, documents, and time data.",
        },
    ]

    for role in roles:
        Role.objects.update_or_create(code=role["code"], defaults=role)


def unseed_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    Role.objects.filter(code__in=["super-admin", "company-admin", "employee"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roles, unseed_roles),
    ]
