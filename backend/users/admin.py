from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import (
    AttendanceCorrection,
    AttendanceDayReview,
    AttendancePeriod,
    AuditLog,
    Company,
    CompanyRole,
    ConsultantCompanyLink,
    Department,
    Document,
    EmployeeProfile,
    OfficeLocation,
    Permission,
    PayrollDocumentLink,
    PayrollRun,
    Role,
    TimeEntry,
    User,
    UserCompanyAccess,
)


@admin.action(description="Suspend selected companies")
def suspend_companies(modeladmin, request, queryset):
    queryset.update(status=Company.StatusChoices.SUSPENDED, is_active=False)


@admin.action(description="Reactivate selected companies")
def reactivate_companies(modeladmin, request, queryset):
    queryset.update(status=Company.StatusChoices.ACTIVE, is_active=True, is_deleted=False, deleted_at=None)


@admin.action(description="Deactivate selected companies")
def deactivate_companies(modeladmin, request, queryset):
    queryset.update(status=Company.StatusChoices.INACTIVE, is_active=False)


@admin.action(description="Soft delete selected companies")
def soft_delete_companies(modeladmin, request, queryset):
    for company in queryset:
        company.is_deleted = True
        company.status = Company.StatusChoices.CANCELLED
        company.save()


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "public_id", "slug", "status", "plan", "subscription_end_date", "max_employees", "is_deleted", "created_at")
    search_fields = ("name", "public_id", "slug", "plan", "legal_name", "contact_email")
    list_filter = ("status", "is_deleted", "is_active", "plan")
    prepopulated_fields = {"slug": ("name",)}
    actions = (suspend_companies, reactivate_companies, deactivate_companies, soft_delete_companies)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "scope", "is_system", "created_at")
    search_fields = ("name", "code")
    list_filter = ("scope", "is_system")


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "module", "action", "name", "is_system")
    search_fields = ("code", "name", "module", "action")
    list_filter = ("module", "action", "is_system")


@admin.register(CompanyRole)
class CompanyRoleAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "company", "is_system", "is_active", "updated_at")
    search_fields = ("name", "code", "company__name")
    list_filter = ("is_system", "is_active", "company")
    filter_horizontal = ("permissions",)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "company", "is_active", "updated_at")
    search_fields = ("name", "code", "company__name")
    list_filter = ("company", "is_active")
    ordering = ("company__name", "name")


@admin.register(OfficeLocation)
class OfficeLocationAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "city", "country_code", "is_active", "updated_at")
    search_fields = ("name", "company__name", "city", "country_code")
    list_filter = ("company", "country_code", "is_active")
    ordering = ("company__name", "name")


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ("employee_code", "full_name", "company", "department", "office_location", "status", "hire_date")
    search_fields = ("employee_code", "first_name", "last_name", "email", "company__name")
    list_filter = ("company", "status", "department", "office_location")
    autocomplete_fields = ("user", "department", "office_location", "manager")
    ordering = ("company__name", "first_name", "last_name")


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "company", "entry_type", "source", "is_manual", "timestamp", "created_at")
    search_fields = ("user__email", "company__name", "note")
    list_filter = ("company", "entry_type", "source", "is_manual", "timestamp")
    ordering = ("-timestamp",)


@admin.register(AttendanceDayReview)
class AttendanceDayReviewAdmin(admin.ModelAdmin):
    list_display = ("date", "user", "company", "status", "approved_by", "reviewed_at", "updated_at")
    list_filter = ("company", "status", "date")
    search_fields = ("user__email", "company__name", "review_notes")
    ordering = ("-date", "-updated_at")
    readonly_fields = ("created_at", "updated_at")


@admin.register(AttendancePeriod)
class AttendancePeriodAdmin(admin.ModelAdmin):
    list_display = ("company", "month", "year", "status", "approved_by", "approved_at", "updated_at")
    list_filter = ("company", "status", "year", "month")
    search_fields = ("company__name",)
    ordering = ("-year", "-month", "company__name")


@admin.register(AttendanceCorrection)
class AttendanceCorrectionAdmin(admin.ModelAdmin):
    list_display = ("date", "user", "company", "action_type", "corrected_by", "created_at")
    list_filter = ("company", "action_type", "date")
    search_fields = ("user__email", "company__name", "reason")
    ordering = ("-created_at",)
    readonly_fields = ("original_value", "new_value", "created_at")


@admin.register(UserCompanyAccess)
class UserCompanyAccessAdmin(admin.ModelAdmin):
    list_display = ("user", "company", "company_role", "access_scope", "is_primary", "is_active", "granted_at")
    list_filter = ("company", "company_role", "access_scope", "is_primary", "is_active")
    search_fields = ("user__email", "company__name", "company_role__name")


@admin.register(ConsultantCompanyLink)
class ConsultantCompanyLinkAdmin(admin.ModelAdmin):
    list_display = ("consultant", "company", "status", "requested_by", "active", "approved_at", "created_at")
    list_filter = ("status", "requested_by", "active", "company")
    search_fields = ("consultant__email", "company__name", "company__public_id")
    ordering = ("-created_at",)


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "employee", "category", "visibility", "status", "file_size", "created_at")
    list_filter = ("company", "category", "visibility", "status", "created_at")
    search_fields = ("title", "description", "company__name", "employee__employee_code", "uploaded_by__email")
    autocomplete_fields = ("company", "employee", "uploaded_by")
    readonly_fields = ("mime_type", "file_size", "created_at", "updated_at", "archived_at")
    ordering = ("-created_at",)


@admin.register(PayrollRun)
class PayrollRunAdmin(admin.ModelAdmin):
    list_display = ("company", "employee", "month", "year", "status", "labor_consultant", "approved_at", "delivered_at", "updated_at")
    list_filter = ("company", "status", "month", "year")
    search_fields = ("company__name", "employee__employee_code", "employee__first_name", "employee__last_name", "labor_consultant__email")
    autocomplete_fields = ("company", "employee", "labor_consultant")
    readonly_fields = ("created_at", "updated_at", "approved_at", "delivered_at")
    ordering = ("-year", "-month", "-updated_at")


@admin.register(PayrollDocumentLink)
class PayrollDocumentLinkAdmin(admin.ModelAdmin):
    list_display = ("payroll_run", "document", "role_in_workflow", "created_at")
    list_filter = ("role_in_workflow", "payroll_run__company", "payroll_run__status")
    search_fields = ("payroll_run__employee__employee_code", "payroll_run__company__name", "document__title")
    autocomplete_fields = ("payroll_run", "document")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "role", "company", "company_role", "is_active", "is_staff", "must_change_password")
    list_filter = ("role", "company", "company_role", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "first_name", "last_name")
    autocomplete_fields = ("company", "company_role")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "company", "role", "company_role")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                    "must_change_password",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "company",
                    "role",
                    "company_role",
                    "password1",
                    "password2",
                    "must_change_password",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "company", "actor", "created_at")
    list_filter = ("action", "company", "created_at")
    search_fields = ("description", "company__name", "actor__email")
    readonly_fields = ("action", "description", "metadata", "company", "actor", "created_at")
