# Import secrets module for generating secure random tokens (e.g., temporary passwords)
import secrets
# Import calendar module for working with month ranges (e.g., getting last day of month)
from calendar import monthrange
# Import datetime classes for date/time manipulation
from datetime import date, datetime, timedelta

# Import Django settings for accessing configuration (e.g., FRONTEND_URL, DEFAULT_FROM_EMAIL)
from django.conf import settings
# Import token generator for email verification and password reset tokens
from django.contrib.auth.tokens import default_token_generator
# Import Django's send_mail function for sending emails
from django.core.mail import send_mail
# Import encoding utilities for converting user primary key to URL-safe base64
from django.utils.encoding import force_bytes
# Import URL-safe base64 encoding function for email verification links
from django.utils.http import urlsafe_base64_encode
# Import transaction decorator for atomic database operations (all-or-nothing)
from django.db import transaction
# Import Q objects for complex database queries (OR, AND conditions)
from django.db.models import Q
# Import Django timezone utilities for timezone-aware datetime operations
from django.utils import timezone
# Import slugify function to create URL-friendly strings from names
from django.utils.text import slugify

# Import all model classes from the current app's models.py
from .models import (
    # Model for tracking attendance corrections made by admins
    AttendanceCorrection,
    # Model for daily attendance review/approval status
    AttendanceDayReview,
    # Model for monthly attendance period tracking
    AttendancePeriod,
    # Model for audit logging of all system actions
    AuditLog,
    # Model for company/tenant entity
    Company,
    # Model for company-specific role definitions
    CompanyRole,
    # Model for linking consultants to companies they work with
    ConsultantCompanyLink,
    # Model for organizational department
    Department,
    # Model for employee profile (extends User with employee-specific data)
    EmployeeProfile,
    # Model for user notifications
    Notification,
    # Model for office/work location
    OfficeLocation,
    # Model for granular system permissions
    Permission,
    # Model for legacy role definitions
    Role,
    # Model for time tracking entries (check-in, check-out, breaks)
    TimeEntry,
    # Model for user accounts
    User,
    # Model for user's access to multiple companies
    UserCompanyAccess,
)


# =============================================================================
# NOTIFICATION SERVICES
# =============================================================================

# Creates a single notification for a specific user and returns the created notification object
# user: The User model instance who will receive the notification
# title: Short title/heading for the notification
# message: Detailed message content of the notification
# notification_type: Type classification (e.g., INFO, WARNING, ERROR) - defaults to INFO
# priority: Priority level (LOW, MEDIUM, HIGH) - defaults to MEDIUM
# action_url: Optional URL to link to when notification is clicked
# metadata: Optional dictionary of additional data to store with the notification
def create_notification(*, user, title, message, notification_type=Notification.TypeChoices.INFO, priority=Notification.PriorityChoices.MEDIUM, action_url="", metadata=None):
    # Return None if no user is provided (guard clause to prevent invalid notifications)
    if not user:
        return None
    # Create and save the notification object in the database
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        # Use empty string if action_url is None (prevent NULL in database)
        action_url=action_url or "",
        # Default to empty dict if metadata is None (prevent NULL in database)
        metadata=metadata or {},
    )


# Creates notifications for multiple users, avoiding duplicates within the batch
# users: Iterable of User objects to notify
# title: Notification title (same for all users)
# message: Notification message (same for all users)
# All other parameters are passed through to create_notification
def notify_users(*, users, title, message, notification_type=Notification.TypeChoices.INFO, priority=Notification.PriorityChoices.MEDIUM, action_url="", metadata=None):
    # List to store all successfully created notifications
    created = []
    # Set to track already-processed user IDs (prevents duplicates in the users iterable)
    seen = set()
    # Iterate through each user in the provided iterable
    for user in users:
        # Skip if user is None or already processed in this batch
        if not user or user.id in seen:
            continue
        # Mark this user ID as processed
        seen.add(user.id)
        # Create notification for this user and add to results list
        created.append(create_notification(user=user, title=title, message=message, notification_type=notification_type, priority=priority, action_url=action_url, metadata=metadata))
    # Return list of all created notifications
    return created


# =============================================================================
# PERMISSION DEFINITIONS
# =============================================================================

# List of all system permissions defining module, action, code, display name, and description
# Format: (module, action, code, name, description)
# Module: Logical grouping of permissions (e.g., 'employees', 'attendance', 'payroll')
# Action: Type of action (view, create, edit, delete, etc.)
# Code: Unique identifier for the permission (used in code checks)
# Name: Human-readable display name
# Description: Detailed explanation of what the permission allows
PERMISSION_DEFINITIONS = [
    # Employee management permissions
    ("employees", "view", "view-employees", "View employees", "Can view employee records."),
    ("employees", "create", "create-employees", "Create employees", "Can create employee records."),
    ("employees", "edit", "edit-employees", "Edit employees", "Can edit employee records."),
    ("employees", "suspend", "suspend-employees", "Suspend employees", "Can suspend and reactivate employees."),
    # Internal company user management permissions
    ("company_users", "view", "view-company-users", "View company users", "Can view internal company users."),
    ("company_users", "create", "create-company-users", "Create company users", "Can create internal company users."),
    ("company_users", "edit", "edit-company-users", "Edit company users", "Can edit internal company users."),
    ("company_users", "reset_password", "reset-user-password", "Reset user password", "Can reset internal user credentials."),
    # Role assignment permissions
    ("roles", "assign", "assign-roles", "Assign roles", "Can assign company roles and permissions."),
    # Document management permissions
    ("documents", "view", "view-documents", "View documents", "Can view documents."),
    ("documents", "upload", "upload-documents", "Upload documents", "Can upload documents."),
    ("documents", "archive", "archive-documents", "Archive documents", "Can archive documents."),
    ("documents", "download_employee", "download-employee-documents", "Download employee documents", "Can download employee-visible documents."),
    # Attendance management permissions
    ("attendance", "view", "view-attendance", "View attendance", "Can view attendance data."),
    ("attendance", "review", "review-attendance", "Review attendance", "Can review daily attendance data."),
    ("attendance", "correct", "correct-attendance", "Correct attendance", "Can manually correct attendance entries."),
    ("attendance", "approve", "approve-attendance", "Approve attendance", "Can approve attendance days and months."),
    # Payroll management permissions
    ("payroll", "view", "view-payroll", "View payroll", "Can view payroll runs."),
    ("payroll", "create", "create-payroll", "Create payroll", "Can create payroll runs."),
    ("payroll", "edit", "edit-payroll", "Edit payroll", "Can edit payroll runs."),
    ("payroll", "approve", "approve-payroll", "Approve payroll", "Can approve payroll runs."),
    ("payroll", "request_correction", "request-payroll-correction", "Request payroll correction", "Can request payroll corrections."),
    ("payroll", "deliver", "deliver-payroll", "Deliver payroll", "Can mark payroll as delivered."),
]


