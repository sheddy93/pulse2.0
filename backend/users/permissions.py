from rest_framework import permissions

from .models import Company, EmployeeProfile, User


COMPANY_OPERATIONS_ROLES = {
    User.RoleChoices.COMPANY_OWNER,
    User.RoleChoices.COMPANY_ADMIN,
    User.RoleChoices.HR_MANAGER,
    User.RoleChoices.MANAGER,
    User.RoleChoices.EXTERNAL_CONSULTANT,
    User.RoleChoices.LABOR_CONSULTANT,
    User.RoleChoices.SAFETY_CONSULTANT,
}


def get_effective_company_role(user):
    if getattr(user, "company_role", None):
        return user.company_role

    primary_access = (
        user.company_accesses.filter(is_primary=True, is_active=True)
        .select_related("company_role")
        .first()
    )
    if primary_access:
        return primary_access.company_role

    fallback_access = (
        user.company_accesses.filter(is_active=True)
        .select_related("company_role")
        .first()
    )
    return fallback_access.company_role if fallback_access else None


def user_has_company_permission(user, permission_code):
    if user.is_platform_admin:
        return True

    company_role = get_effective_company_role(user)
    if not company_role:
        return False

    return company_role.permissions.filter(code=permission_code).exists()


class IsAuthenticatedAndTenantActive(permissions.BasePermission):
    message = "La tua azienda non puo' accedere alla piattaforma."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_platform_admin:
            return True
        if not user.company:
            return user.is_consultant and user.company_accesses.filter(is_active=True).exists()
        return user.company.status in {
            Company.StatusChoices.ACTIVE,
            Company.StatusChoices.TRIAL,
        } and not user.company.is_deleted


class IsSuperAdmin(permissions.BasePermission):
    message = "Solo il super admin puo' accedere a questa risorsa."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_platform_admin)


class IsCompanyOperator(permissions.BasePermission):
    message = "Solo gli utenti aziendali autorizzati possono accedere a questa risorsa."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.company
            and user.role in COMPANY_OPERATIONS_ROLES
        )


class HasCompanyPermission(permissions.BasePermission):
    message = "Non hai i permessi per eseguire questa azione."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_platform_admin:
            return True

        required_permissions = getattr(view, "required_permissions", [])
        return all(user_has_company_permission(user, permission_code) for permission_code in required_permissions)


class CanAccessEmployeeProfile(permissions.BasePermission):
    message = "Puoi accedere solo ai dati consentiti dal tuo ruolo."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_platform_admin:
            return True
        if isinstance(obj, EmployeeProfile):
            if user.role == User.RoleChoices.EMPLOYEE:
                return obj.user_id == user.id
            return obj.company_id == user.company_id
        return True


class IsCompanyAdmin(permissions.BasePermission):
    """Verifica che l'utente sia admin dell'azienda"""
    message = "Accesso riservato agli amministratori aziendali."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in {
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
        }


class IsConsultant(permissions.BasePermission):
    """Verifica che l'utente sia un consulente"""
    message = "Accesso riservato ai consulenti."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.is_consultant


class IsOwnerOrAdmin(permissions.BasePermission):
    """Verifica che l'utente sia owner o admin"""
    message = "Accesso riservato al proprietario o admin."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in {
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.SUPER_ADMIN,
            User.RoleChoices.PLATFORM_OWNER,
        }
