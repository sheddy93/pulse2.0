from django.db import migrations


def cleanup_duplicate_company_roles(apps, schema_editor):
    CompanyRole = apps.get_model("users", "CompanyRole")
    User = apps.get_model("users", "User")
    UserCompanyAccess = apps.get_model("users", "UserCompanyAccess")

    for duplicate_role in CompanyRole.objects.filter(code__contains="_"):
        normalized_code = duplicate_role.code.replace("_", "-")
        canonical_role = CompanyRole.objects.filter(
            company=duplicate_role.company,
            code=normalized_code,
        ).first()

        if not canonical_role:
            duplicate_role.code = normalized_code
            duplicate_role.save(update_fields=["code"])
            continue

        User.objects.filter(company_role=duplicate_role).update(company_role=canonical_role)
        UserCompanyAccess.objects.filter(company_role=duplicate_role).update(company_role=canonical_role)
        duplicate_role.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0007_seed_company_permissions_and_roles"),
    ]

    operations = [
        migrations.RunPython(cleanup_duplicate_company_roles, migrations.RunPython.noop),
    ]