# Default permissions assigned to each user role type
# Maps User.RoleChoices enum values to lists of permission codes
# Each role gets a specific subset of permissions based on their responsibilities
DEFAULT_COMPANY_ROLE_PERMISSIONS = {
    # Company owner has full access to all permissions
    User.RoleChoices.COMPANY_OWNER: [
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
    # Company admin has same permissions as owner
    User.RoleChoices.COMPANY_ADMIN: [
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
    # HR manager has most admin permissions except user suspension and password reset
    User.RoleChoices.HR_MANAGER: [
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
    # Regular manager has limited read-only access
    User.RoleChoices.MANAGER: [
        "view-employees",
        "view-attendance",
        "view-documents",
        "download-employee-documents",
        "view-payroll",
    ],
    # External consultant has minimal read-only access
    User.RoleChoices.EXTERNAL_CONSULTANT: [
        "view-employees",
        "view-attendance",
        "view-documents",
    ],
    # Labor consultant has broader access including document management and payroll
    User.RoleChoices.LABOR_CONSULTANT: [
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
    # Safety consultant has minimal read-only access
    User.RoleChoices.SAFETY_CONSULTANT: [
        "view-employees",
        "view-attendance",
        "view-documents",
    ],
    # Regular employee has minimal access focused on their own data
    User.RoleChoices.EMPLOYEE: [
        "view-documents",
        "download-employee-documents",
        "view-attendance",
        "view-payroll",
    ],
}


# =============================================================================
# AUDIT LOGGING
# =============================================================================

# Creates an audit log entry to track important system actions
# actor: User who performed the action
# company: Company context for the action
# action: Action type from AuditLog.ActionChoices enum
# description: Human-readable description of what happened
# metadata: Optional dictionary of additional context data
def log_audit_event(*, actor, company, action, description, metadata=None):
    # Create and save the audit log entry, return the created object
    return AuditLog.objects.create(
        actor=actor,
        company=company,
        action=action,
        description=description,
        # Default to empty dict if metadata is None
        metadata=metadata or {},
    )


# =============================================================================
# COMPANY UTILITY FUNCTIONS
# =============================================================================

# Generates a unique URL-safe slug for a company based on its name
# Appends incremental numbers if a slug already exists
# base_name: The original company name to base the slug on
# Returns a unique slug string that can be used in URLs
def unique_company_slug(base_name):
    # Convert name to URL-safe slug format (lowercase, hyphens instead of spaces)
    base_slug = slugify(base_name) or "company"
    # Start with the base slug
    slug = base_slug
    # Start incrementing from 2 (e.g., company-2, company-3)
    index = 2

    # Keep incrementing until we find a slug that doesn't exist in database
    while Company.objects.filter(slug=slug).exists():
        # Append dash and number to create unique slug
        slug = f"{base_slug}-{index}"
        # Increment the counter for next iteration
        index += 1

    # Return the unique slug
    return slug


# =============================================================================
# DATE/MONTH UTILITY FUNCTIONS
# =============================================================================

# Adds a specified number of months to a date, handling year overflow correctly
# For example: adding 1 month to Jan 31 returns Feb 28 (or Feb 29 in leap years)
# value: The date object to add months to
# months: Number of months to add (can be negative)
# Returns a new date object with the months added
def add_months(value, months):
    # Convert month to 0-indexed for easier arithmetic (0=Jan, 11=Dec)
    month = value.month - 1 + months
    # Calculate the new year (integer division handles overflow)
    year = value.year + month // 12
    # Convert back to 1-indexed month
    month = month % 12 + 1
    # Ensure day doesn't exceed the number of days in the target month
    # monthrange(year, month)[1] returns the last day of that month
    day = min(value.day, monthrange(year, month)[1])
    # Create new date with the calculated year, month, and adjusted day
    return value.replace(year=year, month=month, day=day)


# Calculates the subscription end date based on the billing cycle
# billing_cycle: Either YEARLY or MONTHLY from Company.BillingCycleChoices
# Returns the date when the subscription should end
def compute_subscription_end_date(*, billing_cycle):
    # Get current date in the active timezone
    today = timezone.localdate()
    # Check if billing is yearly
    if billing_cycle == Company.BillingCycleChoices.YEARLY:
        try:
            # Simply add 1 year to today's date
            return today.replace(year=today.year + 1)
        except ValueError:
            # Handle edge case: Feb 29 in a non-leap year -> Feb 28
            return today.replace(month=2, day=28, year=today.year + 1)
    # For monthly billing, add 1 month using the add_months helper
    return add_months(today, 1)


# =============================================================================
# EMAIL VERIFICATION
# =============================================================================

# Builds the email verification URL for a user
# user: The User model instance to generate link for
# Returns a complete URL string that can be sent to the user
def build_email_verification_link(user):
    # Encode user's primary key to URL-safe base64
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    # Generate a time-limited token valid for this specific user
    token = default_token_generator.make_token(user)
    # Get the frontend base URL from settings, fallback to default
    frontend_base = getattr(settings, "FRONTEND_URL", "https://pulsehr.app")
    # Construct and return the full verification URL with token
    return f"{frontend_base}/verify-email?token={uidb64}-{token}"


# =============================================================================
# ACCOUNT ONBOARDING EMAILS
# =============================================================================

# Sends an onboarding email to a newly created account
# recipient: User model instance who will receive the email
# temporary_password: The initial password for the account
# company: Optional Company instance for workspace accounts
# account_kind: Type of account ('workspace' or 'aziendale' or 'consulente')
def send_account_onboarding_email(*, recipient, temporary_password, company=None, account_kind="workspace"):
    # Generate the email verification link for this user
    verify_link = build_email_verification_link(recipient)
    # Use company name if provided, otherwise use default app name
    workspace_name = company.name if company else "PulseHR"
    # Email subject line (in Italian)
    subject = f"PulseHR - accesso al tuo account"
    # Build the email message body with account details
    message = (
        f"Ciao {recipient.first_name or recipient.email},\n\n"
        f"Il tuo account {account_kind} per {workspace_name} è pronto.\n"
        f"Email di accesso: {recipient.email}\n"
        f"Password temporanea: {temporary_password}\n\n"
        f"Verifica email: {verify_link}\n\n"
        f"Al primo accesso dovrai cambiare password.\n\n"
        f"Team PulseHR"
    )
    # Send the email using Django's send_mail function
    send_mail(
        subject=subject,
        message=message,
        # Get sender email from settings
        from_email=settings.DEFAULT_FROM_EMAIL,
        # Send to the recipient's email address
        recipient_list=[recipient.email],
        # Raise exception if email fails (set to False for silent failures)
        fail_silently=False,
    )


# Sends a temporary password email for company account access reset
# company: Company instance for context in the email
# recipient: Userwho will receive the temporary password
# temporary_password: The generated temporary password
def send_temporary_password_email(*, company, recipient, temporary_password):
    # Reuse the onboarding email template with company-specific account kind
    send_account_onboarding_email(
        recipient=recipient,
        temporary_password=temporary_password,
        company=company,
        account_kind="aziendale",
    )


# =============================================================================
# PERMISSION AND ROLE SETUP
# =============================================================================

# Ensures all system permissions exist in the database (idempotent operation)
# Creates any missing permissions based on PERMISSION_DEFINITIONS
# Uses @transaction.atomic to ensure all-or-nothing database consistency
# Returns list of all Permission objects
@transaction.atomic
def ensure_system_permissions():
    # Initialize empty list to collect permission objects
    permissions = []
    # Iterate through all permission definitions
    for module, action, code, name, description in PERMISSION_DEFINITIONS:
        # get_or_create returns (object, created_boolean) tuple
        # Creates with defaults if doesn't exist, fetches if exists
        permission, _ = Permission.objects.get_or_create(
            code=code,
            defaults={
                "module": module,
                "action": action,
                "name": name,
                "description": description,
                # Mark as system permission (cannot be deleted)
                "is_system": True,
            },
        )
        # Add the permission object to our list
        permissions.append(permission)
    # Return all permission objects
    return permissions


# Ensures all default company roles exist with proper permissions
# Creates roles for each role type if they don't exist
# Syncs permissions based on DEFAULT_COMPANY_ROLE_PERMISSIONS
# company: The Company instance to create roles for
# Returns dict mapping role_code to CompanyRole object
@transaction.atomic
def ensure_company_roles(company):
    # First ensure all system permissions exist
    ensure_system_permissions()
    # Build a dictionary mapping permission codes to Permission objects
    # This allows O(1) lookup when assigning permissions to roles
    permissions_by_code = {
        permission.code: permission
        for permission in Permission.objects.all()
    }
    # Dictionary to store created roles
    roles = {}

    # Iterate through each role type and its associated permissions
    for role_code, permission_codes in DEFAULT_COMPANY_ROLE_PERMISSIONS.items():
        # Create or get the role for this company
        role, _ = CompanyRole.objects.get_or_create(
            company=company,
            # Convert underscores to hyphens for role code (e.g., "company_owner" -> "company-owner")
            code=role_code.replace("_", "-"),
            defaults={
                # Convert underscores to spaces and title-case (e.g., "company_owner" -> "Company Owner")
                "name": role_code.replace("_", " ").title(),
                # Generate descriptive text for the role
                "description": f"Default {role_code.replace('_', ' ')} role for {company.name}.",
                # Mark as system role
                "is_system": True,
                # Ensure role is active by default
                "is_active": True,
            },
        )
        # Set the permissions for this role using the permission objects
        # Filter out any codes that don't have corresponding Permission objects
        role.permissions.set(
            [permissions_by_code[code] for code in permission_codes if code in permissions_by_code]
        )
        # Store in roles dictionary for return value
        roles[role_code] = role

    # Return dictionary of created roles
    return roles


# Gets the default CompanyRole for a given company and user role type
# company: The Company instance
# user_role: The User.RoleChoices enum value
# Returns the matching CompanyRole object or falls back to COMPANY_ADMIN
def get_default_company_role(*, company, user_role):
    # Ensure company roles exist first
    roles = ensure_company_roles(company)
    # Try to get the role matching user_role, fallback to COMPANY_ADMIN
    return roles.get(user_role) or roles.get(User.RoleChoices.COMPANY_ADMIN)


# Syncs the user-company access record with the assigned company role
# user: User instance to sync
# company_role: CompanyRole instance to assign
def sync_user_company_access(*, user, company_role):
    # Get the legacy role object for backwards compatibility
    legacy_role = Role.objects.filter(code="company-admin").first()
    # Consultants get LIMITED access scope, regular users get FULL access
    access_scope = (
        UserCompanyAccess.AccessScopeChoices.LIMITED
        if user.is_consultant
        else UserCompanyAccess.AccessScopeChoices.FULL
    )

    # Update or create the access record for this user-company pair
    UserCompanyAccess.objects.update_or_create(
        user=user,
        # Use user's primary company
        company=user.company,
        defaults={
            # Assign legacy role for backwards compatibility
            "role": legacy_role,
            # Assign the new company role
            "company_role": company_role,
            # Mark as primary access (for users with single company)
            "is_primary": True,
            # Sync active status with user status
            "is_active": user.is_active,
            # Set appropriate access scope
            "access_scope": access_scope,
        },
    )


# =============================================================================
# COMPANY CREATION WITH ADMIN
# =============================================================================

# Creates a new company along with its primary admin user account
# All operations are atomic (transaction.atomic) to ensure consistency
# actor: User performing the creation (for audit logging)
# company_data: Dict containing company fields (name, vat_number, etc.)
# admin_data: Dict containing admin user fields (email, password, etc.)
# source: Source of creation ('registration' or 'manual')
# Returns tuple of (Company, User) objects
@transaction.atomic
def create_company_with_admin(*, actor, company_data, admin_data, source="manual"):
    """
    Creates company and associated admin user.

    Flow:
    1. Validate payload (done by serializer)
    2. Create Company
    3. Create admin User with company_owner role
    4. Associate user with company
    5. Save password with set_password() (NOT plaintext!)

    Args:
        payload: dict with company + admin fields

    Returns:
        tuple: (Company, User) newly created
    """

    # Generate slug from name if not provided, or use unique slug generator
    slug = company_data.get("slug") or unique_company_slug(company_data["name"])
    # Get billing cycle from data or default to monthly
    billing_cycle = company_data.get("billing_cycle", Company.BillingCycleChoices.MONTHLY)
    # Create and save the Company object with all provided fields
    company = Company.objects.create(
        name=company_data["name"],
        # Use provided legal name or empty string
        legal_name=company_data.get("legal_name", ""),
        slug=slug,
        # VAT/tax ID number
        vat_number=company_data.get("vat_number", ""),
        # Primary contact email
        contact_email=company_data.get("contact_email", ""),
        # Primary contact phone
        contact_phone=company_data.get("contact_phone", ""),
        # Company website URL
        website=company_data.get("website", ""),
        # ISO country code (e.g., 'IT', 'US')
        country_code=company_data.get("country_code", ""),
        # City name
        city=company_data.get("city", ""),
        # State or region name
        state_region=company_data.get("state_region", ""),
        # Postal/ZIP code
        postal_code=company_data.get("postal_code", ""),
        # Primary address line
        address_line_1=company_data.get("address_line_1", ""),
        # Secondary address line (apt, suite, etc.)
        address_line_2=company_data.get("address_line_2", ""),
        # Company status (TRIAL, ACTIVE, SUSPENDED, etc.)
        status=company_data.get("status", Company.StatusChoices.TRIAL),
        # Subscription plan identifier
        plan=company_data.get("plan", ""),
        # Billing cycle (MONTHLY or YEARLY)
        billing_cycle=billing_cycle,
        # Calculate subscription end date based on billing cycle
        # Use provided date or compute from today
        subscription_end_date=company_data.get("subscription_end_date") or compute_subscription_end_date(billing_cycle=billing_cycle),
        # Maximum number of employees allowed (default 50)
        max_employees=company_data.get("max_employees", 50),
    )

    # Get the default company role for company owner
    company_role = get_default_company_role(company=company, user_role=User.RoleChoices.COMPANY_OWNER)

    # Check if password is provided (user-entered) or needs to be generated
    user_password = admin_data.get("password")
    if user_password:
        # User provided password - use it directly (already hashed by serializer)
        company_admin = User.objects.create_user(
            email=admin_data["email"],
            password=user_password,
            first_name=admin_data.get("first_name", ""),
            last_name=admin_data.get("last_name", ""),
            role=User.RoleChoices.COMPANY_OWNER,
            company=company,
            company_role=company_role,
            # User already set password, no need to force change
            must_change_password=False,
            email_verified=False,
        )
    else:
        # No password provided - generate temporary password
        # Generate a secure random URL-safe token (12 characters)
        temporary_password = secrets.token_urlsafe(12)
        company_admin = User.objects.create_user(
            email=admin_data["email"],
            password=temporary_password,
            first_name=admin_data.get("first_name", ""),
            last_name=admin_data.get("last_name", ""),
            role=User.RoleChoices.COMPANY_OWNER,
            company=company,
            company_role=company_role,
            # User must change temp password on first login
            must_change_password=True,
            email_verified=False,
        )
        # Send email with temporary password
        send_temporary_password_email(company=company, recipient=company_admin, temporary_password=temporary_password)

    # Sync the user's company access record
    sync_user_company_access(user=company_admin, company_role=company_role)

    # Determine audit action based on source (registration flow vs manual creation)
    audit_action = AuditLog.ActionChoices.COMPANY_REGISTERED if source == "registration" else AuditLog.ActionChoices.COMPANY_CREATED
    # Log the company creation event
    log_audit_event(
        actor=actor,
        company=company,
        action=audit_action,
        description=f"Company {company.name} created with primary admin {company_admin.email}.",
        metadata={
            "company_id": str(company.id),
            "company_admin_id": str(company_admin.id),
            "company_admin_email": company_admin.email,
            "status": company.status,
            "plan": company.plan,
            "source": source,
        },
    )

    # Return only company and admin (no temporary password in response)
    return company, company_admin


# Gets the primary admin user for a company (oldest owner or admin)
# company: The Company instance to find admin for
# Returns the primary admin User object or None
def get_primary_company_admin(company):
    return (
        # Filter users with owner or admin roles
        company.users.filter(role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN])
        # Order by join date to get the first/oldest admin
        .order_by("date_joined")
        # Get the first result
        .first()
    )


# Resets company admin access (generates new temporary password)
# actor: User performing the reset (for audit)
# company: Company whose admin access is being reset
# Returns tuple of (User, temporary_password)
@transaction.atomic
def reset_company_admin_access(*, actor, company):
    # Find the primary admin for this company
    company_admin = get_primary_company_admin(company)
    # Raise error if no admin found
    if not company_admin:
        raise ValueError("Primary company admin not found.")

    # Generate a new secure temporary password
    temporary_password = secrets.token_urlsafe(12)
    # Set the new password (properly hashed)
    company_admin.set_password(temporary_password)
    # Force user to change password on next login
    company_admin.must_change_password = True
    # Save only these fields (performance optimization)
    company_admin.save(update_fields=["password", "must_change_password"])

    # Log the access reset event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.COMPANY_ACCESS_RESET,
        description=f"Access reset generated for {company_admin.email}.",
        metadata={
            "company_id": str(company.id),
            "company_admin_id": str(company_admin.id),
            "company_admin_email": company_admin.email,
        },
    )
    # Log the password reset event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.PASSWORD_RESET,
        description=f"Password reset generated for {company_admin.email}.",
        metadata={"user_id": str(company_admin.id), "email": company_admin.email},
    )
    # Send email with the new temporary password
    send_temporary_password_email(company=company, recipient=company_admin, temporary_password=temporary_password)

    # Return the admin user and temp password (caller handles sending)
    return company_admin, temporary_password


# =============================================================================
# CONSULTANT ACCOUNT MANAGEMENT
# =============================================================================

# Creates a consultant (non-company) user account
# actor: User performing the creation (for audit)
# payload: Dict containing user fields (email, role, password, etc.)
# Returns the created User object
@transaction.atomic
def create_consultant_account(*, actor, payload):
    # Check if password is provided (user-entered) or needs to be generated
    user_password = payload.get("password")

    if user_password:
        # User provided password - use it directly
        user = User.objects.create_user(
            email=payload["email"],
            password=user_password,
            first_name=payload.get("first_name", ""),
            last_name=payload.get("last_name", ""),
            role=payload["role"],
            # Consultants don't belong to a company initially
            company=None,
            company_role=None,
            # User already set password, no need to force change
            must_change_password=False,
            email_verified=False,
            is_active=True,
        )
    else:
        # No password provided - generate temporary password
        temporary_password = secrets.token_urlsafe(12)
        user = User.objects.create_user(
            email=payload["email"],
            password=temporary_password,
            first_name=payload.get("first_name", ""),
            last_name=payload.get("last_name", ""),
            role=payload["role"],
            company=None,
            company_role=None,
            # User must change temp password on first login
            must_change_password=True,
            email_verified=False,
            is_active=True,
        )
        # Send onboarding email with temporary password
        send_account_onboarding_email(
            recipient=user,
            temporary_password=temporary_password,
            company=None,
            account_kind="consulente",
        )

    # Log the consultant account creation
    log_audit_event(
        actor=actor,
        company=None,
        action=AuditLog.ActionChoices.INVITE_GENERATED,
        description=f"Consultant account {user.email} created.",
        metadata={"user_id": str(user.id), "email": user.email, "role": user.role},
    )

    # Return only user (no temporary password in response)
    return user


# Gets the appropriate default company role for a consultant type
# company: Company instance to get role for
# consultant: User instance of the consultant
# Returns the matching CompanyRole object
def get_consultant_default_company_role(*, company, consultant):
    # Determine the target role based on consultant's role
    # Map consultant types to their default company role
    target_role = consultant.role if consultant.role in {
        User.RoleChoices.EXTERNAL_CONSULTANT,
        User.RoleChoices.LABOR_CONSULTANT,
        User.RoleChoices.SAFETY_CONSULTANT,
    } else User.RoleChoices.EXTERNAL_CONSULTANT
    # Get the default company role for this target role
    return get_default_company_role(company=company, user_role=target_role)


# Syncs consultant's access to a company (creates or updates access record)
# consultant: User instance of the consultant
# company: Company instance to link to
# active: Boolean indicating if access should be active
def sync_consultant_company_access(*, consultant, company, active):
    # Get the appropriate role for this consultant type
    company_role = get_consultant_default_company_role(company=company, consultant=consultant)
    # Update or create the access record
    UserCompanyAccess.objects.update_or_create(
        user=consultant,
        company=company,
        defaults={
            # Legacy role for backwards compatibility
            "role": Role.objects.filter(code="company-admin").first(),
            # New company role
            "company_role": company_role,
            # Consultants get read-only access by default
            "access_scope": UserCompanyAccess.AccessScopeChoices.READ_ONLY,
            # Not primary (consultants work with multiple companies)
            "is_primary": False,
            # Sync active status with the active parameter
            "is_active": active,
        },
    )


# =============================================================================
# CONSULTANT-COMPANY LINK REQUEST FLOW
# =============================================================================

# Initiates a consultant link request using company's public ID
# actor: Consultant user initiating the request
# public_id: Company's unique public identifier
# Returns the created/updated ConsultantCompanyLink object
@transaction.atomic
def request_consultant_company_link_by_public_id(*, actor, public_id):
    # Look up the company by public_id (not primary key)
    company = Company.objects.filter(public_id=public_id, is_deleted=False).first()
    # Raise error if company not found
    if not company:
        raise ValueError("Company ID non trovato.")
    # Ensure only consultants can make this request
    if not actor.is_consultant:
        raise ValueError("Solo un consulente puo' avviare questa richiesta.")

    # Create or get existing link record
    link, created = ConsultantCompanyLink.objects.get_or_create(
        consultant=actor,
        company=company,
        defaults={
            # Initial status: waiting for company approval
            "status": ConsultantCompanyLink.StatusChoices.PENDING_COMPANY,
            # Track who initiated the request
            "requested_by": ConsultantCompanyLink.RequestedByChoices.CONSULTANT,
            "active": True,
        },
    )
    # If link already exists and is active/approved, raise error
    if not created and link.status == ConsultantCompanyLink.StatusChoices.APPROVED and link.active:
        raise ValueError("Il collegamento con questa azienda e' gia' attivo.")

    # If updating existing link (not newly created)
    if not created:
        # Reset to pending state
        link.status = ConsultantCompanyLink.StatusChoices.PENDING_COMPANY
        link.requested_by = ConsultantCompanyLink.RequestedByChoices.CONSULTANT
        link.active = True
        # Clear any previous approval timestamp
        link.approved_at = None
        # Save only the changed fields
        link.save(update_fields=["status", "requested_by", "active", "approved_at"])

    # Log the link request event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.CONSULTANT_LINK_REQUESTED,
        description=f"Consultant {actor.email} requested access to {company.name}.",
        metadata={
            "consultant_id": str(actor.id),
            "company_id": str(company.id),
            "requested_by": ConsultantCompanyLink.RequestedByChoices.CONSULTANT,
            "status": link.status,
        },
    )
    return link


