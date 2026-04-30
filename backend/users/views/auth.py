"""
PulseHR - Django REST API Views
================================

This module contains all REST API endpoints for the PulseHR application.
Each view handles a specific resource or operation.

Structure:
- Authentication views (Login, Logout, Register, Password Reset)
- Time & Attendance views (Check-in/out, History, Approvals)
- Company & Employee management views
- Consultant link management views
- Notification views
- Onboarding views

Permissions:
- Most views require authentication (IsAuthenticated)
- Some views allow public access (AllowAny) for registration
- Role-based permissions control access to sensitive operations

@author: PulseHR Team
@version: 0.3.0-beta
"""

# Standard library imports
from collections import defaultdict

# Django imports
from django.conf import settings
from django.utils import timezone

# DRF imports
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

# Local imports - Models
from users.models import (
    AuditLog,
    AttendancePeriod,
    Company,
    CompanyRole,
    ConsultantCompanyLink,
    Department,
    EmployeeProfile,
    Notification,
    OfficeLocation,
    OnboardingProgress,
    OnboardingTask,
    Permission,
    TimeEntry,
    User,
)

# Local imports - Permissions
from users.permissions import (
    CanAccessEmployeeProfile,
    HasCompanyPermission,
    IsAuthenticatedAndTenantActive,
    IsCompanyOperator,
    IsSuperAdmin,
    user_has_company_permission,
)

# Local imports - Serializers
from users.serializers import (
    AttendanceCorrectionWriteSerializer,
    AttendanceDayApproveSerializer,
    AttendanceDayReviewSerializer,
    AttendanceMonthApproveSerializer,
    AttendanceOverviewQuerySerializer,
    AttendancePeriodSerializer,
    ChangePasswordSerializer,
    CompanyBillingSerializer,
    CompanyAttendanceSnapshotSerializer,
    ConsultantCompanyLinkActionSerializer,
    ConsultantCompanyLinkSerializer,
    ConsultantCompanyRequestByEmailSerializer,
    ConsultantCompanyRequestByPublicIdSerializer,
    ConsultantRegistrationSerializer,
    CompanyCreateSerializer,
    CompanyRegistrationSerializer,
    CompanyRoleSerializer,
    CompanySerializer,
    CompanyUpdateSerializer,
    CompanyUserSerializer,
    CompanyUserWriteSerializer,
    DepartmentSerializer,
    EmployeeProfileSerializer,
    EmployeeProfileWriteSerializer,
    LoginSerializer,
    MonthlyAttendanceEmployeeSummarySerializer,
    NotificationSerializer,
    OnboardingProgressSerializer,
    OfficeLocationSerializer,
    PermissionSerializer,
    TimeEntryActionSerializer,
    TimeEntrySerializer,
    TimeHistoryQuerySerializer,
    TimeTodaySerializer,
    UserSerializer,
)

# Local imports - Utilities
from users.utils.pricing import check_employee_limit, check_module_access, can_perform_action
from users.utils.email import send_password_reset_email, send_verification_email

# Local imports - Services
from users.services import (
    create_notification,
    notify_users,
    approve_attendance_day,
    approve_attendance_month,
    approve_consultant_company_link,
    calculate_day_summary,
    correct_time_entry,
    create_company_user,
    create_employee_profile,
    create_time_entry,
    get_accessible_companies_for_user,
    get_daily_review_rows,
    get_monthly_employee_summary,
    get_time_entries_for_day,
    get_time_history_queryset,
    get_today_status_for_user,
    get_user_accessible_company_ids,
    reject_consultant_company_link,
    remove_consultant_company_link,
    reset_company_admin_access,
    reset_company_user_password,
    request_consultant_company_link_by_email,
    request_consultant_company_link_by_public_id,
    serialize_time_entry_summary,
    user_can_access_company,
    soft_delete_company,
    update_company_billing,
    update_company_status,
    update_company_user,
    update_employee_profile,
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def parse_month_year(serializer):
    """
    Extract month and year from request data or use current date defaults.
    
    Args:
        serializer: DRF serializer containing validated_data
        
    Returns:
        tuple: (month, year) as integers
    """
    # Use validated data or fall back to current date
    month = serializer.validated_data.get("month") or timezone.localdate().month
    year = serializer.validated_data.get("year") or timezone.localdate().year
    return month, year


def resolve_company_for_request(request, *, company_id=None, allow_assigned=False):
    """
    Resolve the company context for the current request based on user role.
    
    This function determines which company the current user can access:
    - Platform admins can access any company (by ID or their own)
    - Company users can only access their own company
    - Consultants can access companies they are linked to
    
    Args:
        request: DRF request object
        company_id: Optional company ID to specifically access
        allow_assigned: Whether to check consultant's assigned companies
        
    Returns:
        Company instance or None if no access
    """
    user = request.user
    
    # Platform admins have full access
    if user.is_platform_admin:
        if company_id:
            return Company.objects.filter(id=company_id).first()
        return None
    
    # Check assigned companies for consultants
    if allow_assigned and company_id:
        company = Company.objects.filter(id=company_id).first()
        if company and user_can_access_company(user=user, company=company):
            return company
        return None
    
    # Company users can only access their own company
    if company_id and str(user.company_id) != str(company_id) and not user.is_consultant:
        return None
    
    # Consultants can access linked companies
    if company_id and user.is_consultant:
        company = Company.objects.filter(id=company_id).first()
        if company and user_can_access_company(user=user, company=company):
            return company
        return None
    
    # Default to user's own company
    return user.company


# ============================================================
# AUTHENTICATION VIEWS
# ============================================================

class LoginView(APIView):
    """
    Handle user login and token generation.
    
    Public endpoint - no authentication required.
    Validates credentials and returns auth token for subsequent requests.
    
    Request:
        POST with email and password
        
    Response:
        {
            "token": "auth_token_string",
            "user": { user data }
        }
        
    Security:
        - Token is set as HttpOnly cookie for secure browser storage
        - Cookie has SameSite=Lax protection against CSRF
        - Secure flag set in production (HTTPS only)
        - 7 day expiration with automatic refresh
    """
    permission_classes = [permissions.AllowAny]  # Public endpoint

    def post(self, request):
        # Validate login credentials
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Get authenticated user from serializer
        user = serializer.validated_data["user"]
        
        # Get or create auth token for the user
        # This allows multiple valid tokens per user
        token, _ = Token.objects.get_or_create(user=user)

        # Role to redirect URL mapping
        role_redirects = {
            User.RoleChoices.SUPER_ADMIN: "/dashboard/admin",
            User.RoleChoices.PLATFORM_OWNER: "/dashboard/admin",
            User.RoleChoices.COMPANY_OWNER: "/dashboard/company",
            User.RoleChoices.COMPANY_ADMIN: "/dashboard/company",
            User.RoleChoices.HR_MANAGER: "/dashboard/company",
            User.RoleChoices.MANAGER: "/dashboard/company",
            User.RoleChoices.LABOR_CONSULTANT: "/dashboard/consultant",
            User.RoleChoices.SAFETY_CONSULTANT: "/dashboard/consultant",
            User.RoleChoices.EXTERNAL_CONSULTANT: "/dashboard/consultant",
            User.RoleChoices.EMPLOYEE: "/dashboard/employee",
        }
        redirect_url = role_redirects.get(user.role, "/dashboard")

        # Create response with user data, token, and redirect_url
        response = Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
                "redirect_url": redirect_url,
            },
            status=status.HTTP_200_OK,
        )

        # Set HttpOnly cookie with auth token for secure browser storage
        # This replaces localStorage token storage with secure cookie
        cookie_name = getattr(settings, 'AUTH_COOKIE_NAME', 'auth_token')
        cookie_max_age = getattr(settings, 'AUTH_COOKIE_AGE', 86400 * 7)  # 7 days default
        
        # Determine if we should set Secure flag (only in production/HTTPS)
        is_secure = not settings.DEBUG
        
        response.set_cookie(
            cookie_name,
            token.key,
            max_age=cookie_max_age,
            httponly=True,  # JavaScript cannot access this cookie
            secure=is_secure,  # Only sent over HTTPS in production
            samesite='Lax',  # CSRF protection while allowing safe cross-site navigation
            path='/',
        )

        return response


