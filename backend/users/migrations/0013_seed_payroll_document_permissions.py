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
    ("documents", "archive", "archive-documents", "Archive documents", "Can archive documents."),
    ("documents", "download_employee", "download-employee-documents", "Download employee documents", "Can download employee-visible documents."),
    ("attendance", "view", "view-attendance", "View attendance", "Can view attendance data."),
    ("attendance", "review", "review-attendance", "Review attendance", "Can review daily attendance data."),
    ("attendance", "correct", "correct-attendance", "Correct attendance", "Can manually correct attendance entries."),
    ("attendance", "approve", "approve-attendance", "Approve attendance", "Can approve attendance days and months."),
    ("payroll", "view", "view-payroll", "View payroll", "Can view payroll runs."),
    ("payroll", "create", "create-payroll", "Create payroll", "Can create payroll runs."),
    ("payroll", "edit", "edit-payroll", "Edit payroll", "Can edit payroll runs."),
    ("payroll", "approve", "approve-payroll", "Approve payroll", "Can approve payroll runs."),
    ("payroll", "request_correction", "request-payroll-correction", "Request payroll correction", "Can request payroll corrections."),
    ("payroll", "deliver", "deliver-payroll", "Deliver payroll", "Can mark payroll as delivered."),
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
        "archive-documents",
        "download-employee-documents",
        "view-attendance",
        "review-attendance",
        "correct-attendance",
        "approve-attendance",
        "view-payroll",
        "create-payroll",
        "edit-payroll",
        "approve-payroll",
        "request-payroll-correction",
        "deliver-payroll",
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
        "archive-documents",
        "download-employee-documents",
        "view-attendance",
        "review-attendance",
        "correct-attendance",
        "approve-attendance",
        "view-payroll",
        "create-payroll",
        "edit-payroll",
        "approve-payroll",
        "request-payroll-correction",
        "deliver-payroll",
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
        "upload-documents",
        "download-employee-documents",
        "view-attendance",
        "review-attendance",
        "correct-attendance",
        "approve-attendance",
        "view-payroll",
        "create-payroll",
        "edit-payroll",
        "approve-payroll",
        "request-payroll-correction",
    ],
    "manager": [
        "view-employees",
        "view-attendance",
        "view-documents",
        "download-employee-documents",
        "view-payroll",
    ],
    "external_consultant": [
        "view-employees",
        "view-attendance",
        "view-documents",
    ],
    "labor_consultant": [
        "view-employees",
        "view-attendance",
        "view-documents",
        "upload-documents",
        "archive-documents",
        "view-payroll",
        "create-payroll",
        "edit-payroll",
        "deliver-payroll",
    ],
    "safety_consultant": [
        "view-employees",
        "view-attendance",
        "view-documents",
    ],
    "employee": [
        "view-documents",
        "download-employee-documents",
        "view-attendance",
        "view-payroll",
    ],
}


def seed_permissions_and_company_roles(apps, schema_editor):
    Company = apps.get_model("users", "Company")
    CompanyRole = apps.get_model("users", "CompanyRole")
    Permission = apps.get_model("users", "Permission")

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
        for role_code, permission_codes in DEFAULT_COMPANY_ROLE_PERMISSIONS.items():
            role, _ = CompanyRole.objects.get_or_create(
                company=company,
                code=role_code.replace("_", "-"),
                defaults={
                    "name": role_code.replace("_", " ").title(),
                    "description": f"Default {role_code.replace('_', ' ')} role for {company.name}.",
                    "is_system": True,
                    "is_active": True,
                },
            )
            role.permissions.set([permissions_by_code[item] for item in permission_codes if item in permissions_by_code])


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0012_alter_auditlog_action_document_payrollrun_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_permissions_and_company_roles, migrations.RunPython.noop),
    ]