# Initiates a consultant link request using consultant's email address
# actor: Company user initiating the request
# consultant_email: Email of the consultant to link
# Returns the created/updated ConsultantCompanyLink object
@transaction.atomic
def request_consultant_company_link_by_email(*, actor, consultant_email):
    # Look up the consultant user by email and role
    consultant = User.objects.filter(
        email=consultant_email,
        # Only find actual consultant roles
        role__in=[
            User.RoleChoices.EXTERNAL_CONSULTANT,
            User.RoleChoices.LABOR_CONSULTANT,
            User.RoleChoices.SAFETY_CONSULTANT,
        ],
    ).first()
    # Raise error if consultant not found
    if not consultant:
        raise ValueError("Consulente non trovato.")
    # Ensure actor has a company context
    if not actor.company:
        raise ValueError("Tenant non disponibile.")

    # Create or get existing link record
    link, created = ConsultantCompanyLink.objects.get_or_create(
        consultant=consultant,
        company=actor.company,
        defaults={
            # Initial status: waiting for consultant acceptance
            "status": ConsultantCompanyLink.StatusChoices.PENDING_CONSULTANT,
            "requested_by": ConsultantCompanyLink.RequestedByChoices.COMPANY,
            "active": True,
        },
    )
    # If link already exists and is active/approved, raise error
    if not created and link.status == ConsultantCompanyLink.StatusChoices.APPROVED and link.active:
        raise ValueError("Il consulente e' gia' collegato a questa azienda.")

    # If updating existing link
    if not created:
        link.status = ConsultantCompanyLink.StatusChoices.PENDING_CONSULTANT
        link.requested_by = ConsultantCompanyLink.RequestedByChoices.COMPANY
        link.active = True
        link.approved_at = None
        link.save(update_fields=["status", "requested_by", "active", "approved_at"])

    # Log the link request event
    log_audit_event(
        actor=actor,
        company=actor.company,
        action=AuditLog.ActionChoices.CONSULTANT_LINK_REQUESTED,
        description=f"Company {actor.company.name} requested consultant link for {consultant.email}.",
        metadata={
            "consultant_id": str(consultant.id),
            "company_id": str(actor.company.id),
            "requested_by": ConsultantCompanyLink.RequestedByChoices.COMPANY,
            "status": link.status,
        },
    )
    return link


# Checks if the actor user can manage (approve/reject) a consultant-company link
# actor: User attempting to manage the link
# link: ConsultantCompanyLink instance to check
# Returns True if actor can manage, False otherwise
def can_manage_link(*, actor, link):
    # Platform admins can manage any link
    if actor.is_platform_admin:
        return True
    # Consultants can only manage their own pending requests
    if actor.is_consultant and actor.id == link.consultant_id:
        return link.status == ConsultantCompanyLink.StatusChoices.PENDING_CONSULTANT
    # Company users (owner, admin, HR) can manage links for their company
    if actor.company_id == link.company_id and actor.role in {
        User.RoleChoices.COMPANY_OWNER,
        User.RoleChoices.COMPANY_ADMIN,
        User.RoleChoices.HR_MANAGER,
    }:
        return link.status == ConsultantCompanyLink.StatusChoices.PENDING_COMPANY
    # Default: no permission
    return False


# Approves a consultant-company link request
# actor: User approving the link
# link: ConsultantCompanyLink instance to approve
# Returns the updated link object
@transaction.atomic
def approve_consultant_company_link(*, actor, link):
    # Check if actor has permission to approve
    if not can_manage_link(actor=actor, link=link):
        raise ValueError("Non puoi approvare questa richiesta.")
    # Update link status to approved
    link.status = ConsultantCompanyLink.StatusChoices.APPROVED
    link.active = True
    link.approved_at = timezone.now()
    link.save(update_fields=["status", "active", "approved_at"])
    # Sync the consultant's access to the company
    sync_consultant_company_access(consultant=link.consultant, company=link.company, active=True)
    # Log the approval event
    log_audit_event(
        actor=actor,
        company=link.company,
        action=AuditLog.ActionChoices.CONSULTANT_LINK_APPROVED,
        description=f"Consultant link approved for {link.consultant.email} and {link.company.name}.",
        metadata={"link_id": str(link.id), "consultant_id": str(link.consultant_id), "company_id": str(link.company_id)},
    )

    return link


# Rejects a consultant-company link request
# actor: User rejecting the link
# link: ConsultantCompanyLink instance to reject
# Returns the updated link object
@transaction.atomic
def reject_consultant_company_link(*, actor, link):
    # Check if actor has permission to reject
    if not can_manage_link(actor=actor, link=link):
        raise ValueError("Non puoi rifiutare questa richiesta.")
    # Update link status to rejected
    link.status = ConsultantCompanyLink.StatusChoices.REJECTED
    link.active = False
    link.approved_at = None
    link.save(update_fields=["status", "active", "approved_at"])
    # Remove consultant's access to the company
    sync_consultant_company_access(consultant=link.consultant, company=link.company, active=False)
    # Log the rejection event
    log_audit_event(
        actor=actor,
        company=link.company,
        action=AuditLog.ActionChoices.CONSULTANT_LINK_REJECTED,
        description=f"Consultant link rejected for {link.consultant.email} and {link.company.name}.",
        metadata={"link_id": str(link.id), "consultant_id": str(link.consultant_id), "company_id": str(link.company_id)},
    )

    return link


# Removes a consultant-company link (soft disable)
# actor: User removing the link
# link: ConsultantCompanyLink instance to remove
# Returns the updated link object
@transaction.atomic
def remove_consultant_company_link(*, actor, link):
    # Check if actor has permission to remove (platform admin, the consultant themselves, or company users)
    if not (
        actor.is_platform_admin
        or (actor.is_consultant and actor.id == link.consultant_id)
        or (actor.company_id == link.company_id and actor.role in {User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN, User.RoleChoices.HR_MANAGER})
    ):
        raise ValueError("Non puoi rimuovere questo collegamento.")

    # Soft disable the link (set active to False)
    link.active = False
    link.save(update_fields=["active"])
    # Remove consultant's access to the company
    sync_consultant_company_access(consultant=link.consultant, company=link.company, active=False)
    # Log the removal event
    log_audit_event(
        actor=actor,
        company=link.company,
        action=AuditLog.ActionChoices.CONSULTANT_LINK_REMOVED,
        description=f"Consultant link removed for {link.consultant.email} and {link.company.name}.",
        metadata={"link_id": str(link.id), "consultant_id": str(link.consultant_id), "company_id": str(link.company_id)},
    )

    return link


# =============================================================================
# COMPANY USER MANAGEMENT
# =============================================================================

# Creates a new user associated with a company (not an employee)
# actor: User performing the creation (for audit)
# company: Company to associate the user with
# payload: Dict containing user fields
# Returns tuple of (User, temporary_password)
@transaction.atomic
def create_company_user(*, actor, company, payload):
    # Generate a secure temporary password
    temporary_password = secrets.token_urlsafe(12)
    # Get the company role from payload or determine default based on user role
    company_role = payload.get("company_role") or get_default_company_role(company=company, user_role=payload["role"])
    # Create the user object
    user = User.objects.create_user(
        email=payload["email"],
        password=temporary_password,
        first_name=payload.get("first_name", ""),
        last_name=payload.get("last_name", ""),
        role=payload["role"],
        company=company,
        company_role=company_role,
        # User must change temp password on first login
        must_change_password=True,
        # Default to active, can be overridden in payload
        is_active=payload.get("is_active", True),
    )
    # Sync the user's company access
    sync_user_company_access(user=user, company_role=company_role)

    # Log user creation event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.COMPANY_USER_CREATED,
        description=f"Company user {user.email} created.",
        metadata={
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role,
            "company_role_id": str(company_role.id) if company_role else None,
        },
    )
    # Log invite generation event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.INVITE_GENERATED,
        description=f"Invite generated for {user.email}.",
        metadata={"user_id": str(user.id), "email": user.email},
    )
    # Send email with temporary password
    send_temporary_password_email(company=company, recipient=user, temporary_password=temporary_password)
    # Return user and temp password
    return user, temporary_password


# Updates an existing company user
# actor: User performing the update (for audit)
# target_user: User instance to update
# payload: Dict containing fields to update
# Returns the updated user object
@transaction.atomic
def update_company_user(*, actor, target_user, payload):
    # List of scalar fields to update (not relationships)
    for field in ["first_name", "last_name", "role", "is_active"]:
        # Only update if field is present in payload
        if field in payload:
            # Use setattr to dynamically set the attribute
            setattr(target_user, field, payload[field])

    # Handle company_role separately since it's a FK relation
    if "company_role" in payload:
        target_user.company_role = payload["company_role"]

    # Save all changes to the database
    target_user.save()
    # Re-sync company access with potentially new role
    sync_user_company_access(user=target_user, company_role=target_user.company_role)

    # Log the update event
    log_audit_event(
        actor=actor,
        company=target_user.company,
        action=AuditLog.ActionChoices.COMPANY_USER_UPDATED,
        description=f"Company user {target_user.email} updated.",
        metadata={
            "user_id": str(target_user.id),
            "email": target_user.email,
            "role": target_user.role,
            "is_active": target_user.is_active,
            "company_role_id": str(target_user.company_role_id) if target_user.company_role_id else None,
        },
    )

    # If user was deactivated, log the disable event
    if not target_user.is_active:
        log_audit_event(
            actor=actor,
            company=target_user.company,
            action=AuditLog.ActionChoices.COMPANY_USER_DISABLED,
            description=f"Company user {target_user.email} disabled.",
            metadata={"user_id": str(target_user.id), "email": target_user.email},
        )

    # If company role was changed, log the role assignment
    if payload.get("company_role") is not None:
        log_audit_event(
            actor=actor,
            company=target_user.company,
            action=AuditLog.ActionChoices.ROLE_ASSIGNED,
            description=f"Role assigned to {target_user.email}.",
            metadata={
                "user_id": str(target_user.id),
                "email": target_user.email,
                "company_role_id": str(target_user.company_role_id) if target_user.company_role_id else None,
            },
        )

    return target_user