class LogoutView(APIView):
    """
    Handle user logout by deleting their auth token and clearing the cookie.
    
    Requires authentication - user must be logged in to log out.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Delete all tokens for the user (single token per user setup)
        Token.objects.filter(user=request.user).delete()
        
        # Create response and clear the auth cookie
        response = Response(status=status.HTTP_204_NO_CONTENT)
        
        # Clear the auth cookie
        cookie_name = getattr(settings, 'AUTH_COOKIE_NAME', 'auth_token')
        response.delete_cookie(cookie_name, path='/')
        
        return response


class MeView(APIView):
    """
    Get current authenticated user's profile.
    
    Simple endpoint that returns the full user object for the current session.
    """
    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """
    Change current user's password.
    
    Validates the new password against Django's password validators,
    updates the user's password, and invalidates existing tokens.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        
        # Set new password using Django's secure hashing
        user.set_password(serializer.validated_data["new_password"])
        
        # Clear password change requirement flag
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        # Invalidate old tokens and create new one
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)

        # Create response with user data and set new cookie
        response = Response(
            {
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

        # Refresh the auth cookie with new token
        cookie_name = getattr(settings, 'AUTH_COOKIE_NAME', 'auth_token')
        cookie_max_age = getattr(settings, 'AUTH_COOKIE_AGE', 86400 * 7)
        is_secure = not settings.DEBUG
        
        response.set_cookie(
            cookie_name,
            token.key,
            max_age=cookie_max_age,
            httponly=True,
            secure=is_secure,
            samesite='Lax',
            path='/',
        )

        return response


# ============================================================
# REGISTRATION VIEWS
# ============================================================

class CompanyRegistrationView(APIView):
    """
    Handle new company registration with admin user creation.
    
    Public endpoint - anyone can register a new company.
    Creates both the Company record and the company admin User.
    Uses Django's set_password() for secure password storage.
    
    Request:
        POST with company details and admin user data
        
    Response:
        {
            "company": { company data },
            "company_admin": { user data },
            "message": "..."
        }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Validate and create company + admin
        serializer = CompanyRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company, company_admin = serializer.save()

        return Response(
            {
                "company": CompanySerializer(company).data,
                "company_admin": UserSerializer(company_admin).data,
                "message": "Azienda registrata con successo. Puoi effettuare il login.",
            },
            status=status.HTTP_201_CREATED,
        )


class ConsultantRegistrationView(APIView):
    """
    Handle new labor consultant registration.
    
    Public endpoint for registering external consultants (labor consultants,
    safety consultants, etc.). Creates the consultant user account.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConsultantRegistrationSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        consultant = serializer.save()

        return Response(
            {
                "consultant": UserSerializer(consultant).data,
                "message": "Consulente registrato con successo. Puoi effettuare il login.",
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# COMPANY MANAGEMENT VIEWS
# ============================================================

class CompanySelfView(APIView):
    """
    Get or update the current user's company.
    
    Company admins can view their company details and update billing settings.
    """
    permission_classes = [IsCompanyOperator]

    def get(self, request):
        """Get current company details"""
        return Response(CompanySerializer(request.user.company).data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Update company billing settings (plan, billing cycle)"""
        serializer = CompanyBillingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = update_company_billing(
            company=request.user.company,
            plan=serializer.validated_data["plan"],
            billing_cycle=serializer.validated_data["billing_cycle"],
        )
        return Response(CompanySerializer(company).data, status=status.HTTP_200_OK)


# ============================================================
# CONSULTANT-LINK MANAGEMENT VIEWS
# ============================================================

class ConsultantCompanyLinkListView(APIView):
    """
    List all consultant-company links for the current user.
    
    Returns links based on user role:
    - Platform admins see all links
    - Consultants see their own links
    - Company users see links to their company
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        user = request.user
        
        # Base queryset with related objects for efficiency
        queryset = ConsultantCompanyLink.objects.select_related("consultant", "company").order_by("-created_at")
        
        # Filter based on user role
        if user.is_platform_admin:
            queryset = queryset
        elif user.is_consultant:
            queryset = queryset.filter(consultant=user)
        elif user.company_id:
            queryset = queryset.filter(company=user.company)
        else:
            return Response([], status=status.HTTP_200_OK)
            
        return Response(ConsultantCompanyLinkSerializer(queryset, many=True).data, status=status.HTTP_200_OK)


class ConsultantRequestCompanyLinkView(APIView):
    """
    Consultant requests to link with a company using company's public ID.
    
    Consultants can request to be linked to a company by entering
    the company's unique public identifier.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request):
        # Only consultants can request links
        if not request.user.is_consultant:
            return Response({"detail": "Solo un consulente puo' richiedere un collegamento."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ConsultantCompanyRequestByPublicIdSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            link = request_consultant_company_link_by_public_id(
                actor=request.user,
                public_id=serializer.validated_data["public_id"],
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(ConsultantCompanyLinkSerializer(link).data, status=status.HTTP_201_CREATED)


class CompanyRequestConsultantLinkView(APIView):
    """
    Company requests to link with a consultant by email.
    
    Company admins/HR can invite external consultants by their email address.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request):
        # Only authorized company users can send requests
        if request.user.role not in {
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
        }:
            return Response({"detail": "Solo utenti aziendali autorizzati possono inviare richieste al consulente."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ConsultantCompanyRequestByEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            link = request_consultant_company_link_by_email(
                actor=request.user,
                consultant_email=serializer.validated_data["consultant_email"],
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(ConsultantCompanyLinkSerializer(link).data, status=status.HTTP_201_CREATED)


class ConsultantCompanyLinkApproveView(APIView):
    """
    Approve a pending consultant-company link request.
    
    Company admins can approve requests from consultants to link with their company.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request):
        serializer = ConsultantCompanyLinkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Find the link by ID
        link = ConsultantCompanyLink.objects.select_related("consultant", "company").filter(
            id=serializer.validated_data["link_id"]
        ).first()
        
        if not link:
            return Response({"detail": "Collegamento non trovato."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            link = approve_consultant_company_link(actor=request.user, link=link)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(ConsultantCompanyLinkSerializer(link).data, status=status.HTTP_200_OK)


class ConsultantCompanyLinkRejectView(APIView):
    """
    Reject a pending consultant-company link request.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request):
        serializer = ConsultantCompanyLinkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        link = ConsultantCompanyLink.objects.select_related("consultant", "company").filter(
            id=serializer.validated_data["link_id"]
        ).first()
        
        if not link:
            return Response({"detail": "Collegamento non trovato."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            link = reject_consultant_company_link(actor=request.user, link=link)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(ConsultantCompanyLinkSerializer(link).data, status=status.HTTP_200_OK)


class ConsultantCompanyLinkRemoveView(APIView):
    """
    Remove an existing consultant-company link.
    
    Can be used by either party to remove the link.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request):
        serializer = ConsultantCompanyLinkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        link = ConsultantCompanyLink.objects.select_related("consultant", "company").filter(
            id=serializer.validated_data["link_id"]
        ).first()
        
        if not link:
            return Response({"detail": "Collegamento non trovato."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            link = remove_consultant_company_link(actor=request.user, link=link)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(ConsultantCompanyLinkSerializer(link).data, status=status.HTTP_200_OK)


# ============================================================
# TIME & ATTENDANCE VIEWS
# ============================================================

class TimeEntryActionView(APIView):
    """
    Base view for time entry actions (check-in, check-out, break start/end).
    
    All time entry actions follow the same pattern:
    1. Validate the request
    2. Create the time entry via service
    3. Return the entry and today's status
    
    Subclasses define the specific action_name.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]
    
    # Override in subclasses: 'check_in', 'break_start', 'break_end', 'check_out'
    action_name = None

    def post(self, request):
        # Ensure user has an active company for attendance
        if not request.user.company:
            return Response({"detail": "La timbratura richiede un tenant attivo."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TimeEntryActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Create the time entry via service layer
            entry = create_time_entry(
                actor=request.user,
                user=request.user,
                company=request.user.company,
                action=self.action_name,
                note=serializer.validated_data.get("note", ""),
                source=serializer.validated_data.get("source", TimeEntry.SourceChoices.WEB),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        # Return entry data and today's status for UI update
        today_status = get_today_status_for_user(request.user)
        return Response(
            {
                "entry": TimeEntrySerializer(entry).data,
                "today": TimeTodaySerializer(
                    {
                        **today_status,
                        "entries": today_status["entries"],
                    }
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CheckInView(TimeEntryActionView):
    """Employee checks in (starts work)"""
    action_name = "check_in"


class BreakStartView(TimeEntryActionView):
    """Employee starts a break"""
    action_name = "break_start"


class BreakEndView(TimeEntryActionView):
    """Employee ends a break and returns to work"""
    action_name = "break_end"


class CheckOutView(TimeEntryActionView):
    """Employee checks out (ends work)"""
    action_name = "check_out"


class TimeTodayView(APIView):
    """
    Get today's attendance status and entries.
    
    Returns different data based on user role:
    - Employees see their own status
    - Managers/Admins see all employees' status for their company
    - Platform admins can specify company via query param
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        target_date = timezone.localdate()
        
        # Roles that can view company-wide attendance
        company_roles = {
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
            User.RoleChoices.MANAGER,
            User.RoleChoices.EXTERNAL_CONSULTANT,
            User.RoleChoices.LABOR_CONSULTANT,
            User.RoleChoices.SAFETY_CONSULTANT,
        }

        # Platform admin can view any company's attendance
        if request.user.is_platform_admin:
            company_id = request.query_params.get("company")
            employee_profiles = EmployeeProfile.objects.filter(company_id=company_id).select_related("user") if company_id else EmployeeProfile.objects.select_related("user")
            
            snapshots = []
            for profile in employee_profiles:
                if not profile.user_id:
                    continue
                # Get attendance summary for each employee
                summary = serialize_time_entry_summary(user=profile.user, target_date=target_date)
                snapshots.append(
                    {
                        "user_id": profile.user_id,
                        "employee_name": profile.full_name or profile.user.full_name or profile.user.email,
                        "state": summary["state"],
                        "worked_minutes": summary["worked_minutes"],
                        "break_minutes": summary["break_minutes"],
                        "first_entry_at": summary["first_entry_at"],
                        "last_entry_at": summary["last_entry_at"],
                        "anomalies": summary["anomalies"],
                        "review_status": summary["review_status"],
                    }
                )
            return Response(CompanyAttendanceSnapshotSerializer(snapshots, many=True).data, status=status.HTTP_200_OK)

        # Company managers see their company's employees
        if request.user.role in company_roles:
            if not user_has_company_permission(request.user, "view-attendance"):
                return Response({"detail": "Non hai i permessi per visualizzare le presenze."}, status=status.HTTP_403_FORBIDDEN)
                
            employee_profiles = EmployeeProfile.objects.filter(company=request.user.company).select_related("user")
            snapshots = []
            for profile in employee_profiles:
                if not profile.user_id:
                    continue
                summary = serialize_time_entry_summary(user=profile.user, target_date=target_date)
                snapshots.append(
                    {
                        "user_id": profile.user_id,
                        "employee_name": profile.full_name or profile.user.full_name or profile.user.email,
                        "state": summary["state"],
                        "worked_minutes": summary["worked_minutes"],
                        "break_minutes": summary["break_minutes"],
                        "first_entry_at": summary["first_entry_at"],
                        "last_entry_at": summary["last_entry_at"],
                        "anomalies": summary["anomalies"],
                        "review_status": summary["review_status"],
                    }
                )
            return Response(CompanyAttendanceSnapshotSerializer(snapshots, many=True).data, status=status.HTTP_200_OK)

        # Regular employees see their own status
        today_status = get_today_status_for_user(request.user)
        return Response(
            TimeTodaySerializer(
                {
                    **today_status,
                    "entries": today_status["entries"],
                }
            ).data,
            status=status.HTTP_200_OK,
        )


class TimeHistoryView(APIView):
    """
    Get historical attendance records.
    
    Returns entries grouped by day when viewing multiple employees,
    or individual entries when viewing a specific employee's history.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        serializer = TimeHistoryQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data.get("user_id")
        
        # Roles that can view company attendance
        company_roles = {
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
            User.RoleChoices.MANAGER,
            User.RoleChoices.EXTERNAL_CONSULTANT,
            User.RoleChoices.LABOR_CONSULTANT,
            User.RoleChoices.SAFETY_CONSULTANT,
        }

        # Permission check
        if request.user.role in company_roles and not user_has_company_permission(request.user, "view-attendance"):
            return Response({"detail": "Non hai i permessi per visualizzare lo storico presenze."}, status=status.HTTP_403_FORBIDDEN)

        # Get base queryset from service
        queryset = get_time_history_queryset(request_user=request.user, target_user_id=user_id)
        
        # Group by day when viewing multiple employees
        if (request.user.is_platform_admin or request.user.role in company_roles) and not user_id:
            grouped_entries = defaultdict(list)
            for entry in queryset[:500]:
                grouped_entries[(entry.user_id, timezone.localtime(entry.timestamp).date())].append(entry)

            payload = []
            for (entry_user_id, target_date), entries in grouped_entries.items():
                summary = calculate_day_summary(sorted(entries, key=lambda item: (item.timestamp, item.created_at)))
                user = entries[0].user
                payload.append(
                    {
                        "user_id": str(entry_user_id),
                        "date": str(target_date),
                        "employee_name": user.full_name or user.email,
                        "state": summary["state"],
                        "worked_minutes": summary["worked_minutes"],
                        "break_minutes": summary["break_minutes"],
                        "first_entry_at": summary["first_entry_at"],
                        "last_entry_at": summary["last_entry_at"],
                        "anomalies": summary["anomalies"],
                        "entries": TimeEntrySerializer(entries, many=True).data,
                    }
                )
            return Response(payload, status=status.HTTP_200_OK)

        # Return individual entries for single user
        return Response(TimeEntrySerializer(queryset[:200], many=True).data, status=status.HTTP_200_OK)


class CompanyAttendanceOverviewView(APIView):
    """
    Get monthly attendance overview for a company.
    
    Returns summarized attendance data for all employees in a company
    for a specific month. Used for payroll preparation and reporting.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        # Role and permission check
        if request.user.role not in {
            User.RoleChoices.SUPER_ADMIN,
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
            User.RoleChoices.MANAGER,
        }:
            return Response({"detail": "Ruolo non autorizzato."}, status=status.HTTP_403_FORBIDDEN)
            
        if not request.user.is_platform_admin and not user_has_company_permission(request.user, "view-attendance"):
            return Response({"detail": "Non hai i permessi per visualizzare le presenze."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AttendanceOverviewQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        # Resolve company context
        company = resolve_company_for_request(request, company_id=serializer.validated_data.get("company_id"))
        if not company:
            return Response({"detail": "Tenant non disponibile."}, status=status.HTTP_404_NOT_FOUND)

        month, year = parse_month_year(serializer)
        
        # Get employee queryset
        users_queryset = User.objects.filter(
            company=company,
            role=User.RoleChoices.EMPLOYEE,
            is_active=True,
        ).order_by("first_name", "last_name", "email")
        
        # Filter by specific employee if requested
        user_id = serializer.validated_data.get("user_id")
        if user_id:
            users_queryset = users_queryset.filter(id=user_id)

        # Get monthly summaries via service
        payload = get_monthly_employee_summary(
            company=company,
            users_queryset=list(users_queryset),
            month=month,
            year=year,
        )
        return Response(MonthlyAttendanceEmployeeSummarySerializer(payload, many=True).data, status=status.HTTP_200_OK)


class CompanyAttendanceDailyReviewView(APIView):
    """
    Get daily attendance review data for a company.
    
    Returns day-by-day attendance with anomalies and review status.
    Used by managers to review and approve employee attendance.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        # Role check
        if request.user.role not in {
            User.RoleChoices.SUPER_ADMIN,
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
            User.RoleChoices.MANAGER,
        }:
            return Response({"detail": "Ruolo non autorizzato."}, status=status.HTTP_403_FORBIDDEN)
            
        if not request.user.is_platform_admin and not user_has_company_permission(request.user, "review-attendance"):
            return Response({"detail": "Non hai i permessi per revisionare le presenze."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AttendanceOverviewQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        company = resolve_company_for_request(request, company_id=serializer.validated_data.get("company_id"))
        if not company:
            return Response({"detail": "Tenant non disponibile."}, status=status.HTTP_404_NOT_FOUND)

        month, year = parse_month_year(serializer)
        
        # Get employees and daily review data
        users_queryset = User.objects.filter(company=company, role=User.RoleChoices.EMPLOYEE).order_by("first_name", "last_name", "email")
        user_id = serializer.validated_data.get("user_id")
        if user_id:
            users_queryset = users_queryset.filter(id=user_id)

        rows = get_daily_review_rows(
            company=company,
            users_queryset=list(users_queryset),
            month=month,
            year=year,
            status_filter=serializer.validated_data.get("review_status"),
            anomaly_filter=serializer.validated_data.get("anomaly"),
        )
        return Response(AttendanceDayReviewSerializer(rows, many=True).data, status=status.HTTP_200_OK)


class CompanyAttendanceCorrectEntryView(APIView):
    """
    Correct an attendance entry or add a missed entry.
    
    Managers can make corrections to employee attendance records,
    including adding missed entries or fixing incorrect data.
    All corrections are logged for audit purposes.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request):
        # Role check
        if request.user.role not in {
            User.RoleChoices.SUPER_ADMIN,
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
        }:
            return Response({"detail": "Ruolo non autorizzato."}, status=status.HTTP_403_FORBIDDEN)
            
        if not request.user.is_platform_admin and not user_has_company_permission(request.user, "correct-attendance"):
            return Response({"detail": "Non hai i permessi per correggere le presenze."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AttendanceCorrectionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Find target employee
        target_user = User.objects.filter(id=serializer.validated_data["user_id"], role=User.RoleChoices.EMPLOYEE).first()
        if not target_user:
            return Response({"detail": "Dipendente non trovato."}, status=status.HTTP_404_NOT_FOUND)

        company = resolve_company_for_request(request, company_id=request.data.get("company_id"))
        if not company or target_user.company_id != company.id:
            return Response({"detail": "Dipendente non appartenente al tenant."}, status=status.HTTP_400_BAD_REQUEST)

        # Get existing entry if correcting specific entry
        entry = None
        entry_id = serializer.validated_data.get("entry_id")
        if entry_id:
            entry = TimeEntry.objects.filter(id=entry_id, user=target_user, company=company).first()

        try:
            correct_time_entry(
                actor=request.user,
                company=company,
                target_user=target_user,
                action_type=serializer.validated_data["action_type"],
                reason=serializer.validated_data["reason"],
                target_date=serializer.validated_data["date"],
                entry=entry,
                entry_type=serializer.validated_data.get("entry_type"),
                timestamp=serializer.validated_data.get("timestamp"),
                note=serializer.validated_data.get("note", ""),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        # Return updated summary
        payload = serialize_time_entry_summary(user=target_user, target_date=serializer.validated_data["date"])
        return Response(AttendanceDayReviewSerializer(payload).data, status=status.HTTP_200_OK)


class CompanyAttendanceApproveDayView(APIView):
    """
    Approve a single day's attendance for an employee.
    
    Marks the day's attendance as approved, preparing it for payroll.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request):
        # Role check
        if request.user.role not in {
            User.RoleChoices.SUPER_ADMIN,
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
        }:
            return Response({"detail": "Ruolo non autorizzato."}, status=status.HTTP_403_FORBIDDEN)
            
        if not request.user.is_platform_admin and not user_has_company_permission(request.user, "approve-attendance"):
            return Response({"detail": "Non hai i permessi per approvare le presenze."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AttendanceDayApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        target_user = User.objects.filter(id=serializer.validated_data["user_id"], role=User.RoleChoices.EMPLOYEE).first()
        if not target_user:
            return Response({"detail": "Dipendente non trovato."}, status=status.HTTP_404_NOT_FOUND)

        company = resolve_company_for_request(request, company_id=request.data.get("company_id"))
        if not company or target_user.company_id != company.id:
            return Response({"detail": "Dipendente non appartenente al tenant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            approve_attendance_day(
                actor=request.user,
                company=company,
                target_user=target_user,
                target_date=serializer.validated_data["date"],
                review_note=serializer.validated_data.get("review_note", ""),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        payload = serialize_time_entry_summary(user=target_user, target_date=serializer.validated_data["date"])
        return Response(AttendanceDayReviewSerializer(payload).data, status=status.HTTP_200_OK)


class CompanyAttendanceApproveMonthView(APIView):
    """
    Approve all pending attendance for a complete month.
    
    Bulk approval action that marks all unapproved days in the month.
    Sends notifications to linked consultants that payroll can proceed.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def post(self, request):
        # Role check
        if request.user.role not in {
            User.RoleChoices.SUPER_ADMIN,
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
        }:
            return Response({"detail": "Ruolo non autorizzato."}, status=status.HTTP_403_FORBIDDEN)
            
        if not request.user.is_platform_admin and not user_has_company_permission(request.user, "approve-attendance"):
            return Response({"detail": "Non hai i permessi per approvare il mese."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AttendanceMonthApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = resolve_company_for_request(request, company_id=request.data.get("company_id"))
        if not company:
            return Response({"detail": "Tenant non disponibile."}, status=status.HTTP_404_NOT_FOUND)

        try:
            period = approve_attendance_month(
                actor=request.user,
                company=company,
                month=serializer.validated_data["month"],
                year=serializer.validated_data["year"],
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        # Notify linked consultants that payroll can proceed
        consultants = User.objects.filter(
            consultant_company_links__company=company,
            consultant_company_links__status=ConsultantCompanyLink.StatusChoices.APPROVED,
            consultant_company_links__active=True,
            is_active=True,
        ).distinct()

        notify_users(
            users=list(consultants),
            title="Presenze mensili approvate",
            message=f"L'azienda {company.name} ha approvato le presenze di {serializer.validated_data['month']:02d}/{serializer.validated_data['year']}. Il payroll puÃ² proseguire.",
            notification_type=Notification.TypeChoices.SUCCESS,
            priority=Notification.PriorityChoices.HIGH,
            action_url="/consultant/payroll",
            metadata={"company_id": str(company.id), "month": serializer.validated_data["month"], "year": serializer.validated_data["year"]},
        )

        # Also notify the admin who approved
        create_notification(
            user=request.user,
            title="Mese presenze approvato",
            message=f"Hai approvato le presenze del mese {serializer.validated_data['month']:02d}/{serializer.validated_data['year']}.",
            notification_type=Notification.TypeChoices.SUCCESS,
            priority=Notification.PriorityChoices.MEDIUM,
            action_url="/company/attendance/monthly",
            metadata={"company_id": str(company.id), "month": serializer.validated_data["month"],"year": serializer.validated_data["year"]},
        )

        return Response(AttendancePeriodSerializer(period).data, status=status.HTTP_200_OK)


# ============================================================
# CONSULTANT VIEWS
# ============================================================

class ConsultantCompaniesView(APIView):
    """
    Get list of companies accessible to the current consultant.
    
    Consultants can access multiple companies they've been linked to.
    Returns basic company info with status and plan.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        if not request.user.is_consultant:
            return Response({"detail": "Solo i consulenti possono accedere a questa risorsa."}, status=status.HTTP_403_FORBIDDEN)

        companies = get_accessible_companies_for_user(request.user)
        payload = [
            {
                "id": str(company.id),
                "name": company.name,
                "status": company.status,
                "plan": company.plan,
            }
            for company in companies
        ]
        return Response(payload, status=status.HTTP_200_OK)


class ConsultantCompanyOverviewView(APIView):
    """
    Get detailed attendance overview for a specific company as consultant.
    
    Consultants can view monthly attendance data for companies they're linked to.
    Creates an audit log entry for each access.
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        if not request.user.is_consultant:
            return Response({"detail": "Solo i consulenti possono accedere a questa risorsa."}, status=status.HTTP_403_FORBIDDEN)
            
        if not user_has_company_permission(request.user, "view-attendance"):
            return Response({"detail": "Non hai i permessi per visualizzare le presenze."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AttendanceOverviewQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        company = resolve_company_for_request(
            request,
            company_id=serializer.validated_data.get("company_id"),
            allow_assigned=True,
        )
        if not company:
            return Response({"detail": "Tenant non disponibile."}, status=status.HTTP_404_NOT_FOUND)

        month, year = parse_month_year(serializer)
        users_queryset = User.objects.filter(company=company, role=User.RoleChoices.EMPLOYEE).order_by("first_name", "last_name", "email")
        payload = get_monthly_employee_summary(
            company=company,
            users_queryset=list(users_queryset),
            month=month,
            year=year,
        )
        
        # Create audit log entry
        AuditLog.objects.create(
            actor=request.user,
            company=company,
            action=AuditLog.ActionChoices.CONSULTANT_ACCESS,
            description=f"Consultant accessed monthly attendance overview for {company.name}.",
            metadata={"company_id": str(company.id), "month": month, "year": year},
        )
        
        log = {
            "company_id": str(company.id),
            "month": month,
            "year": year,
        }
        return Response(
            {
                "company": {"id": str(company.id), "name": company.name, "status": company.status},
                "summary": MonthlyAttendanceEmployeeSummarySerializer(payload, many=True).data,
                "metadata": log,
            },
            status=status.HTTP_200_OK,
        )


class MonthlyAttendanceSummaryView(APIView):
    """
    Get monthly attendance summary (employee or company level).
    
    Returns different data based on user role:
    - Employees see their own monthly summary
    - Others see company-level summary for specified company
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        serializer = AttendanceOverviewQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        month, year = parse_month_year(serializer)

        # Employees see their own data only
        if request.user.role == User.RoleChoices.EMPLOYEE:
            payload = get_monthly_employee_summary(
                company=request.user.company,
                users_queryset=[request.user],
                month=month,
                year=year,
            )
            return Response(MonthlyAttendanceEmployeeSummarySerializer(payload, many=True).data, status=status.HTTP_200_OK)

        # Consultants use allow_assigned to access linked companies
        if request.user.is_consultant:
            company = resolve_company_for_request(
                request,
                company_id=serializer.validated_data.get("company_id"),
                allow_assigned=True,
            )
        else:
            company = resolve_company_for_request(request, company_id=serializer.validated_data.get("company_id"))

        if not company:
            return Response({"detail": "Tenant non disponibile."}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_platform_admin and not user_has_company_permission(request.user, "view-attendance"):
            return Response({"detail": "Non hai i permessi per visualizzare il riepilogo mensile."}, status=status.HTTP_403_FORBIDDEN)

        users_queryset = User.objects.filter(company=company, role=User.RoleChoices.EMPLOYEE).order_by("first_name", "last_name", "email")
        user_id = serializer.validated_data.get("user_id")
        if user_id:
            users_queryset = users_queryset.filter(id=user_id)

        payload = get_monthly_employee_summary(
            company=company,
            users_queryset=list(users_queryset),
            month=month,
            year=year,
        )
        return Response(MonthlyAttendanceEmployeeSummarySerializer(payload, many=True).data, status=status.HTTP_200_OK)


# ============================================================
# BASE VIEW SET CLASSES
# ============================================================

class TenantScopedViewSet(viewsets.GenericViewSet):
    """
    Base ViewSet for tenant-scoped resources.
    
    Provides common functionality for views that operate within a company context:
    - Automatic company resolution from user
    - Tenant-based queryset filtering
    - Permission checking by action
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]
    
    # Map actions to required permissions
    # Override in subclasses to define permission requirements
    required_permissions_by_action = {}

    def get_permissions(self):
        """Build permission list based on action and user"""
        permission_instances = [permissions.IsAuthenticated(), IsAuthenticatedAndTenantActive()]
        required_permissions = self.required_permissions_by_action.get(self.action, [])
        self.required_permissions = required_permissions
        if required_permissions:
            permission_instances.append(HasCompanyPermission())
        return permission_instances

    def current_company(self):
        """
        Get the current company context for the request.
        
        Platform admins can specify company via query param.
        Regular users see their own company.
        """
        if self.request.user.is_platform_admin:
            company_id = self.request.query_params.get("company") or self.request.data.get("company")
            if not company_id:
                return None
            return Company.objects.filter(id=company_id).first()
        return self.request.user.company

    def tenant_queryset(self, queryset):
        """
        Filter queryset to current tenant.
        
        Platform admins can specify company, others see their own company's data.
        """
        if self.request.user.is_platform_admin:
            company_id = self.request.query_params.get("company")
            return queryset.filter(company_id=company_id) if company_id else queryset
        return queryset.filter(company=self.request.user.company)


# ============================================================
# COMPANY VIEW SET (Admin Only)
# ============================================================

class CompanyViewSet(viewsets.ModelViewSet):
    """
    Full CRUD operations for Companies (Platform Admin only).
    
    Provides standard list, retrieve, create, update, delete operations
    plus custom actions for company lifecycle management.
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = CompanySerializer
    lookup_field = "id"

    def get_queryset(self):
        """Get all non-deleted companies, ordered by creation date"""
        return Company.objects.filter(is_deleted=False).order_by("-created_at")

    def get_serializer_class(self):
        """Use different serializer based on action"""
        if self.action == "create":
            return CompanyCreateSerializer
        if self.action in {"update", "partial_update"}:
            return CompanyUpdateSerializer
        return CompanySerializer

    def create(self, request, *args, **kwargs):
        """Create new company with admin user"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company, company_admin = serializer.save()

        return Response(
            {
                "company": CompanySerializer(company, context=self.get_serializer_context()).data,
                "company_admin": UserSerializer(company_admin).data,
                "email_sent": True,
                "login_email": company_admin.email,
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """Update company details"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        instance.refresh_from_db()
        return Response(CompanySerializer(instance, context=self.get_serializer_context()).data)

    def destroy(self, request, *args, **kwargs):
        """Soft delete company (doesn't actually delete data)"""
        instance = self.get_object()
        soft_delete_company(actor=request.user, company=instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # Custom actions for company status management
    @action(detail=True, methods=["post"])
    def suspend(self, request, id=None):
        """Suspend a company (prevents login)"""
        company = self.get_object()
        update_company_status(
            actor=request.user,
            company=company,
            status=Company.StatusChoices.SUSPENDED,
            audit_action=AuditLog.ActionChoices.COMPANY_SUSPENDED,
            description=f"Company {company.name} suspended.",
        )
        return Response(CompanySerializer(company, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"])
    def reactivate(self, request, id=None):
        """Reactivate a suspended company"""
        company = self.get_object()
        update_company_status(
            actor=request.user,
            company=company,
            status=Company.StatusChoices.ACTIVE,
            audit_action=AuditLog.ActionChoices.COMPANY_REACTIVATED,
            description=f"Company {company.name} reactivated.",
        )
        return Response(CompanySerializer(company, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, id=None):
        """Deactivate a company"""
        company = self.get_object()
        update_company_status(
            actor=request.user,
            company=company,
            status=Company.StatusChoices.INACTIVE,
            audit_action=AuditLog.ActionChoices.COMPANY_DEACTIVATED,
            description=f"Company {company.name} deactivated.",
        )
        return Response(CompanySerializer(company, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"])
    def soft_delete(self, request, id=None):
        """Soft delete a company"""
        company = self.get_object()
        soft_delete_company(actor=request.user, company=company)
        return Response(CompanySerializer(company, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"])
    def reset_access(self, request, id=None):
        """Reset company admin password"""
        company = self.get_object()
        company_admin, temporary_password = reset_company_admin_access(actor=request.user, company=company)
        return Response(
            {
                "company": CompanySerializer(company, context=self.get_serializer_context()).data,
                "company_admin": UserSerializer(company_admin).data,
                "email_sent": True,
            }
        )


# ============================================================
# COMPANY USER VIEW SET
# ============================================================

class CompanyUserViewSet(
    TenantScopedViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
):
    """
    Manage company users (non-employee accounts).
    
    Allows company admins to create and manage admin/manager users
    within their company. Does not allow delete - use deactivate instead.
    """
    lookup_field = "id"
    
    # Permissions required for each action
    required_permissions_by_action = {
        "list": ["view-company-users"],
        "retrieve": ["view-company-users"],
        "create": ["create-company-users"],
        "update": ["edit-company-users"],
        "partial_update": ["edit-company-users"],
        "deactivate": ["edit-company-users"],
        "reactivate": ["edit-company-users"],
        "reset_access": ["reset-user-password"],
    }

    def get_queryset(self):
        """Get company users, excluding platform admins and regular employees"""
        queryset = User.objects.exclude(role__in=[User.RoleChoices.SUPER_ADMIN, User.RoleChoices.PLATFORM_OWNER, User.RoleChoices.EMPLOYEE]).select_related("company", "company_role")
        return self.tenant_queryset(queryset)

    def get_serializer_class(self):
        """Use different serializer for write operations"""
        if self.action in {"create", "update", "partial_update"}:
            return CompanyUserWriteSerializer
        return CompanyUserSerializer

    def perform_create(self, serializer):
        """Create company user via service"""
        company = self.current_company()
        user, temporary_password = create_company_user(
            actor=self.request.user,
            company=company,
            payload=serializer.validated_data,
        )
        self._created_user = user

    def create(self, request, *args, **kwargs):
        """Create new company user"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {
                "user": CompanyUserSerializer(self._created_user).data,
                "email_sent": True,
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """Update company user"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance=instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_user = update_company_user(actor=request.user, target_user=instance, payload=serializer.validated_data)
        return Response(CompanyUserSerializer(updated_user).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """Prevent DELETE - must use deactivate action"""
        return Response({"detail": "Use deactivate instead."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, id=None):
        """Deactivate a user account"""
        target_user = self.get_object()
        updated_user = update_company_user(
            actor=request.user,
            target_user=target_user,
            payload={"is_active": False},
        )
        return Response(CompanyUserSerializer(updated_user).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reactivate(self, request, id=None):
        """Reactivate a deactivated user account"""
        target_user = self.get_object()
        updated_user = update_company_user(
            actor=request.user,
            target_user=target_user,
            payload={"is_active": True},
        )
        return Response(CompanyUserSerializer(updated_user).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reset_access(self, request, id=None):
        """Reset user's password and send email"""
        target_user = self.get_object()
        reset_company_user_password(actor=request.user, target_user=target_user)
        return Response(
            {
                "user": CompanyUserSerializer(target_user).data,
                "email_sent": True,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# EMPLOYEE PROFILE VIEW SET
# ============================================================

class EmployeeProfileViewSet(
    TenantScopedViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
):
    """
    Manage employee profiles within a company.
    
    Provides CRUD operations for employee records.
    Includes pricing limit checks on creation.
    Employees can only view their own profile.
    """
    lookup_field = "id"
    
    required_permissions_by_action = {
        "list": ["view-employees"],
        "retrieve": ["view-employees"],
        "create": ["create-employees"],
        "update": ["edit-employees"],
        "partial_update": ["edit-employees"],
        "suspend": ["suspend-employees"],
        "reactivate": ["suspend-employees"],
    }

    def get_permissions(self):
        """Special handling for employees viewing their own profile"""
        if self.request.user.role == User.RoleChoices.EMPLOYEE and self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated(), IsAuthenticatedAndTenantActive(), CanAccessEmployeeProfile()]
        permission_instances = super().get_permissions()
        if self.action == "retrieve":
            permission_instances.append(CanAccessEmployeeProfile())
        return permission_instances

    def get_queryset(self):
        """Get employee profiles based on user role"""
        queryset = EmployeeProfile.objects.select_related(
            "company",
            "user",
            "department",
            "office_location",
            "manager",
        )
        if self.request.user.is_platform_admin:
            company_id = self.request.query_params.get("company")
            return queryset.filter(company_id=company_id) if company_id else queryset
        if self.request.user.role == User.RoleChoices.EMPLOYEE:
            return queryset.filter(user=self.request.user)
        return queryset.filter(company=self.request.user.company)

    def get_serializer_class(self):
        """Use different serializer for write operations"""
        if self.action in {"create", "update", "partial_update"}:
            return EmployeeProfileWriteSerializer
        return EmployeeProfileSerializer

    def create(self, request, *args, **kwargs):
        """
        Create new employee profile.
        
        Includes pricing limit check:
        - Verifies company hasn't reached employee limit
        - Returns 403 if limit exceeded with upgrade info
        """
        company = self.current_company()
        
        # PRICING LIMIT CHECK: verify can add more employees
        can_add, current, max_emp, extra_cost = check_employee_limit(company)
        if not can_add:
            return Response(
                {
                    "detail": f"Limite dipendenti raggiunto ({max_emp}). Il tuo piano non permette di aggiungere altri dipendenti. Aggiorna il piano per continuare.",
                    "error_code": "EMPLOYEE_LIMIT_REACHED",
                    "current_count": current,
                    "max_allowed": max_emp,
                    "extra_cost_per_employee": extra_cost,
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = create_employee_profile(
            actor=request.user,
            company=company,
            payload=serializer.validated_data,
        )
        return Response(EmployeeProfileSerializer(employee).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update employee profile"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance=instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        employee = update_employee_profile(actor=request.user, employee=instance, payload=serializer.validated_data)
        return Response(EmployeeProfileSerializer(employee).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def suspend(self, request, id=None):
        """Suspend an employee (prevents login)"""
        employee = self.get_object()
        employee = update_employee_profile(
            actor=request.user,
            employee=employee,
            payload={"status": EmployeeProfile.StatusChoices.SUSPENDED},
        )
        return Response(EmployeeProfileSerializer(employee).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reactivate(self, request, id=None):
        """Reactivate a suspended employee"""
        employee = self.get_object()
        employee = update_employee_profile(
            actor=request.user,
            employee=employee,
            payload={"status": EmployeeProfile.StatusChoices.ACTIVE},
        )
        return Response(EmployeeProfileSerializer(employee).data, status=status.HTTP_200_OK)


# ============================================================
# DEPARTMENT & LOCATION VIEW SETS
# ============================================================

class DepartmentViewSet(TenantScopedViewSet, viewsets.ModelViewSet):
    """
    Manage departments within a company.
    
    Simple CRUD operations for organizational departments.
    """
    serializer_class = DepartmentSerializer
    lookup_field = "id"
    required_permissions_by_action = {
        "list": ["view-employees"],
        "retrieve": ["view-employees"],
        "create": ["edit-employees"],
        "update": ["edit-employees"],
        "partial_update": ["edit-employees"],
        "destroy": ["edit-employees"],
    }

    def get_queryset(self):
        return self.tenant_queryset(Department.objects.all())

    def perform_create(self, serializer):
        serializer.save(company=self.current_company())


class OfficeLocationViewSet(TenantScopedViewSet, viewsets.ModelViewSet):
    """
    Manage office locations within a company.
    
    Simple CRUD operations for physical office locations.
    """
    serializer_class = OfficeLocationSerializer
    lookup_field = "id"
    required_permissions_by_action = {
        "list": ["view-employees"],
        "retrieve": ["view-employees"],
        "create": ["edit-employees"],
        "update": ["edit-employees"],
        "partial_update": ["edit-employees"],
        "destroy": ["edit-employees"],
    }

    def get_queryset(self):
        return self.tenant_queryset(OfficeLocation.objects.all())

    def perform_create(self, serializer):
        serializer.save(company=self.current_company())


class CompanyRoleViewSet(TenantScopedViewSet, viewsets.ModelViewSet):
    """
    Manage company roles with associated permissions.
    
    Allows companies to define custom roles and assign permissions.
    """
    serializer_class = CompanyRoleSerializer
    lookup_field = "id"
    required_permissions_by_action = {
        "list": ["assign-roles"],
        "retrieve": ["assign-roles"],
        "create": ["assign-roles"],
        "update": ["assign-roles"],
        "partial_update": ["assign-roles"],
        "destroy": ["assign-roles"],
    }

    def get_queryset(self):
        return self.tenant_queryset(CompanyRole.objects.prefetch_related("permissions"))

    def perform_create(self, serializer):
        serializer.save(company=self.current_company())


class PermissionViewSet(TenantScopedViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    """
    List available permissions.
    
    Read-only view for browsing available system permissions.
    Used when assigning permissions to roles.
    """
    serializer_class = PermissionSerializer
    queryset = Permission.objects.all()
    lookup_field = "id"
    required_permissions_by_action = {
        "list": ["assign-roles"],
        "retrieve": ["assign-roles"],
    }


# ============================================================
# PASSWORD RESET VIEWS
# ============================================================

# Import serializers for password reset
from users.serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer, EmailVerifySerializer


class PasswordResetRequestView(APIView):
    """
    Request password reset email.
    
    Public endpoint - finds user by email and sends reset link.
    Always returns success to prevent email enumeration attacks.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
            
            # Generate password reset token using Django's token generator
            from django.contrib.auth.tokens import default_token_generator
            from django.utils.encoding import force_bytes, force_str
            from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
            from django.template.loader import render_to_string
            from django.core.mail import send_mail
            from django.conf import settings

            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

            # Build reset link
            reset_link = f"{getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:3000')}/reset-password?token={uidb64}-{token}"

            # Send HTML email using email_utils (fails silently in development)
            send_password_reset_email(user)

            return Response(
                {"message": "Email di reset inviata. Controlla la tua casella email.", "email": email},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            # Don't reveal if email exists for security
            return Response(
                {"message": "Se l'email esiste nel sistema, riceverai un'email di reset.", "email": email},
                status=status.HTTP_200_OK
            )


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token.
    
    Validates the token and sets new password.
    Token format: uidb64-token
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

        try:
            # Parse token format: uidb64-token
            uidb64, token_key = token.split("-")
            from django.utils.encoding import force_str
            from django.utils.http import urlsafe_base64_decode
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            # Validate token
            from django.contrib.auth.tokens import default_token_generator
            if not default_token_generator.check_token(user, token_key):
                return Response(
                    {"detail": "Token non valido o scaduto."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set new password securely
            user.set_password(password)
            user.must_change_password = False
            user.save(update_fields=["password", "must_change_password"])

            # Invalidate old tokens and create new one
            Token.objects.filter(user=user).delete()
            new_token = Token.objects.create(user=user)

            return Response({
                "message": "Password reimpostata con successo.",
                "token": new_token.key,
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        except (ValueError, User.DoesNotExist):
            return Response(
                {"detail": "Token non valido."},
                status=status.HTTP_400_BAD_REQUEST
            )


class EmailVerifyView(APIView):
    """
    Verify user email with token.
    
    Called when user clicks verification link in email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]

        try:
            uidb64, token_key = token.split("-")
            from django.utils.encoding import force_str
            from django.utils.http import urlsafe_base64_decode
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            # Verify token
            from django.contrib.auth.tokens import default_token_generator
            if not default_token_generator.check_token(user, token_key):
                return Response(
                    {"detail": "Token non valido o scaduto."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Mark email as verified
            if not user.email_verified:
                user.email_verified = True
                user.save(update_fields=["email_verified"])

            return Response({
                "message": "Email verificata con successo!",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        except (ValueError, User.DoesNotExist):
            return Response(
                {"detail": "Token non valido."},
                status=status.HTTP_400_BAD_REQUEST
            )


class ResendVerificationEmailView(APIView):
    """
    Resend email verification link.
    
    Allows authenticated users to request a new verification email
    if they didn't receive the first one.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.email_verified:
            return Response(
                {"detail": "Email giÃ  verificata."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate new token
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes, force_str
        from django.utils.http import urlsafe_base64_encode
        from django.core.mail import send_mail
        from django.conf import settings

        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        verify_link = f"{getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:3000')}/verify-email?token={uidb64}-{token}"

        # Send HTML email using email_utils (fails silently in development)
        send_verification_email(user)

        return Response(
            {"message": "Email di verifica inviata.", "email": user.email},
            status=status.HTTP_200_OK
        )


# ============================================================
# NOTIFICATION VIEW SET
# ============================================================

class NotificationViewSet(viewsets.ModelViewSet):
    """
    Manage user notifications.
    
    Read-only list of user's notifications with actions to mark as read.
    Users can only see their own notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return only the current user's notifications"""
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'ok'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all unread notifications as read"""
        self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'status': 'ok'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})


# ============================================================
# ATTENDANCE WORKFLOW ASSISTANT VIEW
# ============================================================

class AttendanceWorkflowAssistantView(APIView):
    """
    Operational assistant for attendance workflow.
    
    Provides contextual information about attendance status
    and suggests actions based on current state.
    
    Returns:
    - Current period status (open, in_review, approved)
    - Counts: pending days, approved days, anomaly days
    - Priority alerts and action suggestions
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]

    def get(self, request):
        serializer = AttendanceOverviewQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        company = resolve_company_for_request(
            request,
            company_id=serializer.validated_data.get("company_id"),
            allow_assigned=True,
        )
        if not company:
            return Response({"detail": "Tenant non disponibile."}, status=status.HTTP_404_NOT_FOUND)

        month, year = parse_month_year(serializer)
        
        # Get daily review rows for analysis
        users_queryset = User.objects.filter(company=company, role=User.RoleChoices.EMPLOYEE, is_active=True).order_by("first_name", "last_name", "email")
        rows = get_daily_review_rows(company=company, users_queryset=list(users_queryset), month=month, year=year, status_filter=None, anomaly_filter=None)

        # Count different statuses
        anomaly_days = sum(1 for row in rows if row.get("anomalies"))
        pending_days = sum(1 for row in rows if row.get("review_status") in {"draft", "in_review"})
        approved_days = sum(1 for row in rows if row.get("review_status") == "approved")

        # Get period status
        period = AttendancePeriod.objects.filter(company=company, month=month, year=year).first()
        period_status = period.status if period else AttendancePeriod.StatusChoices.OPEN

        # Generate priority alerts
        priorities = []
        if pending_days:
            priorities.append(f"{pending_days} giornate attendono revisione o approvazione.")
        if anomaly_days:
            priorities.append(f"{anomaly_days} giornate hanno anomalie che possono bloccare il payroll.")
        if not priorities:
            priorities.append("Le presenze del periodo sono ordinate e pronte per il passaggio successivo.")

        # Different messaging for consultants vs company users
        if request.user.is_consultant:
            headline = "Stato presenze per il consulente"
            summary = "Il consulente legge se il periodo è pronto per il payroll, senza modificare le approvazioni aziendali."
        else:
            headline = "Cosa deve fare l'azienda"
            summary = "Completa la revisione delle presenze per sbloccare la lavorazione payroll del consulente."

        return Response({
            "headline": headline,
            "summary": summary,
            "company_id": str(company.id),
            "company_name": company.name,
            "month": month,
            "year": year,
            "period_status": period_status,
            "counts": {
                "pending_days": pending_days,
                "approved_days": approved_days,
                "anomaly_days": anomaly_days,
                "total_rows": len(rows)
            },
            "priorities": priorities,
        }, status=status.HTTP_200_OK)


# ============================================================
# ONBOARDING VIEWS
# ============================================================

class OnboardingProgressView(APIView):
    """
    API for managing user onboarding progress.
    
    Tracks and manages the onboarding journey for new users,
    creating initial tasks based on their role.
    """
    
    def get(self, request):
        """Get current onboarding progress."""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        role = self._get_role(request.user)
        progress, created = OnboardingProgress.objects.get_or_create(
            user=request.user,
            role=role,
            defaults={'company': getattr(request.user, 'company', None)}
        )
        
        if created:
            # Create initial tasks on first access
            self._create_initial_tasks(request.user, role)
        
        serializer = OnboardingProgressSerializer(progress)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update current step or mark step as completed."""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        role = self._get_role(request.user)
        step_name = request.data.get('step_name')
        current_step = request.data.get('current_step')
        
        try:
            progress = OnboardingProgress.objects.get(user=request.user, role=role)
        except OnboardingProgress.DoesNotExist:
            return Response({'error': 'Progress not found'}, status=404)
        
        if step_name:
            progress.complete_step(step_name)
        
        if current_step:
            progress.current_step = current_step
            progress.save()
        
        serializer = OnboardingProgressSerializer(progress)
        return Response(serializer.data)
    
    def _get_role(self, user):
        """Map user role to onboarding role."""
        role_map = {
            'company_admin': 'company',
            'company_owner': 'company',
            'labor_consultant': 'consultant',
            'safety_consultant': 'consultant',
            'employee': 'employee',
        }
        return role_map.get(user.role, 'company')
    
    def _create_initial_tasks(self, user, role):
        """Create initial onboarding tasks based on role."""
        task_templates = {
            'company': [
                {'title': 'Completa il tuo profilo', 'description': 'Aggiungi informazioni sulla tua azienda', 'action_url': '/company/settings', 'order': 1},
                {'title': 'Aggiungi il primo dipendente', 'description': 'Inizia aggiungendo i tuoi collaboratori', 'action_url': '/company/users/new', 'order': 2},
                {'title': 'Collega un consulente', 'description': 'Invita il tuo consulente del lavoro', 'action_url': '/company/consultants', 'order': 3},
            ],
            'consultant': [
                {'title': 'Completa il tuo profilo', 'description': 'Aggiungi le informazioni dello studio', 'action_url': '/settings', 'order': 1},
                {'title': 'Collega un\'azienda', 'description': 'Connettiti con un\'azienda cliente', 'action_url': '/consultant/companies', 'order': 2},
            ],
            'employee': [
                {'title': 'Completa il tuo profilo', 'description': 'Aggiungi le tue informazioni', 'action_url': '/settings', 'order': 1},
                {'title': 'Effettua la prima timbratura', 'description': 'Registra il tuo ingresso', 'action_url': '/attendance', 'order': 2},
            ],
        }
        
        for template in task_templates.get(role, []):
            OnboardingTask.objects.create(user=user, **template)


# ============================================================
# COMPANY ADMIN CREATION VIEWS
# ============================================================

class CompanyAdminCreateView(APIView):
    """
    Create a new company admin user.
    
    Access: company_owner or super_admin only.
    
    Request:
        POST with admin user data
        
    Response:
        { "user": { id, email, role, ... }, "message": "..." }
    """
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedAndTenantActive]
    
    def post(self, request):
        # Check permissions: only company_owner or super_admin can create admins
        if not request.user.is_company_owner and not request.user.is_platform_admin:
            return Response(
                {'error': 'Permission denied', 'detail': 'Solo il proprietario aziendale può creare admin.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get company from current user
        company = request.user.company
        if not company:
            return Response(
                {'error': 'Company not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the company admin
        try:
            payload = {
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'role': User.RoleChoices.COMPANY_ADMIN,
            }
            user, temporary_password = create_company_user(
                actor=request.user,
                company=company,
                payload=payload
            )
            
            return Response({
                'message': 'Admin azienda creato con successo.',
                'user': UserSerializer(user).data,
                'company_id': company.id,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )