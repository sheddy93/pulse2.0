from django.db import migrations


PERMISSION_DEFINITIONS = [
    ("employees", "view", "view-employees", "View employees", "Can view employee records."),
    ("employees", "create", "create-employees", "Create employees", "Can create employee records."),
    ("employees", "edit", "edit-employees", "Edit employees", "Can edit employee records."),
    ("employees", "suspend", "suspend-employees", "Suspend employees", "Can suspend and reactivate employees."),
    ("company_users", "view", "view-company-users", "View company users", "Can view internal company users."),
    ("company_users", "create", "create-company-users", "Create company users", "Can create internal company users."),
    ("company_users", "edit", "edit-company-users", "Edit company users", "Can edit internal company users."),
    ("company_users", "reset_password", "reset-user-password", "Reset user password", "Can reset internal user credentials."),
    ("roles", "assign", "assign-roles", "Assign roles", "Can assign company roles and permissions."),
    ("documents", "view", "view-documents", "View documents", "Can view documents."),
    ("documents", "upload", "upload-documents", "Upload documents", "Can upload documents."),
    ("attendance", "view", "view-attendance", "View attendance", "Can view attendance data."),
]

DEFAULT_COMPANY_ROLE_PERMISSIONS = {
    "company_owner": [
        "view-employees",
        "create-employees",
        "edit-employees",
        "suspend-employees",
        "view-company-users",
        "create-company-users",
        "edit-company-users",
        "reset-user-password",
        "assign-roles",
        "view-documents",
        "upload-documents",
        "view-attendance",
    ],
    "company_admin": [
        "view-employees",
        "create-employees",
        "edit-employees",
        "suspend-employees",
        "view-company-users",
        "create-company-users",
        "edit-company-users",
        "reset-user-password",
        "assign-roles",
        "view-documents",
        "upload-documents",
        "view-attendance",
    ],
    "hr_manager": [
        "view-employees",
        "create-employees",
        "edit-employees",
        "suspend-employees",
        "view-company-users",
        "create-company-users",
        "edit-company-users",
        "reset-user-password",
        "assign-roles",
        "view-documents",
        "view-attendance",
    ],
    "manager": [
        "view-employees",
        "view-attendance",
        "view-documents",
    ],
    "external_consultant": [
        "view-employees",
    ],
    "employee": [
        "view-documents",
        "view-attendance",
    ],
}


def seed_company_permissions_and_roles(apps, schema_editor):
    Company = apps.get_model("users", "Company")
    CompanyRole = apps.get_model("users", "CompanyRole")
    Permission = apps.get_model("users", "Permission")
    User = apps.get_model("users", "User")
    UserCompanyAccess = apps.get_model("users", "UserCompanyAccess")

    permissions_by_code = {}
    for module, action, code, name, description in PERMISSION_DEFINITIONS:
        permission, _ = Permission.objects.get_or_create(
            code=code,
            defaults={
                "module": module,
                "action": action,
                "name": name,
                "description": description,
                "is_system": True,
            },
        )
        permissions_by_code[code] = permission

    for company in Company.objects.all():
        company_roles = {}
        for role_code, permission_codes in DEFAULT_COMPANY_ROLE_PERMISSIONS.items():
            company_role, _ = CompanyRole.objects.get_or_create(
                company=company,
                code=role_code.replace("_", "-"),
                defaults={
                    "name": role_code.replace("_", " ").title(),
                    "description": f"Default {role_code.replace('_', ' ')} role for {company.name}.",
                    "is_system": True,
                    "is_active": True,
                },
            )
            company_role.permissions.set(
                [permissions_by_code[code] for code in permission_codes if code in permissions_by_code]
            )
            company_roles[role_code] = company_role

        for user in User.objects.filter(company=company):
            target_role = user.role
            if target_role == "super_admin":
                continue
            if target_role not in company_roles:
                target_role = "employee"
            user.company_role = company_roles[target_role]
            if user.role == "company_admin" and user.is_superuser:
                user.role = "company_owner"
            user.save(update_fields=["company_role", "role"])

            UserCompanyAccess.objects.update_or_create(
                user=user,
                company=company,
                defaults={
                    "company_role": user.company_role,
                    "is_primary": True,
                    "is_active": user.is_active,
                    "access_scope": "limited" if user.role == "external_consultant" else "full",
                },
            )


def unseed_company_permissions_and_roles(apps, schema_editor):
    CompanyRole = apps.get_model("users", "CompanyRole")
    Permission = apps.get_model("users", "Permission")

    CompanyRole.objects.filter(is_system=True).delete()
    Permission.objects.filter(code__in=[item[2] for item in PERMISSION_DEFINITIONS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0006_permission_usercompanyaccess_access_scope_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_company_permissions_and_roles, unseed_company_permissions_and_roles),
    ]