# Resets a company user's password (generates new temporary password)
# actor: User performing the reset (for audit)
# target_user: User whose password is being reset
# Returns tuple of (User, temporary_password)
@transaction.atomic
def reset_company_user_password(*, actor, target_user):
    # Generate a new secure temporary password
    temporary_password = secrets.token_urlsafe(12)
    # Set the new password (properly hashed via set_password)
    target_user.set_password(temporary_password)
    # Force user to change password on next login
    target_user.must_change_password = True
    # Save only these fields (performance optimization)
    target_user.save(update_fields=["password", "must_change_password"])

    # Log the password reset event
    log_audit_event(
        actor=actor,
        company=target_user.company,
        action=AuditLog.ActionChoices.PASSWORD_RESET,
        description=f"Password reset generated for {target_user.email}.",
        metadata={"user_id": str(target_user.id), "email": target_user.email},
    )
    # Send email with temporary password
    send_temporary_password_email(
        company=target_user.company,
        recipient=target_user,
        temporary_password=temporary_password,
    )
    # Return user and temp password
    return target_user, temporary_password


# =============================================================================
# EMPLOYEE PROFILE MANAGEMENT
# =============================================================================

# Generates the next employee code in sequence for a company
# Format: EMP-XXXX where XXXX is a zero-padded number
# company: Company to generate code for
# Returns the next employee code string
def next_employee_code(company):
    # Get the most recently created employee profile for this company
    last_profile = company.employee_profiles.order_by("-created_at").first()
    # If no profiles exist, start with EMP-0001
    if not last_profile:
        return "EMP-0001"
    try:
        # Extract the numeric portion after EMP- and increment
        number = int(last_profile.employee_code.split("-")[-1]) + 1
    except (ValueError, IndexError):
        # If parsing fails, just count existing profiles + 1
        number = company.employee_profiles.count() + 1
    # Return the formatted code (EMP-0001, EMP-0002, etc.)
    return f"EMP-{number:04d}"


# Creates a new employee profile, optionally with a linked user account
# actor: User performing the creation (for audit)
# company: Company to create employee for
# payload: Dict containing employee fields
# Returns the created EmployeeProfile object
@transaction.atomic
def create_employee_profile(*, actor, company, payload):
    # Initialize linked_user as None (may be created below)
    linked_user = None
    # Check if a user account should be created for this employee
    if payload.get("create_user_account"):
        # Get the default company role for regular employees
        company_role = payload.get("company_role") or get_default_company_role(company=company, user_role=User.RoleChoices.EMPLOYEE)
        # Generate temporary password for the user account
        temporary_password = secrets.token_urlsafe(12)
        # Create the linked user account
        linked_user = User.objects.create_user(
            email=payload["user_email"],
            password=temporary_password,
            first_name=payload.get("first_name", ""),
            last_name=payload.get("last_name", ""),
            role=User.RoleChoices.EMPLOYEE,
            company=company,
            company_role=company_role,
            must_change_password=True,
            email_verified=False,
            is_active=True,
        )
        # Sync the user's company access
        sync_user_company_access(user=linked_user, company_role=company_role)
        # Send onboarding email with temporary password
        send_temporary_password_email(company=company, recipient=linked_user, temporary_password=temporary_password)
        # Log the invite generation
        log_audit_event(
            actor=actor,
            company=company,
            action=AuditLog.ActionChoices.INVITE_GENERATED,
            description=f"Invite generated for employee account {linked_user.email}.",
            metadata={"user_id": str(linked_user.id), "email": linked_user.email},
        )

    # Create the employee profile record
    employee = EmployeeProfile.objects.create(
        # Link to user account if created
        user=linked_user,
        company=company,
        # Use provided code or auto-generate next code
        employee_code=payload.get("employee_code") or next_employee_code(company),
        first_name=payload.get("first_name", ""),
        last_name=payload.get("last_name", ""),
        # Email can be provided directly or from user account
        email=payload.get("email") or payload.get("user_email", ""),
        # Default to active status
        status=payload.get("status", EmployeeProfile.StatusChoices.ACTIVE),
        # Foreign key to department (optional)
        department=payload.get("department"),
        # Foreign key to office location (optional)
        office_location=payload.get("office_location"),
        # Foreign key to manager employee (optional)
        manager=payload.get("manager"),
        # Date employee was hired
        hire_date=payload.get("hire_date"),
        # Job title string
        job_title=payload.get("job_title", ""),
        # Contact phone number
        phone=payload.get("phone", ""),
        # Emergency contact information
        emergency_contact=payload.get("emergency_contact", ""),
        # Additional notes
        notes=payload.get("notes", ""),
    )

    # Log the employee creation event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.EMPLOYEE_CREATED,
        description=f"Employee {employee.full_name or employee.employee_code} created.",
        metadata={
            "employee_id": str(employee.id),
            "employee_code": employee.employee_code,
            "linked_user_id": str(linked_user.id) if linked_user else None,
        },
    )
    return employee


# Updates an existing employee profile
# actor: User performing the update (for audit)
# employee: EmployeeProfile instance to update
# payload: Dict containing fields to update
# Returns the updated employee object
@transaction.atomic
def update_employee_profile(*, actor, employee, payload):
    # Store previous status to detect status changes
    previous_status = employee.status

    # List of fields that can be directly updated
    for field in [
        "first_name",
        "last_name",
        "email",
        "employee_code",
        "status",
        "department",
        "office_location",
        "manager",
        "hire_date",
        "job_title",
        "phone",
        "emergency_contact",
        "notes",
    ]:
        # Only update fields present in payload
        if field in payload:
            setattr(employee, field, payload[field])

    # Save all changes to database
    employee.save()

    # If employee has a linked user account, sync relevant fields
    if employee.user:
        employee.user.first_name = employee.first_name
        employee.user.last_name = employee.last_name
        # Deactivate user if employee is suspended
        employee.user.is_active = employee.status == EmployeeProfile.StatusChoices.ACTIVE
        employee.user.save(update_fields=["first_name", "last_name", "is_active"])

    # Log the employee update event
    log_audit_event(
        actor=actor,
        company=employee.company,
        action=AuditLog.ActionChoices.EMPLOYEE_UPDATED,
        description=f"Employee {employee.full_name or employee.employee_code} updated.",
        metadata={"employee_id": str(employee.id), "employee_code": employee.employee_code},
    )

    # Check if status changed
    if previous_status != employee.status:
        # If being suspended
        if employee.status == EmployeeProfile.StatusChoices.SUSPENDED:
            log_audit_event(
                actor=actor,
                company=employee.company,
                action=AuditLog.ActionChoices.EMPLOYEE_SUSPENDED,
                description=f"Employee {employee.full_name or employee.employee_code} suspended.",
                metadata={"employee_id": str(employee.id)},
            )
        # If being reactivated from suspended state
        elif previous_status == EmployeeProfile.StatusChoices.SUSPENDED and employee.status == EmployeeProfile.StatusChoices.ACTIVE:
            log_audit_event(
                actor=actor,
                company=employee.company,
                action=AuditLog.ActionChoices.EMPLOYEE_REACTIVATED,
                description=f"Employee {employee.full_name or employee.employee_code} reactivated.",
                metadata={"employee_id": str(employee.id)},
            )

    return employee


# =============================================================================
# COMPANY BILLING AND STATUS MANAGEMENT
# =============================================================================

# Updates company billing information and recalculates subscription end date
# company: Company instance to update
# plan: New plan identifier
# billing_cycle: New billing cycle (MONTHLY or YEARLY)
# Returns the updated company object
@transaction.atomic
def update_company_billing(*, company, plan, billing_cycle):
    # Update billing fields
    company.plan = plan
    company.billing_cycle = billing_cycle
    # Recalculate subscription end date based on new billing cycle
    company.subscription_end_date = compute_subscription_end_date(billing_cycle=billing_cycle)
    # Save only the billing-related fields
    company.save(update_fields=["plan", "billing_cycle", "subscription_end_date", "updated_at"])
    return company


# Updates company status and logs the change
# actor: User performing the update (for audit)
# company: Company instance to update
# status: New status value
# audit_action: AuditLog action type to record
# description: Human-readable description for audit log
# Returns the updated company object
@transaction.atomic
def update_company_status(*, actor, company, status, audit_action, description):
    # Update status field
    company.status = status
    # Save status and is_active flag
    company.save(update_fields=["status", "is_active", "updated_at"])
    # Log the status change
    log_audit_event(
        actor=actor,
        company=company,
        action=audit_action,
        description=description,
        metadata={"company_id": str(company.id), "status": company.status},
    )

    return company


# Soft deletes a company (marks as deleted, doesn't remove data)
# actor: User performing the deletion (for audit)
# company: Company instance to soft delete
# Returns the updated company object
@transaction.atomic
def soft_delete_company(*, actor, company):
    # Mark as deleted (soft delete flag)
    company.is_deleted = True
    # Set status to cancelled
    company.status = Company.StatusChoices.CANCELLED
    # Record the deletion timestamp
    company.deleted_at = timezone.now()
    # Save all changed fields
    company.save(update_fields=["is_deleted", "status", "deleted_at", "is_active", "updated_at"])
    # Log the soft delete event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.COMPANY_SOFT_DELETED,
        description=f"Company {company.name} soft deleted.",
        metadata={"company_id": str(company.id), "status": company.status},
    )

    return company


# =============================================================================
# ATTENDANCE TIME ENTRY MAPPINGS
# =============================================================================

# Maps user action strings to TimeEntry entry type enums
# Used for translating user requests into database values
TIME_ACTION_TO_ENTRY_TYPE = {
    "check_in": TimeEntry.EntryTypeChoices.CHECK_IN,
    "break_start": TimeEntry.EntryTypeChoices.BREAK_START,
    "break_end": TimeEntry.EntryTypeChoices.BREAK_END,
    "check_out": TimeEntry.EntryTypeChoices.CHECK_OUT,
}


# =============================================================================
# ATTENDANCE DATE/TIME UTILITIES
# =============================================================================

# Gets the start and end datetime boundaries for a given date
# Handles timezone conversion for accurate day boundaries
# target_date: The date to get bounds for
# Returns tuple of (start_of_day, end_of_day) as timezone-aware datetimes
def get_day_bounds(target_date):
    # Get the current timezone from Django settings
    current_timezone = timezone.get_current_timezone()
    # Combine target date with minimum time (00:00:00)
    start_of_day = timezone.make_aware(datetime.combine(target_date, datetime.min.time()), current_timezone)
    # End of day is start of next day
    end_of_day = start_of_day + timedelta(days=1)
    return start_of_day, end_of_day


# Gets the start and end date boundaries for a given month
# year: The year (e.g., 2024)
# month: The month (1-12)
# Returns tuple of (start_date, end_date) as date objects
def get_month_date_range(*, year, month):
    # First day of the month
    start_date = date(year, month, 1)
    # Last day of the month (monthrange returns tuple of (weekday, days_in_month))
    end_date = date(year, month, monthrange(year, month)[1])
    return start_date, end_date


# =============================================================================
# COMPANY ACCESS CONTROL UTILITIES
# =============================================================================

# Gets list of company IDs that a user can access
# Platform admins can access all companies
# Regular users can only access their own company
# Consultants can access companies they're linked to
# user: User instance to get accessible companies for
# Returns list of company ID integers
def get_user_accessible_company_ids(user):
    # Platform admins have access to all companies
    if user.is_platform_admin:
        return list(Company.objects.values_list("id", flat=True))

    # Initialize empty set to collect company IDs
    company_ids = set()
    # Add user's own company if not a consultant
    if user.company_id and not user.is_consultant:
        company_ids.add(user.company_id)

    # Add companies from active access grants (for consultants)
    access_ids = user.company_accesses.filter(is_active=True).values_list("company_id", flat=True)
    company_ids.update(access_ids)
    return list(company_ids)


# Gets queryset of companies accessible to a user
# Includes soft-deleted companies by default
# user: User instance to get companies for
# Returns Company queryset ordered by name
def get_accessible_companies_for_user(user):
    # Platform admins see all non-deleted companies
    if user.is_platform_admin:
        return Company.objects.filter(is_deleted=False).order_by("name")
    # Others see only companies in their access list
    return Company.objects.filter(id__in=get_user_accessible_company_ids(user), is_deleted=False).order_by("name")


# Checks if a user can access a specific company
# user: User instance to check
# company: Company instance to check access for
# Returns True if user can access, False otherwise
def user_can_access_company(*, user, company):
    # Platform admins can access any company
    if user.is_platform_admin:
        return True
    # Check if company ID is in user's accessible companies
    return company.id in get_user_accessible_company_ids(user)


# =============================================================================
# TIME ENTRY QUERIES
# =============================================================================

# Gets all time entries for a specific user on a specific date
# user: User whose entries to retrieve
# target_date: Date to get entries for
# Returns list of TimeEntry objects ordered by timestamp
def get_time_entries_for_day(*, user, target_date):
    # Get day boundaries as timezone-aware datetimes
    start_of_day, end_of_day = get_day_bounds(target_date)
    # Query entries within the day boundary
    return list(
        TimeEntry.objects.filter(user=user, timestamp__gte=start_of_day, timestamp__lt=end_of_day)
        .order_by("timestamp", "created_at")
    )


# =============================================================================
# ATTENDANCE DAY SUMMARY CALCULATION
# =============================================================================

# Calculates attendance summary for a list of time entries
# entries: List of TimeEntry objects for a day
# target_date: Date to calculate summary for (optional, inferred from entries)
# manual_adjusted: Boolean indicating if day was manually adjusted
# Returns dict with state, worked_minutes, break_minutes, anomalies
def calculate_day_summary(entries, *, target_date=None, manual_adjusted=False):
    # Use provided date or infer from first entry, or use today
    target_date = target_date or (
        timezone.localtime(entries[0].timestamp).date() if entries else timezone.localdate()
    )
    # Handle empty entries case
    if not entries:
        summary = {
            "state": "not_started",
            "worked_minutes": 0,
            "break_minutes": 0,
            "first_entry_at": None,
            "last_entry_at": None,
            "anomalies": [],
        }
        # Add manual adjustment flag if applicable
        if manual_adjusted:
            summary["anomalies"].append("manual_adjustment")
        return summary

    # Initialize state tracking variables
    state = "not_started"
    work_started_at = None  # Timestamp when work started
    break_started_at = None  # Timestamp when break started
    worked_minutes = 0
    break_minutes = 0
    anomalies = []  # List of detected anomalies
    current_date = timezone.localdate()
    # Get end of target date
    _, end_of_day = get_day_bounds(target_date)
    # For today, cutoff is now; for past days, cutoff is end of day
    cutoff = timezone.now() if target_date == current_date else end_of_day

    # Process each entry in chronological order
    for entry in entries:
        # Handle check-in entry
        if entry.entry_type == TimeEntry.EntryTypeChoices.CHECK_IN:
            # Detect duplicate check-in
            if state in {"working", "on_break"}:
                anomalies.append("duplicate_entries")
            # Detect invalid sequence (after finishing)
            elif state == "finished":
                anomalies.append("invalid_sequence")
            # Update state to working
            state = "working"
            work_started_at = entry.timestamp
            break_started_at = None
        # Handle break start entry
        elif entry.entry_type == TimeEntry.EntryTypeChoices.BREAK_START:
            # Only valid when working
            if state != "working" or not work_started_at:
                anomalies.append("invalid_sequence")
                continue
            # Accumulate worked time up to break start
            worked_minutes += max(int((entry.timestamp - work_started_at).total_seconds() // 60), 0)
            break_started_at = entry.timestamp
            work_started_at = None
            state = "on_break"
        # Handle break end entry
        elif entry.entry_type == TimeEntry.EntryTypeChoices.BREAK_END:
            # Only valid when on break
            if state != "on_break" or not break_started_at:
                anomalies.append("invalid_sequence")
                continue
            # Accumulate break time
            break_minutes += max(int((entry.timestamp - break_started_at).total_seconds() // 60), 0)
            work_started_at = entry.timestamp
            break_started_at = None
            state = "working"
        # Handle check-out entry
        elif entry.entry_type == TimeEntry.EntryTypeChoices.CHECK_OUT:
            # If was on break, close break and flag anomaly
            if state == "on_break" and break_started_at:
                anomalies.append("break_not_closed")
                break_minutes += max(int((entry.timestamp - break_started_at).total_seconds() // 60), 0)
                break_started_at = None
            # If was working, close work period
            elif state == "working" and work_started_at:
                worked_minutes += max(int((entry.timestamp - work_started_at).total_seconds() // 60), 0)
                work_started_at = None
            else:
                # Invalid sequence
                anomalies.append("invalid_sequence")
                continue
            state = "finished"

    # Handle open work period (no check-out yet)
    if state == "working" and work_started_at:
        # Add time from work start to cutoff
        worked_minutes += max(int((cutoff - work_started_at).total_seconds() // 60), 0)
        # Flag missing check-out for past dates
        if target_date < current_date:
            anomalies.append("missing_check_out")
    # Handle open break period (no break end)
    elif state == "on_break" and break_started_at:
        break_minutes += max(int((cutoff - break_started_at).total_seconds() // 60), 0)
        if target_date < current_date:
            anomalies.append("break_not_closed")

    # Add manual adjustment anomaly if applicable
    if manual_adjusted or any(entry.is_manual for entry in entries):
        anomalies.append("manual_adjustment")

    # Return the calculated summary
    return {
        "state": state,
        "worked_minutes": worked_minutes,
        "break_minutes": break_minutes,
        "first_entry_at": entries[0].timestamp,
        "last_entry_at": entries[-1].timestamp,
        "anomalies": sorted(set(anomalies)),  # Remove duplicates and sort
    }


# =============================================================================
# ATTENDANCE PERIOD MANAGEMENT
# =============================================================================

# Gets or creates an attendance period for a company-month-year
# company: Company instance
# month: Month number (1-12)
# year: Year number
# Returns the AttendancePeriod object
def get_attendance_period(*, company, month, year):
    # get_or_create returns (object, created_boolean)
    period, _ = AttendancePeriod.objects.get_or_create(
        company=company,
        month=month,
        year=year,
        # Default status for new periods
        defaults={"status": AttendancePeriod.StatusChoices.OPEN},
    )
    return period


# Gets or creates a daily attendance review record
# company: Company instance
# user: User whose attendance is being reviewed
# target_date: Date of the review
# Returns tuple of (AttendanceDayReview, created_boolean)
def get_or_create_day_review(*, company, user, target_date):
    return AttendanceDayReview.objects.get_or_create(
        company=company,
        user=user,
        date=target_date,
        defaults={"status": AttendanceDayReview.StatusChoices.DRAFT},
    )


# Determines the review status based on anomalies and current status
# Once approved or corrected, status stays the same (locked)
# anomalies: List of anomaly strings
# stored_status: Current status from database
# Returns the appropriate status value
def get_day_review_status(*, anomalies, stored_status):
    # If already approved or corrected, keep that status
    if stored_status in {
        AttendanceDayReview.StatusChoices.APPROVED,
        AttendanceDayReview.StatusChoices.CORRECTED,
    }:
        return stored_status
    # If there are anomalies, mark as needing review
    return (
        AttendanceDayReview.StatusChoices.REVIEW_NEEDED
        if anomalies
        else AttendanceDayReview.StatusChoices.DRAFT
    )


# Syncs the day review record with current attendance data
# Creates review if doesn't exist, updates anomalies and status
# Returns the updated AttendanceDayReview object
def sync_day_review(*, company, user, target_date, anomalies, review_note=None):
    # Get or create the review record
    review, _ = get_or_create_day_review(company=company, user=user, target_date=target_date)
    # Update anomalies
    review.anomalies = anomalies
    # Recalculate status based on anomalies
    review.status = get_day_review_status(anomalies=anomalies, stored_status=review.status)
    # Update review note if provided
    if review_note is not None:
        review.review_notes = review_note
    # Save changes
    review.save(update_fields=["anomalies", "status", "review_notes", "updated_at"])
    return review


# =============================================================================
# ATTENDANCE EDITING VALIDATION
# =============================================================================

# Validates if a day can be edited based on period and review status
# actor: User attempting to edit
# company: Company context
# user: User whose attendance is being edited
# target_date: Date being edited
# Returns tuple of (period, review) if editable
# Raises ValueError if not editable
def ensure_day_is_editable(*, actor, company, user, target_date):
    # Get the attendance period for this month
    period = get_attendance_period(company=company, month=target_date.month, year=target_date.year)
    # Check if period is closed or exported (only platform admins can edit)
    if period.status in {
        AttendancePeriod.StatusChoices.CLOSED,
        AttendancePeriod.StatusChoices.EXPORTED,
    } and not actor.is_platform_admin:
        raise ValueError("Il mese selezionato e' chiuso e non puo' essere modificato.")

    # Check if day is already approved (requires elevated permissions)
    review = AttendanceDayReview.objects.filter(company=company, user=user, date=target_date).first()
    if (
        review
        and review.status == AttendanceDayReview.StatusChoices.APPROVED
        and actor.role not in {
            User.RoleChoices.SUPER_ADMIN,
            User.RoleChoices.PLATFORM_OWNER,
            User.RoleChoices.COMPANY_OWNER,
        }
    ):
        raise ValueError("La giornata e' gia' approvata e richiede permessi superiori per essere modificata.")

    # Return the period and review for further processing
    return period, review


# Gets all attendance corrections for a user on a specific date
# user: User whose corrections to retrieve
# company: Company context
# target_date: Date to get corrections for
# Returns list of AttendanceCorrection objects
def get_day_corrections(*, user, company, target_date):
    return list(
        AttendanceCorrection.objects.filter(company=company, user=user, date=target_date)
        .select_related("corrected_by", "time_entry")  # Optimize queries
        .order_by("-created_at")  # Most recent first
    )


# =============================================================================
# ATTENDANCE PAYLOAD BUILDER
# =============================================================================

# Builds a complete day attendance payload with entries, corrections, and summary
# user: User whose attendance to build payload for
# company: Company context
# target_date: Date to build payload for
# include_entries: Whether to include time entries list
# include_corrections: Whether to include corrections list
# Returns dict with all attendance data for the day
def build_day_attendance_payload(*, user, company, target_date, include_entries=True, include_corrections=True):
    # Get time entries for the day
    entries = get_time_entries_for_day(user=user, target_date=target_date)
    # Get corrections for the day
    corrections = get_day_corrections(user=user, company=company, target_date=target_date)
    # Calculate the summary, flagging manual adjustment if corrections exist
    summary = calculate_day_summary(
        entries,
        target_date=target_date,
        manual_adjusted=bool(corrections),
    )
    # Sync/update the day review record
    review = sync_day_review(
        company=company,
        user=user,
        target_date=target_date,
        anomalies=summary["anomalies"],
    )
    # Get the month period
    period = get_attendance_period(company=company, month=target_date.month, year=target_date.year)
    # Build and return the complete payload
    return {
        "user": user,
        "company": company,
        "date": str(target_date),
        "state": summary["state"],
        "worked_minutes": summary["worked_minutes"],
        "break_minutes": summary["break_minutes"],
        "first_entry_at": summary["first_entry_at"],
        "last_entry_at": summary["last_entry_at"],
        "anomalies": summary["anomalies"],
        "review_status": review.status,
        "review_notes": review.review_notes,
        "reviewed_at": review.reviewed_at,
        "approved_at": review.approved_at,
        "period_status": period.status,
        "entries": entries if include_entries else [],
        "corrections": corrections if include_corrections else [],
    }


# Gets today's attendance status for a user (convenience wrapper)
# user: User whose today's status to get
# Returns the complete day attendance payload for today
def get_today_status_for_user(user):
    # Build payload for today using user's company
    payload = build_day_attendance_payload(
        user=user,
        company=user.company,
        target_date=timezone.localdate(),
    )
    return payload


# =============================================================================
# TIME ENTRY VALIDATION
# =============================================================================

# Validates if a specific action is allowed based on current state
# user: User attempting the action
# action: Action string ('check_in', 'break_start', 'break_end', 'check_out')
# Returns the current day's summary if valid
# Raises ValueError if action is not allowed
def validate_next_time_entry(*, user, action):
    # Get current day's summary
    summary = get_today_status_for_user(user)
    state = summary["state"]

    # Validate check-in action
    if action == "check_in" and state in {"working", "on_break"}:
        raise ValueError("Hai gia' effettuato il check-in oggi.")
    # Validate break start action (must be working)
    if action == "break_start" and state != "working":
        raise ValueError("Puoi iniziare la pausa solo dopo il check-in.")
    # Validate break end action (must be on break)
    if action == "break_end" and state != "on_break":
        raise ValueError("Non risulti attualmente in pausa.")
    # Validate check-out action (must be working or on break)
    if action == "check_out" and state not in {"working", "on_break"}:
        raise ValueError("Non puoi effettuare il check-out senza un check-in attivo.")

    # Return the summary if all validations pass
    return summary


# =============================================================================
# TIME ENTRY CREATION
# =============================================================================

# Creates a new time entry (check-in, check-out, break start, or break end)
# actor: User performing the action (for audit and tracking)
# user: User whose attendance is being recorded
# company: Company context
# action: Type of action ('check_in', 'check_out', 'break_start', 'break_end')
# note: Optional note for the entry
# source: Where the entry was created ('WEB', 'MOBILE', 'KIOSK')
# Returns the created TimeEntry object
@transaction.atomic
def create_time_entry(*, actor, user, company, action, note="", source=TimeEntry.SourceChoices.WEB):
    # Validate that the day is editable and action is allowed
    ensure_day_is_editable(actor=actor, company=company, user=user, target_date=timezone.localdate())
    validate_next_time_entry(user=user, action=action)
    # Create the time entry record
    entry = TimeEntry.objects.create(
        user=user,
        company=company,
        # Track who created the entry (for audit)
        created_by=actor,
        # Convert action string to entry type enum
        entry_type=TIME_ACTION_TO_ENTRY_TYPE[action],
        note=note,
        source=source,
        # This is not a manual correction entry
        is_manual=False,
    )
    # Trigger payload rebuild to update summary/anomalies
    build_day_attendance_payload(user=user, company=company, target_date=timezone.localdate())
    return entry


# Serializes a user's time entry summary for a target date (convenience wrapper)
# user: User whose entries to serialize
# target_date: Date to get summary for
# Returns the day attendance payload
def serialize_time_entry_summary(*, user, target_date):
    return build_day_attendance_payload(user=user, company=user.company, target_date=target_date)


# Serializes a single TimeEntry object to a simple dict
# entry: TimeEntry model instance
# Returns dict with primitive values (strings, booleans) suitable for JSON
def serialize_time_entry_value(entry):
    return {
        "id": str(entry.id),
        "timestamp": entry.timestamp.isoformat(),
        "entry_type": entry.entry_type,
        "note": entry.note,
        "source": entry.source,
        "is_manual": entry.is_manual,
    }


# =============================================================================
# ATTENDANCE CORRECTION
# =============================================================================

# Creates or modifies a time entry with required reason (manual correction)
# Supports ADD (create new), UPDATE (modify existing), DELETE (remove) actions
# actor: User performing the correction (for audit)
# company: Company context
# target_user: User whose attendance is being corrected
# action_type: Type of correction (ADD, UPDATE, DELETE)
# reason: Mandatory reason for the correction
# target_date: Date being corrected
# entry: Existing TimeEntry to update/delete (for UPDATE/DELETE actions)
# entry_type: Type of new entry (for ADD action)
# timestamp: New timestamp for the entry (for ADD/UPDATE actions)
# note: Note to add to the entry
# Returns the created AttendanceCorrection object
@transaction.atomic
def correct_time_entry(*, actor, company, target_user, action_type, reason, target_date, entry=None, entry_type=None, timestamp=None, note=""):
    # Reason is mandatory for all corrections
    if not reason.strip():
        raise ValueError("Il motivo della correzione e' obbligatorio.")

    # Validate day can be edited
    ensure_day_is_editable(actor=actor, company=company, user=target_user, target_date=target_date)
    # Initialize value tracking dicts
    original_value = {}
    new_value = {}
    correction_entry = entry

    # Handle ADD action (create new entry)
    if action_type == AttendanceCorrection.ActionTypeChoices.ADD:
        # Create a new manual time entry
        correction_entry = TimeEntry.objects.create(
            user=target_user,
            company=company,
            created_by=actor,
            timestamp=timestamp,
            entry_type=entry_type,
            note=note,
            source=TimeEntry.SourceChoices.WEB,
            is_manual=True,  # Mark as manually created
        )
        # Serialize the new entry for the correction record
        new_value = serialize_time_entry_value(correction_entry)
    # Handle UPDATE action (modify existing entry)
    elif action_type == AttendanceCorrection.ActionTypeChoices.UPDATE:
        # Entry is required for update
        if not entry:
            raise ValueError("La timbratura da modificare non esiste.")
        # Capture original values before modification
        original_value = serialize_time_entry_value(entry)
        # Apply modifications
        if timestamp is not None:
            entry.timestamp = timestamp
        if entry_type is not None:
            entry.entry_type = entry_type
        entry.note = note
        entry.is_manual = True  # Mark as manually modified
        entry.created_by = actor  # Update who made the modification
        entry.save(update_fields=["timestamp", "entry_type", "note", "is_manual", "created_by"])
        # Serialize updated values
        new_value = serialize_time_entry_value(entry)
    # Handle DELETE action (remove entry)
    elif action_type == AttendanceCorrection.ActionTypeChoices.DELETE:
        # Entry is required for delete
        if not entry:
            raise ValueError("La timbratura da eliminare non esiste.")
        # Capture original values before deletion
        original_value = serialize_time_entry_value(entry)
        # Delete the entry
        entry.delete()
    # Unsupported action type
    else:
        raise ValueError("Tipo di correzione non supportato.")

    # Create the correction audit record
    correction = AttendanceCorrection.objects.create(
        company=company,
        user=target_user,
        date=target_date,
        # Link to the new/updated entry (None for DELETE)
        time_entry=correction_entry if action_type != AttendanceCorrection.ActionTypeChoices.DELETE else None,
        action_type=action_type,
        reason=reason,
        original_value=original_value,
        new_value=new_value,
        corrected_by=actor,
    )

    # Sync the day review with recalculated anomalies
    review = sync_day_review(
        company=company,
        user=target_user,
        target_date=target_date,
        anomalies=build_day_attendance_payload(
            user=target_user,
            company=company,
            target_date=target_date,
            include_entries=False,
            include_corrections=False,
        )["anomalies"],
        review_note=reason,
    )

    # Mark the review as corrected
    review.status = AttendanceDayReview.StatusChoices.CORRECTED
    review.reviewed_by = actor
    review.reviewed_at = timezone.now()
    review.save(update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"])

    # Log the correction event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.ATTENDANCE_CORRECTED,
        description=f"Attendance corrected for {target_user.email} on {target_date.isoformat()}.",
        metadata={
            "user_id": str(target_user.id),
            "date": target_date.isoformat(),
            "action_type": action_type,
            "reason": reason,
            "original_value": original_value,
            "new_value": new_value,
            "correction_id": str(correction.id),
        },
    )
    # Log the anomaly review event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.ANOMALY_REVIEWED,
        description=f"Attendance anomalies reviewed for {target_user.email} on {target_date.isoformat()}.",
        metadata={
            "user_id": str(target_user.id),
            "date": target_date.isoformat(),
            "reason": reason,
        },
    )

    return correction


# =============================================================================
# ATTENDANCE APPROVAL
# =============================================================================

# Approves a single day's attendance
# actor: User approving the attendance
# company: Company context
# target_user: User whose attendance is being approved
# target_date: Date being approved
# review_note: Optional note about the approval
# Returns the updated AttendanceDayReview object
@transaction.atomic
def approve_attendance_day(*, actor, company, target_user, target_date, review_note=""):
    # Validate day is editable and get existing review
    _, review = ensure_day_is_editable(actor=actor, company=company, user=target_user, target_date=target_date)
    # Build the day's payload
    payload = build_day_attendance_payload(
        user=target_user,
        company=company,
        target_date=target_date,
        include_entries=False,
        include_corrections=False,
    )
    # Create review if it doesn't exist
    review = review or get_or_create_day_review(company=company, user=target_user, target_date=target_date)[0]
    # Update review status to approved
    review.status = AttendanceDayReview.StatusChoices.APPROVED
    review.anomalies = payload["anomalies"]
    review.review_notes = review_note
    review.reviewed_by = actor
    review.reviewed_at = timezone.now()
    review.approved_by = actor
    review.approved_at = timezone.now()
    review.save()

    # Log the approval event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.ATTENDANCE_DAY_APPROVED,
        description=f"Attendance day approved for {target_user.email} on {target_date.isoformat()}.",
        metadata={
            "user_id": str(target_user.id),
            "date": target_date.isoformat(),
            "review_note": review_note,
            "anomalies": payload["anomalies"],
        },
    )
    return review


# Approves an entire month's attendance (all days)
# actor: User approving the month
# company: Company context
# month: Month number (1-12)
# year: Year number
# Returns the updated AttendancePeriod object
@transaction.atomic
def approve_attendance_month(*, actor, company, month, year):
    # Get the period for this month
    period = get_attendance_period(company=company, month=month, year=year)
    # Check if period is already closed or exported
    if period.status in {AttendancePeriod.StatusChoices.CLOSED, AttendancePeriod.StatusChoices.EXPORTED}:
        raise ValueError("Il mese selezionato non e' piu' approvabile.")

    # Update period status to approved
    period.status = AttendancePeriod.StatusChoices.APPROVED
    period.approved_by = actor
    period.approved_at = timezone.now()
    period.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

    # Log the approval event
    log_audit_event(
        actor=actor,
        company=company,
        action=AuditLog.ActionChoices.ATTENDANCE_MONTH_APPROVED,
        description=f"Attendance month approved for {month:02d}/{year}.",
        metadata={"month": month, "year": year, "period_id": str(period.id)},
    )
    return period


# =============================================================================
# ATTENDANCE REPORTING
# =============================================================================

# Gets all daily attendance rows for a month with optional filters
# company: Company context
# users_queryset: QuerySet of User objects to get attendance for
# month: Month number (1-12)
# year: Year number
# status_filter: Optional review status to filter by
# anomaly_filter: Optional anomaly type to filter by
# Returns list of day attendance payloads
def get_daily_review_rows(*, company, users_queryset, month, year, status_filter=None, anomaly_filter=None):
    # Get month date boundaries
    start_date, end_date = get_month_date_range(year=year, month=month)
    # Get distinct user-date pairs that have time entries
    entry_days = (
        TimeEntry.objects.filter(company=company, user__in=users_queryset, timestamp__date__gte=start_date, timestamp__date__lte=end_date)
        .values_list("user_id", "timestamp__date")
        .distinct()
    )
    # Get distinct user-date pairs that have reviews
    review_days = AttendanceDayReview.objects.filter(
        company=company,
        user__in=users_queryset,
        date__gte=start_date,
        date__lte=end_date,
    ).values_list("user_id", "date")
    # Get distinct user-date pairs that have corrections
    correction_days = AttendanceCorrection.objects.filter(
        company=company,
        user__in=users_queryset,
        date__gte=start_date,
        date__lte=end_date,
    ).values_list("user_id", "date")

    # Combine all user-date pairs into a single set (no duplicates)
    lookup = {(user_id, target_date) for user_id, target_date in entry_days}
    lookup.update((user_id, target_date) for user_id, target_date in review_days)
    lookup.update((user_id, target_date) for user_id, target_date in correction_days)

    # Build a lookup dict for users by ID
    users_by_id = {user.id: user for user in users_queryset}
    # List to collect result rows
    rows = []
    # Process each user-date pair
    for user_id, target_date in sorted(lookup, key=lambda item: (item[1], str(item[0])), reverse=True):
        # Get the user object
        user = users_by_id.get(user_id)
        if not user:
            continue
        # Build the full payload for this day
        payload = build_day_attendance_payload(user=user, company=company, target_date=target_date)
        # Apply status filter if specified
        if status_filter and payload["review_status"] != status_filter:
            continue
        # Apply anomaly filter if specified
        if anomaly_filter and anomaly_filter not in payload["anomalies"]:
            continue
        # Add to results
        rows.append(payload)
    return rows


# Gets monthly summary for each user in the queryset
# company: Company context
# users_queryset: QuerySet of User objects
# month: Month number (1-12)
# year: Year number
# Returns list of user summary dicts with aggregated data
def get_monthly_employee_summary(*, company, users_queryset, month, year):
    # List to collect user summaries
    rows = []
    # Process each user
    for user in users_queryset:
        # Get all daily rows for this user in the month
        daily_rows = get_daily_review_rows(company=company, users_queryset=[user], month=month, year=year)
        # Build the summary record
        rows.append(
            {
                "user_id": str(user.id),
                "employee_name": user.full_name or user.email,
                "month": month,
                "year": year,
                # Sum up worked minutes across all days
                "total_worked_minutes": sum(item["worked_minutes"] for item in daily_rows),
                # Sum up break minutes across all days
"total_break_minutes": sum(item["break_minutes"] for item in daily_rows),
                # Count total anomalies
                "anomaly_count": sum(len(item["anomalies"]) for item in daily_rows),
                # Count approved days
                "approved_days": sum(1 for item in daily_rows if item["review_status"] == AttendanceDayReview.StatusChoices.APPROVED),
                # Count corrected days
                "corrected_days": sum(1 for item in daily_rows if item["review_status"] == AttendanceDayReview.StatusChoices.CORRECTED),
                # Count days needing review
                "review_needed_days": sum(1 for item in daily_rows if item["review_status"] == AttendanceDayReview.StatusChoices.REVIEW_NEEDED),
                # Include all daily rows for detail
                "days": daily_rows,
            }
        )
    return rows


# =============================================================================
# TIME ENTRY QUERYSET FILTERING
# =============================================================================

# Gets filtered queryset of time entries based on request user's permissions
# request_user: User making the request (determines what they can see)
# target_user_id: Optional user ID to filter by specific user
# Returns filtered TimeEntry queryset ordered by timestamp
def get_time_history_queryset(*, request_user, target_user_id=None):
    # Start with all entries ordered by timestamp
    queryset = TimeEntry.objects.select_related("user", "company").order_by("-timestamp", "-created_at")

    # Platform admins see all entries
    if request_user.is_platform_admin:
        filtered_queryset = queryset
    # Regular employees only see their own entries
    elif request_user.role == User.RoleChoices.EMPLOYEE:
        filtered_queryset = queryset.filter(user=request_user)
    # Managers and other roles see entries for accessible companies
    else:
        filtered_queryset = queryset.filter(company_id__in=get_user_accessible_company_ids(request_user))

    # Optionally filter to specific user
    if target_user_id:
        filtered_queryset = filtered_queryset.filter(user_id=target_user_id)

    return filtered_queryset
