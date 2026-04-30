"""
PulseHR Serializers
=================

Serializers for PulseHR REST API backend.
They handle:
- Input validation
- Output serialization
- User/company creation

Important rules:
- Password never returned in response
- Sensitive fields use write_only=True
- Consistent validation between frontend and backend
"""

# Company Registration Payload mapping:
# {
#   "admin_first_name": str,      # Admin first name
#   "admin_last_name": str,       # Admin last name
#   "admin_email": str,           # Admin email (used for login)
#   "password": str,               # Password (min 8 chars)
#   "password_confirm": str,       # Password confirmation
#   "company_name": str,           # Company name
#   "legal_name": str,            # Legal business name
#   "vat_number": str,             # VAT/TAX ID number
#   ...
# }

# Import Django's authentication module for user authentication
from django.contrib.auth import authenticate
# Import Django's password validation utilities to enforce password policy
from django.contrib.auth.password_validation import validate_password
# Import lazy translation function for internationalization support
from django.utils.translation import gettext_lazy as _
# Import Django REST Framework serializers for API data transformation
from rest_framework import serializers

# Import all models from the current app for use in serializer Meta classes
from .models import (
    AbsenceType,
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
    EmployeeTraining,
    MedicalCertificate,
    MedicalVisit,
    Notification,
    OfficeLocation,
    OfflineTimeEntry,
    OnboardingProgress,
    OnboardingTask,
    PayrollDocumentLink,
    PayrollRun,
    Permission,
    PricingPlan,
    PricingConfig,
    SafetyAlert,
    SafetyCourse,
    AutomationRule,
    SafetyInspection,
    Task,
    TimeEntry,
    User,
)
# Import permission-related constants and helper functions
from .permissions import COMPANY_OPERATIONS_ROLES, get_effective_company_role


def _get_request_user(serializer):
    """
    Extract the authenticated user from a serializer's request context.
    
    Args:
        serializer: A DRF serializer instance with context containing request
        
    Returns:
        The authenticated User object or None if not available
    """
    # Get the request object from serializer's context dictionary
    request = serializer.context.get("request")
    # Return the user if request exists, otherwise return None
    return request.user if request else None


# Serializer for Company model - provides a compact summary representation
class CompanySummarySerializer(serializers.ModelSerializer):
    # Meta class defines model and fields for serialization
    class Meta:
        model = Company
        # Only include essential fields: id, name, slug, public_id, and status
        fields = ("id", "name", "slug", "public_id", "status")


# Serializer for Permission model - used to serialize permission objects
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        # Include all permission fields for detailed permission management
        fields = ("id", "module", "action", "code", "name", "description", "is_system")


# Serializer for CompanyRole model - includes nested permissions
class CompanyRoleSerializer(serializers.ModelSerializer):
    # Nested serializer to represent permissions (read-only, cannot be modified directly)
    permissions = PermissionSerializer(many=True, read_only=True)
    # Write-only field to accept permission IDs when creating/updating a role
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True,  # Allows multiple permissions to be assigned
        queryset=Permission.objects.all(),  # Validates permission IDs against existing permissions
        source="permissions",  # Maps to the 'permissions' field on the model
        write_only=True,  # Only used for input, never returned in response
        required=False,  # Permission assignment is optional
    )

    class Meta:
        model = CompanyRole
        # Include all role fields plus nested permissions and permission IDs
        fields = (
            "id",
            "name",
            "code",
            "description",
            "permissions",
            "permission_ids",
            "is_system",
            "is_active",
            "created_at",
            "updated_at",
        )


# Serializer for Department model - handles department data
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        # Include department identification and metadata fields
        fields = ("id", "name", "code", "is_active", "created_at", "updated_at")


# Serializer for OfficeLocation model - handles office/address data
class OfficeLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficeLocation
        # Include all location and address fields
        fields = (
            "id",
            "name",
            "address_line_1",
            "address_line_2",
            "city",
            "state_region",
            "postal_code",
            "country_code",
            "is_active",
            "created_at",
            "updated_at",
        )


# Serializer for User model - main user representation for API responses
class UserSerializer(serializers.ModelSerializer):
    # Include nested company summary data (read-only, cannot be modified via this serializer)
    company = CompanySummarySerializer(read_only=True)
    # Include nested company role data (read-only)
    company_role = CompanyRoleSerializer(read_only=True)
    # Include computed full_name field (combines first_name and last_name)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        # Include all essential user fields
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "company",
            "company_role",
            "email_verified",
            "force_password_change",
            "is_active",
        )


# Serializer for user login - validates credentials on authentication request
class LoginSerializer(serializers.Serializer):
    # Field for username/email identifier used to login
    # Accept both "email" and "identifier" for backward compatibility
    identifier = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    # Password field is write-only (never returned in response)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        """
        Validate login credentials.
        
        Args:
            attrs: Dictionary containing 'identifier' or 'email' and 'password'
            
        Returns:
            attrs with 'user' key added containing the authenticated user
            
        Raises:
            ValidationError: If credentials are invalid, user is inactive, or company has no access
        """
        # Use email if provided, otherwise use identifier
        identifier = attrs.get("identifier") or attrs.get("email")
        password = attrs.get("password")
        # Get the request object from serializer context for authentication
        request = self.context.get("request")

        # Authenticate user using Django's authentication system
        user = authenticate(request=request, username=identifier, password=password)
        # Raise error if authentication failed (no user found with these credentials)
        if not user:
            raise serializers.ValidationError(_("Credenziali non valide."))
        # Raise error if user account is deactivated
        if not user.is_active:
            raise serializers.ValidationError(_("Utente disattivato."))
        # Raise error if user's company does not have platform access
        if not user.is_platform_admin and user.company and not user.company.access_allowed:
            raise serializers.ValidationError(_("La tua azienda non puo' accedere alla piattaforma."))

        # Add authenticated user to attributes for use in view
        attrs["user"] = user
        return attrs


# Serializer for password change operation
class ChangePasswordSerializer(serializers.Serializer):
    # Current password - write-only, optional (not required if must_change_password is True)
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # New password - write-only, no whitespace trimming
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    # Password confirmation - write-only, must match new_password
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        """
        Validate password change request.
        
        Args:
            attrs: Dictionary with current_password, new_password, confirm_password
            
        Returns:
            Validated attrs if all checks pass
            
        Raises:
            ValidationError: If passwords don't match or current password is wrong
        """
        # Get the current user from the request context
        user = self.context["request"].user
        # Extract passwords from attributes, defaulting current_password to empty string
        current_password = attrs.get("current_password", "")
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        # Check if new password matches confirmation
        if new_password != confirm_password:
            raise serializers.ValidationError(_("Le nuove password non coincidono."))

        # If user must change password, skip current password check; otherwise verify it
        if not user.must_change_password and not user.check_password(current_password):
            raise serializers.ValidationError(_("La password attuale non e' corretta."))

        return attrs


# Serializer for AuditLog model - tracks user actions in the system
class AuditLogSerializer(serializers.ModelSerializer):
    # Read email from the related actor (user who performed the action)
    actor_email = serializers.EmailField(source="actor.email", read_only=True)

    class Meta:
        model = AuditLog
        # Include audit log details and actor email
        fields = ("id", "action", "description", "actor_email", "metadata", "created_at")


# Serializer for Company model - comprehensive company representation
class CompanySerializer(serializers.ModelSerializer):
    # Compute and include the count of users in this company
    users_count = serializers.SerializerMethodField()
    # Include the primary admin user details
    primary_admin = serializers.SerializerMethodField()
    # Include recent audit log entries for this company
    recent_audit_logs = serializers.SerializerMethodField()
    # Include access overview of the primary admin
    access_overview = serializers.SerializerMethodField()

    class Meta:
        model = Company
        # Include all company fields for detailed view
        fields = (
            "id",
            "name",
            "public_id",
            "legal_name",
            "slug",
            "vat_number",
            "contact_email",
            "contact_phone",
            "website",
            "country_code",
            "city",
            "state_region",
            "postal_code",
            "address_line_1",
            "address_line_2",
            "status",
            "plan",
            "billing_cycle",
            "subscription_end_date",
            "max_employees",
            "is_active",
            "is_deleted",
            "deleted_at",
            "users_count",
            "primary_admin",
            "access_overview",
            "recent_audit_logs",
            "created_at",
            "updated_at",
        )

    def get_primary_admin(self, obj):
        """
        Get the primary admin user (company owner or admin, earliest by join date).
        
        Args:
            obj: The Company instance being serialized
            
        Returns:
            Dictionary with admin user details or None if no admin exists
        """
        # Filter users who are owners or admins, order by join date ascending
        primary_admin = (
            obj.users.filter(role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN])
            .order_by("date_joined")
            .first()
        )
        # Return None if no admin found
        if not primary_admin:
            return None

        # Return admin details as a dictionary
        return {
            "id": str(primary_admin.id),
            "email": primary_admin.email,
            "full_name": primary_admin.full_name,
            "force_password_change": primary_admin.force_password_change,
            "role": primary_admin.role,
        }

    def get_users_count(self, obj):
        """Get the total count of users in the company."""
        return obj.users.count()

    def get_recent_audit_logs(self, obj):
        """Get the 5 most recent audit logs for this company."""
        # Get all audit logs, ordered by most recent, limit to 5
        logs = obj.audit_logs.all()[:5]
        # Serialize the logs using AuditLogSerializer
        return AuditLogSerializer(logs, many=True).data

    def get_access_overview(self, obj):
        """
        Get access overview for the primary admin.
        
        Args:
            obj: The Company instance being serialized
            
        Returns:
            Dictionary with admin access details or None
        """
        # Same logic as get_primary_admin - find the earliest joined admin
        primary_admin = (
            obj.users.filter(role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN])
            .order_by("date_joined")
            .first()
        )
        if not primary_admin:
            return None

        # Return access overview data
        return {
            "email": primary_admin.email,
            "is_active": primary_admin.is_active,
            "force_password_change": primary_admin.force_password_change,
            "last_login": primary_admin.last_login,
            "role": primary_admin.role,
        }


# Serializer for creating a new company with admin user (used by admins)
class CompanyCreateSerializer(serializers.Serializer):
    # Required company name field
    name = serializers.CharField(max_length=255)
    # Optional legal business name
    legal_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    # Optional URL-friendly slug (auto-generated if not provided)
    slug = serializers.SlugField(required=False, allow_blank=True)
    # Optional VAT/tax identification number
    vat_number = serializers.CharField(max_length=64, required=False, allow_blank=True)
    # Optional contact email address
    contact_email = serializers.EmailField(required=False, allow_blank=True)
    # Optional contact phone number
    contact_phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    # Optional company website URL
    website = serializers.URLField(required=False, allow_blank=True)
    # Optional 2-letter country code
    country_code = serializers.CharField(max_length=2, required=False, allow_blank=True)
    # Optional city name
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    # Optional state/region name
    state_region = serializers.CharField(max_length=120, required=False, allow_blank=True)
    # Optional postal/ZIP code
    postal_code = serializers.CharField(max_length=32, required=False, allow_blank=True)
    # Optional primary address line
    address_line_1 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    # Optional secondary address line
    address_line_2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    # Company status - defaults to TRIAL
    status = serializers.ChoiceField(choices=Company.StatusChoices.choices, default=Company.StatusChoices.TRIAL)
    # Optional subscription plan name
    plan = serializers.CharField(max_length=120, required=False, allow_blank=True)
    # Billing cycle - defaults to MONTHLY
    billing_cycle = serializers.ChoiceField(
        choices=Company.BillingCycleChoices.choices,
        default=Company.BillingCycleChoices.MONTHLY,
    )
    # Optional subscription end date
    subscription_end_date = serializers.DateField(required=False, allow_null=True)
    # Maximum number of employees allowed - defaults to 50
    max_employees = serializers.IntegerField(min_value=1, default=50)
    # Required admin user email (used to create admin account)
    admin_email = serializers.EmailField()
    # Optional admin first name
    admin_first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    # Optional admin last name
    admin_last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_admin_email(self, value):
        """
        Ensure admin email is unique in the system.
        
        Args:
            value: The admin email to validate
            
        Returns:
            The validated email if unique
            
        Raises:
            ValidationError: If email already exists
        """
        # Check if any user with this email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(_("Esiste gia' un utente con questa email."))
        return value

    def create(self, validated_data):
        """
        Create a new company with an admin user.
        
        Args:
            validated_data: Validated serializer data
            
        Returns:
            The created Company instance
        """
        # Get the actor (user performing the action) from request context
        actor = self.context["request"].user
        # Build company data dictionary from validated fields
        company_payload = {
            "name": validated_data["name"],
            "legal_name": validated_data.get("legal_name", ""),
            "slug": validated_data.get("slug"),
            "vat_number": validated_data.get("vat_number", ""),
            "contact_email": validated_data.get("contact_email", ""),
            "contact_phone": validated_data.get("contact_phone", ""),
            "website": validated_data.get("website", ""),
            "country_code": validated_data.get("country_code", ""),
            "city": validated_data.get("city", ""),
            "state_region": validated_data.get("state_region", ""),
            "postal_code": validated_data.get("postal_code", ""),
            "address_line_1": validated_data.get("address_line_1", ""),
            "address_line_2": validated_data.get("address_line_2", ""),
            "status": validated_data.get("status", Company.StatusChoices.TRIAL),
            "plan": validated_data.get("plan", ""),
            "billing_cycle": validated_data.get("billing_cycle", Company.BillingCycleChoices.MONTHLY),
            "subscription_end_date": validated_data.get("subscription_end_date"),
            "max_employees": validated_data.get("max_employees", 50),
        }
        # Build admin user data dictionary
        admin_payload = {
            "email": validated_data["admin_email"],
            "first_name": validated_data.get("admin_first_name", ""),
            "last_name": validated_data.get("admin_last_name", ""),
        }
        # Import service function locally to avoid circular imports
        from .services import create_company_with_admin
        # Create company and admin user using the service
        return create_company_with_admin(actor=actor, company_data=company_payload, admin_data=admin_payload)


# Serializer for company registration (public/self-service registration)
class CompanyRegistrationSerializer(serializers.Serializer):
    # Required company name
    company_name = serializers.CharField(max_length=255)
    # Optional legal name
    legal_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    # Optional VAT number
    vat_number = serializers.CharField(max_length=64, required=False, allow_blank=True)
    # Required contact email
    contact_email = serializers.EmailField()
    # Optional phone number
    contact_phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    # Optional website URL
    website = serializers.URLField(required=False, allow_blank=True)
    # Required 2-letter country code
    country_code = serializers.CharField(max_length=2)
    # Required city
    city = serializers.CharField(max_length=120)
    # Optional state/region
    state_region = serializers.CharField(max_length=120, required=False, allow_blank=True)
    # Required postal code
    postal_code = serializers.CharField(max_length=32)
    # Required address line 1
    address_line_1 = serializers.CharField(max_length=255)
    # Optional address line 2
    address_line_2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    # Optional subscription plan
    plan = serializers.CharField(max_length=120, required=False, allow_blank=True)
    # Billing cycle - defaults to monthly
    billing_cycle = serializers.ChoiceField(
        choices=Company.BillingCycleChoices.choices,
        default=Company.BillingCycleChoices.MONTHLY,
    )
    # Maximum employees allowed - defaults to 50
    max_employees = serializers.IntegerField(min_value=1, default=50)

    # Required admin email (will become login credential)
    admin_email = serializers.EmailField()
    # Required admin first name
    admin_first_name = serializers.CharField(max_length=150)
    # Optional admin last name
    admin_last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    # User-provided password (write-only, minimum 8 characters)
    password = serializers.CharField(min_length=8, write_only=True)
    # Password confirmation - must match password (write-only)
    password_confirm = serializers.CharField(write_only=True)

    def validate_password(self, value):
        """
        Validate password using Django's password validators.
        
        Args:
            value: The password to validate
            
        Returns:
            The validated password
            
        Raises:
            ValidationError: If password doesn't meet policy requirements
        """
        # Use Django's built-in password validation (checks complexity requirements)
        validate_password(value)
        return value

    def validate_admin_email(self, value):
        """
        Ensure admin email is unique in the system.

        Args:
            value: The admin email to validate
            
        Returns:
            The validated email if unique
            
        Raises:
            ValidationError: If email already exists
        """
        # Check if user with this email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(_("Esiste gia' un utente con questa email."))
        return value

    def validate(self, attrs):
        """
        Cross-field validation - ensure passwords match.
        
        Args:
            attrs: All validated fields
            
        Returns:
            Validated attrs if passwords match
            
        Raises:
            ValidationError: If passwords don't match
        """
        # Check that password and confirmation match
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Le password non corrispondono.'})
        return attrs

    def create(self, validated_data):
        """
        Create a new company with admin user via self-service registration.
        
        Args:
            validated_data: Validated serializer data
            
        Returns:
            The created Company instance
        """
        # Extract password before passing to services (not stored in company/admin data)
        password = validated_data.pop('password')
        # Remove password confirmation (not needed further)
        validated_data.pop('password_confirm')

        # Build company payload from validated data
        company_payload = {
            "name": validated_data["company_name"],
            "legal_name": validated_data.get("legal_name", ""),
            "vat_number": validated_data.get("vat_number", ""),
            "contact_email": validated_data["contact_email"],
            "contact_phone": validated_data.get("contact_phone", ""),
            "website": validated_data.get("website", ""),
            # Uppercase country code for consistency
            "country_code": validated_data["country_code"].upper(),
            "city": validated_data["city"],
            "state_region": validated_data.get("state_region", ""),
            "postal_code": validated_data["postal_code"],
            "address_line_1": validated_data["address_line_1"],
            "address_line_2": validated_data.get("address_line_2", ""),
            # New registrations start in TRIAL status
            "status": Company.StatusChoices.TRIAL,
            # Default to trial plan if not specified
            "plan": validated_data.get("plan", "trial"),
            "billing_cycle": validated_data.get("billing_cycle", Company.BillingCycleChoices.MONTHLY),
            "max_employees": validated_data.get("max_employees", 50),
        }
        # Build admin user payload with the actual password (not temporary)
        admin_payload = {
            "email": validated_data["admin_email"],
            "first_name": validated_data["admin_first_name"],
            "last_name": validated_data.get("admin_last_name", ""),
            "password": password,  # User-provided password, not temporary
        }
        # Import service function locally to avoid circular imports
        from .services import create_company_with_admin
        # Create company and admin user - actor is None (self-registration)
        return create_company_with_admin(actor=None, company_data=company_payload, admin_data=admin_payload, source="registration")


# Serializer for consultant self-registration
class ConsultantRegistrationSerializer(serializers.Serializer):
    # Required first name
    first_name = serializers.CharField(max_length=150)
    # Optional last name
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    # Required unique email
    email = serializers.EmailField()
    # Required role - must be either labor consultant or safety consultant
    role = serializers.ChoiceField(
        choices=[
            User.RoleChoices.LABOR_CONSULTANT,
            User.RoleChoices.SAFETY_CONSULTANT,
        ]
    )
    # User-provided password (write-only, minimum 8 characters)
    password = serializers.CharField(min_length=8, write_only=True)
    # Password confirmation (write-only)
    password_confirm = serializers.CharField(write_only=True)
    # Optional phone number
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    # Optional fiscal code (Italian codice fiscale)
    fiscal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    # Optional consulting firm/studio name
    studio_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_password(self, value):
        """
        Validate password using Django's password validators.
        
        Args:
            value: The password to validate
            
        Returns:
            The validated password
            
        Raises:
            ValidationError: If password doesn't meet policy requirements
        """
        # Use Django's built-in password validation
        validate_password(value)
        return value

    def validate_email(self, value):
        """
        Ensure consultant email is unique in the system.
        
        Args:
            value: The email to validate
            
        Returns:
            The validated email if unique
            
        Raises:
            ValidationError: If email already exists
        """
        # Check if user with this email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(_("Esiste gia' un utente con questa email."))
        return value

    def validate(self, attrs):
        """
        Cross-field validation - ensure passwords match.
        
        Args:
            attrs: All validated fields
            
        Returns:
            Validated attrs if passwords match
            
        Raises:
            ValidationError: If passwords don't match
        """
        # Verify password and confirmation match
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Le password non corrispondono.'})
        return attrs

    def create(self, validated_data):
        """
        Create a new consultant account.
        
        Args:
            validated_data: Validated serializer data
            
        Returns:
            The created User instance
        """
        # Extract password before passing to services
        password = validated_data.pop('password')
        # Remove password confirmation (not needed further)
        validated_data.pop('password_confirm')

        # Prepare payload with password
        payload = {
            'email': validated_data['email'],
            'first_name': validated_data.get('first_name', ''),
            'last_name': validated_data.get('last_name', ''),
            'role': validated_data['role'],
            'password': password,  # User-provided password
        }

        # Add optional fields if they have values
        for field in ['phone', 'fiscal_code', 'studio_name']:
            if validated_data.get(field):
                payload[field] = validated_data[field]

        # Import service function locally to avoid circular imports
        from .services import create_consultant_account

        # Get the actor from request context (if authenticated), otherwise None
        actor = self.context.get("request").user if self.context.get("request") and self.context["request"].user.is_authenticated else None
        # Create consultant account using the service
        return create_consultant_account(actor=actor, payload=payload)


# Serializer for updating company information
class CompanyUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        # Include all updateable company fields
        fields = (
            "name",
            "legal_name",
            "slug",
            "vat_number",
            "contact_email",
            "contact_phone",
            "website",
            "country_code",
            "city",
            "state_region",
            "postal_code",
            "address_line_1",
            "address_line_2",
            "plan",
            "billing_cycle",
            "subscription_end_date",
            "max_employees",
            "status",
        )

    def validate_status(self, value):
        """
        Prevent direct cancellation of company via status update.
        
        Args:
            value: The new status value
            
        Returns:
            The status value if valid
            
        Raises:
            ValidationError: If trying to set status to CANCELLED
        """
        # Prevent setting status to CANCELLED - use soft delete instead
        if value == Company.StatusChoices.CANCELLED:
            raise serializers.ValidationError(_("Usa l'azione di soft delete per cancellare logicamente l'azienda."))
        return value


# Serializer for company billing information
class CompanyBillingSerializer(serializers.Serializer):
    # Subscription plan name
    plan = serializers.CharField(max_length=120)
    # Billing cycle selection
    billing_cycle = serializers.ChoiceField(choices=Company.BillingCycleChoices.choices)


# Serializer for viewing company users
class CompanyUserSerializer(serializers.ModelSerializer):
    # Include computed full name
    full_name = serializers.CharField(read_only=True)
    # Include nested company role details
    company_role = CompanyRoleSerializer(read_only=True)
    # Include effective company role (computed considering inheritance)
    effective_company_role = serializers.SerializerMethodField()

    class Meta:
        model = User
        # Include user fields for company user listing
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "company_role",
            "effective_company_role",
            "force_password_change",
            "is_active",
            "date_joined",
        )

    def get_effective_company_role(self, obj):
        """
        Get the effective company role considering role inheritance.
        
        Args:
            obj: The User instance being serialized
            
        Returns:
            Serialized company role or None if no role assigned
        """
        # Use permission helper to compute effective role
        company_role = get_effective_company_role(obj)
        # Return serialized role data or None
        return CompanyRoleSerializer(company_role).data if company_role else None


# Serializer for creating/updating company users
class CompanyUserWriteSerializer(serializers.Serializer):
    # Optional email (required for new users)
    email = serializers.EmailField(required=False)
    # Optional first name
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    # Optional last name
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    # Optional role selection (must be valid role choice)
    role = serializers.ChoiceField(
        choices=[
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN,
            User.RoleChoices.HR_MANAGER,
            User.RoleChoices.MANAGER,
            User.RoleChoices.EXTERNAL_CONSULTANT,
            User.RoleChoices.LABOR_CONSULTANT,
            User.RoleChoices.SAFETY_CONSULTANT,
        ],
        required=False,
    )
    # Optional company role ID (links to a CompanyRole with permissions)
    company_role_id = serializers.PrimaryKeyRelatedField(
        queryset=CompanyRole.objects.all(),
        source="company_role",
        required=False,
        allow_null=True,
    )
    # Optional active status
    is_active = serializers.BooleanField(required=False)

    def validate_email(self, value):
        """
        Ensure email is unique (excluding current instance if updating).
        
        Args:
            value: The email to validate
            
        Returns:
            The validated email if unique
            
        Raises:
            ValidationError: If email already exists for another user
        """
        # Get the instance being updated (if any)
        instance = self.context.get("instance")
        # Start with all users having this email
        existing = User.objects.filter(email=value)
        # Exclude the current instance if updating
        if instance:
            existing = existing.exclude(pk=instance.pk)
        # Raise error if any other user has this email
        if existing.exists():
            raise serializers.ValidationError(_("Esiste gia' un utente con questa email."))
        return value

    def validate(self, attrs):
        """
        Validate user creation/update request.
        
        Args:
            attrs: All validated fields
            
        Returns:
            Validated attrs if all checks pass
            
        Raises:
            ValidationError: Various validation failures
        """
        # Get the requesting user and instance being modified
        request_user = _get_request_user(self)
        instance = self.context.get("instance")
        company_role = attrs.get("company_role")
        target_role = attrs.get("role") or getattr(instance, "role", None)

        # For new users, email is required
        if not instance and not attrs.get("email"):
            raise serializers.ValidationError({"email": _("L'email e' obbligatoria.")})
        # For new users, role is required
        if not instance and not target_role:
            raise serializers.ValidationError({"role": _("Il ruolo applicativo e' obbligatorio.")})

        # Prevent assigning SUPER_ADMIN role to company users
        if target_role == User.RoleChoices.SUPER_ADMIN:
            raise serializers.ValidationError({"role": _("Un utente aziendale non puo' essere super admin.")})
        # Prevent assigning PLATFORM_OWNER role to company users
        if target_role == User.RoleChoices.PLATFORM_OWNER:
            raise serializers.ValidationError({"role": _("Un utente aziendale non puo' essere platform owner.")})

        # Only super admin, platform owner, or company owner can assign COMPANY_OWNER role
        if (
            request_user
            and request_user.role not in {User.RoleChoices.SUPER_ADMIN, User.RoleChoices.PLATFORM_OWNER, User.RoleChoices.COMPANY_OWNER}
            and target_role == User.RoleChoices.COMPANY_OWNER
        ):
            raise serializers.ValidationError({"role": _("Solo il super admin o il company owner possono assegnare questo ruolo.")})

        # Validate that company role belongs to the same tenant
        if company_role:
            # Determine which company the actor belongs to
            actor_company = request_user.company if request_user and not request_user.is_platform_admin else company_role.company
            # Check company match
            if company_role.company_id != actor_company.id:
                raise serializers.ValidationError({"company_role_id": _("Il ruolo aziendale deve appartenere allo stesso tenant.")})

        return attrs


# Serializer for EmployeeProfile model - comprehensive employee data
class EmployeeProfileSerializer(serializers.ModelSerializer):
    # Include nested department data (read-only)
    department = DepartmentSerializer(read_only=True)
    # Includenested office location data (read-only)
    office_location = OfficeLocationSerializer(read_only=True)
    # Include nested manager data (computed)
    manager = serializers.SerializerMethodField()
    # Include nested user data (read-only)
    user = CompanyUserSerializer(read_only=True)
    # Include computed full name (read-only)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = EmployeeProfile
        # Include all employee profile fields
        fields = (
            "id",
            "user",
            "company",
            "employee_code",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "status",
            "department",
            "office_location",
            "manager",
            "hire_date",
            "job_title",
            "phone",
            "emergency_contact",
            "notes",
            "created_at",
            "updated_at",
        )
        # Company field is auto-set and read-only
        read_only_fields = ("company",)

    def get_manager(self, obj):
        """
        Get manager details for the employee.
        
        Args:
            obj: The EmployeeProfile instance being serialized
            
        Returns:
            Dictionary with manager details or None if no manager assigned
        """
        # Return None if no manager assigned
        if not obj.manager:
            return None
        # Return manager's basic info
        return {
            "id": str(obj.manager.id),
            "employee_code": obj.manager.employee_code,
            "full_name": obj.manager.full_name,
        }


# Serializer for creating/updating employee profiles
class EmployeeProfileWriteSerializer(serializers.Serializer):
    # Optional employee code
    employee_code = serializers.CharField(max_length=64, required=False, allow_blank=True)
    # Required first name
    first_name = serializers.CharField(max_length=150)
    # Optional last name
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    # Optional email
    email = serializers.EmailField(required=False, allow_blank=True)
    # Employee status - defaults to ACTIVE
    status = serializers.ChoiceField(
        choices=EmployeeProfile.StatusChoices.choices,
        default=EmployeeProfile.StatusChoices.ACTIVE,
    )
    # Optional department (linked by ID)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="department",
        required=False,
        allow_null=True,
    )
    # Optional office location (linked by ID)
    office_location_id = serializers.PrimaryKeyRelatedField(
        queryset=OfficeLocation.objects.all(),
        source="office_location",
        required=False,
        allow_null=True,
    )
    # Optional manager (linked by ID)
    manager_id = serializers.PrimaryKeyRelatedField(
        queryset=EmployeeProfile.objects.all(),
        source="manager",
        required=False,
        allow_null=True,
    )
    # Optional hire date
    hire_date = serializers.DateField(required=False, allow_null=True)
    # Optional job title
    job_title = serializers.CharField(max_length=120, required=False, allow_blank=True)
    # Optional phone number
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    # Optional emergency contact information
    emergency_contact = serializers.CharField(max_length=255, required=False, allow_blank=True)
    # Optional notes
    notes = serializers.CharField(required=False, allow_blank=True)
    # Flag to create associated user account
    create_user_account = serializers.BooleanField(required=False, default=False)
    # Required if create_user_account is True
    user_email = serializers.EmailField(required=False, allow_blank=True)
    # Optional company role to assign to created user
    company_role_id = serializers.PrimaryKeyRelatedField(
        queryset=CompanyRole.objects.all(),
        source="company_role",
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        """
        Validate employee profile data.
        
        Args:
            attrs: All validated fields
            
        Returns:
            Validated attrs if all checks pass
            
        Raises:
            ValidationError: Various validation failures
        """
        # Get requesting user and instance being updated
        request_user = _get_request_user(self)
        instance = self.context.get("instance")
        # Determine company context for validation
        company = request_user.company if request_user and not request_user.is_platform_admin else getattr(instance, "company", None)

        # Validate that related records belong to the same tenant
        for field_name in ["department", "office_location", "company_role"]:
            related = attrs.get(field_name)
            # Check if related object exists and belongs to different company
            if related and company and related.company_id != company.id:
                raise serializers.ValidationError({f"{field_name}_id": _("Il record deve appartenere allo stesso tenant.")})

        # Validate manager belongs to same company
        manager = attrs.get("manager")
        if manager and company and manager.company_id != company.id:
            raise serializers.ValidationError({"manager_id": _("Il manager deve appartenere allo stesso tenant.")})
        # Prevent employee from being their own manager
        if instance and manager and manager.id == instance.id:
            raise serializers.ValidationError({"manager_id": _("Un dipendente non puo' essere manager di se stesso.")})

        # If creating user account, email is required
        if attrs.get("create_user_account") and not attrs.get("user_email"):
            raise serializers.ValidationError({"user_email": _("L'email utente e' obbligatoria quando crei un account.")})

        # Check user email uniqueness
        user_email = attrs.get("user_email")
        if user_email:
            # Find existing users with this email
            existing_users = User.objects.filter(email=user_email)
            # Exclude current instance if updating
            if instance and instance.user_id:
                existing_users = existing_users.exclude(pk=instance.user_id)
            # Raise error if email already taken
            if existing_users.exists():
                raise serializers.ValidationError({"user_email": _("Esiste gia' un utente con questa email.")})

        return attrs


# Serializer for TimeEntry model - time tracking records
class TimeEntrySerializer(serializers.ModelSerializer):
    # Include user info (computed)
    user = serializers.SerializerMethodField()

    class Meta:
        model = TimeEntry
        # Include time entry fields
        fields = (
            "id",
            "user",
            "timestamp",
            "entry_type",
            "note",
            "source",
            "is_manual",
            "created_at",
        )

    def get_user(self, obj):
        """
        Get basic user info for the time entry owner.
        
        Args:
            obj: The TimeEntry instance being serialized
            
        Returns:
            Dictionary with user id, email, and full name
        """
        return {
            "id": str(obj.user_id),
            "email": obj.user.email,
            "full_name": obj.user.full_name,
        }


# Serializer for time entry action requests
class TimeEntryActionSerializer(serializers.Serializer):
    # Optional note/comment
    note = serializers.CharField(max_length=255, required=False, allow_blank=True)
    # Source of the action - defaults to WEB
    source = serializers.ChoiceField(choices=TimeEntry.SourceChoices.choices, default=TimeEntry.SourceChoices.WEB)


# Serializer for today's time summary
class TimeTodaySerializer(serializers.Serializer):
    # Current state (e.g., working, on break, away)
    state = serializers.CharField()
    # Total minutes worked today
    worked_minutes = serializers.IntegerField()
    # Total minutes on break today
    break_minutes = serializers.IntegerField()
    # First clock-in time today
    first_entry_at = serializers.DateTimeField(allow_null=True)
    # Last clock-out time today
    last_entry_at = serializers.DateTimeField(allow_null=True)
    # List of anomalies/issues detected
    anomalies = serializers.ListField(child=serializers.CharField())
    # Review status for today
    review_status = serializers.CharField()
    # Optional review notes
    review_notes = serializers.CharField(allow_blank=True, allow_null=True)
    # When the day was approved (if applicable)
    approved_at = serializers.DateTimeField(allow_null=True)
    # Overall period status
    period_status = serializers.CharField()
    # List of all time entries for today
    entries = TimeEntrySerializer(many=True)


# Serializer for time history query parameters
class TimeHistoryQuerySerializer(serializers.Serializer):
    # Optional user ID filter
    user_id = serializers.UUIDField(required=False)


# Serializer for company attendance snapshot
class CompanyAttendanceSnapshotSerializer(serializers.Serializer):
    # User ID
    user_id = serializers.UUIDField()
    # Employee full name
    employee_name = serializers.CharField()
    # Current state
    state = serializers.CharField()
    # Total minutes worked
    worked_minutes = serializers.IntegerField()
    # Total break minutes
    break_minutes = serializers.IntegerField()
    # First clock-in
    first_entry_at = serializers.DateTimeField(allow_null=True)
    # Last clock-out
    last_entry_at = serializers.DateTimeField(allow_null=True)
    # List of anomalies
    anomalies = serializers.ListField(child=serializers.CharField())
    # Optional review status
    review_status = serializers.CharField(required=False)


# Serializer for AttendanceCorrection model
class AttendanceCorrectionSerializer(serializers.ModelSerializer):
    # Include corrector info (computed)
    corrected_by = serializers.SerializerMethodField()
    # Time entry ID that was corrected (read-only)
    time_entry_id = serializers.UUIDField(allow_null=True, read_only=True)

    class Meta:
        model = AttendanceCorrection
        # Include correction details
        fields = (
            "id",
            "time_entry_id",
            "action_type",
            "reason",
            "original_value",
            "new_value",
            "corrected_by",
            "created_at",
        )

    def get_corrected_by(self, obj):
        """
        Get info about who made the correction.
        
        Args:
            obj: The AttendanceCorrection instance being serialized
            
        Returns:
            Dictionary with corrector details or None
        """
        # Return None if no corrector recorded
        if not obj.corrected_by:
            return None
        # Return corrector's basic info
        return {
            "id": str(obj.corrected_by.id),
            "email": obj.corrected_by.email,
            "full_name": obj.corrected_by.full_name,
        }


# Serializer for attendance day review data
class AttendanceDayReviewSerializer(serializers.Serializer):
    # User ID from the user object
    user_id = serializers.UUIDField(source="user.id")
    # Employee name (computed)
    employee_name = serializers.SerializerMethodField()
    # Date of the review
    date = serializers.CharField()
    # Current state
    state = serializers.CharField()
    # Minutes worked
    worked_minutes = serializers.IntegerField()
    # Minutes on break
    break_minutes = serializers.IntegerField()
    # First clock-in time
    first_entry_at = serializers.DateTimeField(allow_null=True)
    # Last clock-out time
    last_entry_at = serializers.DateTimeField(allow_null=True)
    # List of anomalies
    anomalies = serializers.ListField(child=serializers.CharField())
    # Review status
    review_status = serializers.CharField()
    # Optional review notes
    review_notes = serializers.CharField(allow_blank=True, allow_null=True)
    # When reviewed
    reviewed_at = serializers.DateTimeField(allow_null=True)
    # When approved
    approved_at = serializers.DateTimeField(allow_null=True)
    # Overall period status
    period_status = serializers.CharField()
    # Time entries for the day
    entries = TimeEntrySerializer(many=True)
    # Corrections applied to the day
    corrections = AttendanceCorrectionSerializer(many=True)

    def get_employee_name(self, obj):
        """
        Get the employee's display name.
        
        Args:
            obj: Dictionary containing 'user' key with User object
            
        Returns:
            The user's full name or email as fallback
        """
        # Get user from the dictionary (uses source="user.id" above)
        user = obj["user"]
        # Use full_name if available, otherwise fall back to email
        return user.full_name or user.email


# Serializer for approving a single attendance day
class AttendanceDayApproveSerializer(serializers.Serializer):
    # User ID to approve
    user_id = serializers.UUIDField()
    # Date to approve
    date = serializers.DateField()
    # Optional review note
    review_note = serializers.CharField(required=False, allow_blank=True)


# Serializer for approving an entire attendance month
class AttendanceMonthApproveSerializer(serializers.Serializer):
    # Month to approve (1-12)
    month = serializers.IntegerField(min_value=1, max_value=12)
    # Year to approve
    year = serializers.IntegerField(min_value=2000, max_value=3000)


# Serializer for creating attendance corrections
class AttendanceCorrectionWriteSerializer(serializers.Serializer):
    # User ID to correct
    user_id = serializers.UUIDField()
    # Date to correct
    date = serializers.DateField()
    # Type of correction action
    action_type = serializers.ChoiceField(choices=AttendanceCorrection.ActionTypeChoices.choices)
    # Optional specific entry ID to correct
    entry_id = serializers.UUIDField(required=False, allow_null=True)
    # Required for ADD/UPDATE actions
    entry_type = serializers.ChoiceField(choices=TimeEntry.EntryTypeChoices.choices, required=False)
    # Required for ADD/UPDATE actions
    timestamp = serializers.DateTimeField(required=False)
    # Optional note for the correction
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)
    # Required reason for the correction
    reason = serializers.CharField()

    def validate(self, attrs):
        """
        Validate correction request based on action type.
        
        Args:
            attrs: All validated fields
            
        Returns:
            Validated attrs if all checks pass
            
        Raises:
            ValidationError: If required fields missing for action type
        """
        # Get action type to determine validation requirements
        action_type = attrs["action_type"]
        # For UPDATE and DELETE actions, entry_id is required
        if action_type in {
            AttendanceCorrection.ActionTypeChoices.UPDATE,
            AttendanceCorrection.ActionTypeChoices.DELETE,
        } and not attrs.get("entry_id"):
            raise serializers.ValidationError({"entry_id": _("La timbratura e' obbligatoria per questa correzione.")})

        # For ADD and UPDATE actions, entry_type and timestamp are required
        if action_type in {
            AttendanceCorrection.ActionTypeChoices.ADD,
            AttendanceCorrection.ActionTypeChoices.UPDATE,
        }:
            # Validate entry type is provided
            if not attrs.get("entry_type"):
                raise serializers.ValidationError({"entry_type": _("Il tipo timbratura e' obbligatorio.")})
            # Validate timestamp is provided
            if not attrs.get("timestamp"):
                raise serializers.ValidationError({"timestamp": _("Il timestamp e' obbligatorio.")})

        # Validate reason is not empty
        if not attrs.get("reason", "").strip():
            raise serializers.ValidationError({"reason": _("Il motivo della correzione e' obbligatorio.")})

        return attrs


# Serializer for attendance overview query parameters
class AttendanceOverviewQuerySerializer(serializers.Serializer):
    # Optional company ID filter
    company_id = serializers.UUIDField(required=False)
    # Optional user ID filter
    user_id = serializers.UUIDField(required=False)
    # Optional month filter (1-12)
    month = serializers.IntegerField(min_value=1, max_value=12, required=False)
    # Optional year filter
    year = serializers.IntegerField(min_value=2000, max_value=3000, required=False)
    # Optional review status filter
    review_status = serializers.ChoiceField(
        choices=AttendanceDayReview.StatusChoices.choices,
        required=False,
    )
    # Optional anomaly type filter
    anomaly = serializers.ChoiceField(
        choices=[
            "missing_check_out",
            "break_not_closed",
            "invalid_sequence",
            "duplicate_entries",
            "manual_adjustment",
        ],
        required=False,
    )


# Serializer for AttendancePeriod model
class AttendancePeriodSerializer(serializers.ModelSerializer):
    # Include approver info (computed)
    approved_by = serializers.SerializerMethodField()

    class Meta:
        model = AttendancePeriod
        # Include period fields
        fields = (
            "id",
            "month",
            "year",
            "status",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        )

    def get_approved_by(self, obj):
        """
        Get info about who approved the period.
        
        Args:
            obj: The AttendancePeriod instance being serialized
            
        Returns:
            Dictionary with approver details or None
        """
        # Return None if no approver recorded
        if not obj.approved_by:
            return None
        # Return approver's basic info
        return {
            "id": str(obj.approved_by.id),
            "email": obj.approved_by.email,
            "full_name": obj.approved_by.full_name,
        }


# Serializer for monthly attendance summary per employee
class MonthlyAttendanceEmployeeSummarySerializer(serializers.Serializer):
    # User ID
    user_id = serializers.UUIDField()
    # Employee name
    employee_name = serializers.CharField()
    # Month number
    month = serializers.IntegerField()
    # Year number
    year = serializers.IntegerField()
    # Total worked minutes in the month
    total_worked_minutes = serializers.IntegerField()
    # Total break minutes in the month
    total_break_minutes = serializers.IntegerField()
    # Number of anomalies detected
    anomaly_count = serializers.IntegerField()
    # Number of approved days
    approved_days = serializers.IntegerField()
    # Number of corrected days
    corrected_days = serializers.IntegerField()
    # Number of days needing review
    review_needed_days = serializers.IntegerField()
    # Daily breakdown
    days = AttendanceDayReviewSerializer(many=True)


# Serializer for ConsultantCompanyLink model
class ConsultantCompanyLinkSerializer(serializers.ModelSerializer):
    # Include full consultant user data (read-only)
    consultant = UserSerializer(read_only=True)
    # Include company summary (read-only)
    company = CompanySummarySerializer(read_only=True)

    class Meta:
        model = ConsultantCompanyLink
        # Include link details
        fields = (
            "id",
            "consultant",
            "company",
            "status",
            "requested_by",
            "created_at",
            "approved_at",
            "active",
        )


# Serializer for requesting company link by public ID
class ConsultantCompanyRequestByPublicIdSerializer(serializers.Serializer):
    # Company public identifier
    public_id = serializers.CharField(max_length=24)


# Serializer for requesting company link by consultant email
class ConsultantCompanyRequestByEmailSerializer(serializers.Serializer):
    # Consultant email address
    consultant_email = serializers.EmailField()


# Serializer for consultant company link actions (approve/reject)
class ConsultantCompanyLinkActionSerializer(serializers.Serializer):
    # ID of the link to act upon
    link_id = serializers.UUIDField()


# ============================================================
# PASSWORD RESET & EMAIL VERIFY SERIALIZERS
# ============================================================


# Serializer for password reset request
class PasswordResetRequestSerializer(serializers.Serializer):
    # User's email address
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """
        Normalize email to lowercase.
        
        Args:
            value: The email to normalize
            
        Returns:
            Lowercase email
        """
        # Don't reveal whether email exists in system (security best practice)
        return value.lower()


# Serializer for password reset confirmation
class PasswordResetConfirmSerializer(serializers.Serializer):
    # Reset token from email
    token = serializers.CharField(required=True)
    # New password (required, minimum 8 characters)
    password = serializers.CharField(required=True, min_length=8)

    def validate_password(self, value):
        """
        Validate password meets security requirements.
        
        Args:
            value: The password to validate
            
        Returns:
            The validated password
            
        Raises:
            ValidationError: If password doesn't meet requirements
        """
        # Check minimum length
        if len(value) < 8:
            raise serializers.ValidationError(_("La password deve essere almeno 8 caratteri."))
        # Check for uppercase letter
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError(_("La password deve contenere almeno una lettera maiuscola."))
        # Check for digit
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError(_("La password deve contenere almeno un numero."))
        return value


# Serializer for email verification
class EmailVerifySerializer(serializers.Serializer):
    # Verification token from email
    token = serializers.CharField(required=True)


# ============================================================
# NOTIFICATION SERIALIZERS
# ============================================================


# Serializer for Notification model - transforms notifications for API responses
class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications"""

    class Meta:
        model = Notification
        # Include all notification fields
        fields = [
            'id', 'title', 'message', 'notification_type',
            'priority', 'is_read', 'action_url', 'metadata',
            'created_at', 'read_at'
        ]
        # ID and created_at are read-only (auto-generated)
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        """
        Add relative time string for UI display.
        
        Args:
            instance: The Notification instance
            
        Returns:
            Dictionary representation with time_ago added
        """
        # Get standard serialized data
        data = super().to_representation(instance)
        # Add relative time string for UI (e.g., "2h fa")
        data['time_ago'] = self._get_time_ago(instance.created_at)
        return data

    def _get_time_ago(self, dt):
        """
        Calculate relative time string from datetime.
        
        Args:
            dt: datetime object
            
        Returns:
            String like "2g fa" (2 days ago), "3h fa" (3 hours ago), etc.
        """
        # Import Django timezone for timezone-aware now()
        from django.utils import timezone
        # Calculate difference from now
        diff = timezone.now() - dt
        # Days ago
        if diff.days > 0:
            return f"{diff.days}g fa"
        # Hours ago
        elif diff.seconds >= 3600:
            return f"{diff.seconds // 3600}h fa"
        # Minutes ago
        elif diff.seconds >= 60:
            return f"{diff.seconds // 60}m fa"
        # Just now
        return "Adesso"


# Serializer for creating notifications (internal use)
class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications (internal)"""

    class Meta:
        model = Notification
        # Include fields needed to create a notification
        fields = ['user', 'title', 'message', 'notification_type', 'priority', 'action_url', 'metadata']


# Serializer for PricingPlan model
class PricingPlanSerializer(serializers.ModelSerializer):
    """Serializer for pricing plans"""
    
    # Convert price from cents to euros (read-only computed field)
    price_eur = serializers.ReadOnlyField()
    # Convert setup fee from cents to euros (read-only computed field)
    setup_fee_eur = serializers.ReadOnlyField()
    # Convert extra employee price from cents to euros (read-only computed field)
    extra_employee_price_eur = serializers.ReadOnlyField()
    # Compute list of included features based on boolean flags
    features = serializers.SerializerMethodField()
    
    class Meta:
        model = PricingPlan
        # Include all pricing plan fields
        fields = [
            'id', 'name', 'code', 'plan_type', 'billing_cycle',
            'price_cents', 'price_eur',
            'setup_fee_cents', 'setup_fee_eur',
            'max_employees', 'max_companies',
            'include_payroll', 'include_attendance', 'include_documents',
            'include_safety', 'include_reports', 'include_api_access',
            'include_priority_support', 'include_white_label',
            'extra_employee_price_cents', 'extra_employee_price_eur',
            'is_active', 'is_highlighted', 'display_order',
            'description', 'features', 'limitations',
            'created_at', 'updated_at'
        ]
        # Auto-generated fields are read-only
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_features(self, obj):
        """
        Build a list of feature strings based on included_* boolean fields.
        
        Args:
            obj: The PricingPlan instance
            
        Returns:
            List of feature name strings
        """
        features = []
        # Check each feature flag and add to list if true
        if obj.include_payroll:
            features.append("Gestione Payroll")
        if obj.include_attendance:
            features.append("Controllo Presenze")
        if obj.include_documents:
            features.append("Gestione Documenti")
        if obj.include_safety:
            features.append("Sicurezza sul Lavoro")
        if obj.include_reports:
            features.append("Report Avanzati")
        if obj.include_api_access:
            features.append("Accesso API")
        if obj.include_priority_support:
            features.append("Supporto Prioritario")
        if obj.include_white_label:
            features.append("White Label")
        return features


# Serializer for PricingConfig model
class PricingConfigSerializer(serializers.ModelSerializer):
    """Serializer for pricing configuration"""
    
    class Meta:
        model = PricingConfig
        # Include all configuration fields
        fields = [
            'id', 'currency', 'currency_symbol',
            'yearly_discount_percent', 'trial_days',
            'terms_url', 'privacy_url',
            'is_active', 'updated_at'
        ]
        # Auto-generated fields are read-only
        read_only_fields = ['id', 'updated_at']


# ============================================================
# ADMIN SERIALIZERS
# ============================================================


# Detailed admin serializer for Company - includes statistics
class AdminCompanySerializer(serializers.ModelSerializer):
    """
    Detailed admin serializer for Company - includes statistics and history
    """
    # Count of employee profiles in this company
    employees_count = serializers.SerializerMethodField()
    # Count of users in this company
    users_count = serializers.SerializerMethodField()
    # Primary admin user details
    primary_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        # Include all company fields for admin view
        fields = [
            'id', 'name', 'public_id', 'legal_name', 'slug', 'vat_number',
            'contact_email', 'contact_phone', 'website',
            'country_code', 'city', 'state_region', 'postal_code',
            'address_line_1', 'address_line_2',
            'status', 'plan', 'billing_cycle',
            'subscription_end_date', 'max_employees',
            'current_storage_mb', 'is_active', 'is_deleted', 'deleted_at',
            'employees_count', 'users_count', 'primary_admin',
            'created_at', 'updated_at'
        ]
        # These fields are auto-generated and cannot be modified
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_employees_count(self, obj):
        """Get total count of employee profiles in the company."""
        return obj.employee_profiles.count()
    
    def get_users_count(self, obj):
        """Get total count of users in the company."""
        return obj.users.count()
    
    def get_primary_admin(self, obj):
        """
        Get the primary admin (company owner or admin, earliest by join date).
        
        Args:
            obj: The Company instance being serialized
            
        Returns:
            Dictionary with admin details or None
        """
        # Find oldest company owner or admin
        primary_admin = (
            obj.users.filter(
                role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN]
            ).order_by('date_joined').first()
        )
        if not primary_admin:
            return None
        # Return admin details
        return {
            'id': str(primary_admin.id),
            'email': primary_admin.email,
            'full_name': primary_admin.full_name,
            'role': primary_admin.role,
            'is_active': primary_admin.is_active
        }


# Compact admin serializer for Company lists
class AdminCompanyListSerializer(serializers.ModelSerializer):
    """
    Compact serializer for Company admin lists
    """
    # Count of employee profiles
    employees_count = serializers.SerializerMethodField()
    # Primary admin email only (not full details)
    primary_admin_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        # Include essential fields for list view
        fields = [
            'id', 'name', 'public_id', 'status', 'plan', 'billing_cycle',
            'subscription_end_date', 'max_employees', 'is_active', 'is_deleted',
            'employees_count', 'primary_admin_email', 'created_at'
        ]
    
    def get_employees_count(self, obj):
        """Get total count of employee profiles in the company."""
        return obj.employee_profiles.count()
    
    def get_primary_admin_email(self, obj):
        """
        Get email of the primary admin (company owner or admin, earliest by join date).
        
        Args:
            obj: The Company instance being serialized
            
        Returns:
            Admin email or None
        """
        # Find oldest company owner or admin
        primary_admin = (
            obj.users.filter(
                role__in=[User.RoleChoices.COMPANY_OWNER, User.RoleChoices.COMPANY_ADMIN]
            ).order_by('date_joined').first()
        )
        # Return email or None
        return primary_admin.email if primary_admin else None


# ============================================================
# MEDICAL SERIALIZERS
# ============================================================


# Serializer for MedicalVisit model
class MedicalVisitSerializer(serializers.ModelSerializer):
    # Get employee name as string (from the employee object)
    employee_name = serializers.SerializerMethodField()
    # Get company name directly from company relation
    company_name = serializers.SerializerMethodField()
    # Read-only boolean indicating if visit is expiring soon
    is_expiring_soon = serializers.ReadOnlyField()
    # Read-only boolean indicating if visit is overdue
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = MedicalVisit
        # Include all medical visit fields
        fields = [
            'id', 'company', 'company_name', 'employee', 'employee_name',
            'visit_type', 'status', 'scheduled_date', 'scheduled_time',
            'location', 'doctor_name', 'notes', 'completed_date', 'result',
            'next_visit_date', 'is_expiring_soon', 'is_overdue',
            'created_at', 'updated_at'
        ]
        # Auto-generated fields are read-only
        read_only_fields = ['created_at', 'updated_at']

    def get_employee_name(self, obj):
        """Get the employee's string representation."""
        return str(obj.employee)

    def get_company_name(self, obj):
        """Get the company's name."""
        return obj.company.name


# Serializer for MedicalCertificate model
class MedicalCertificateSerializer(serializers.ModelSerializer):
    # Get employee name as string
    employee_name = serializers.SerializerMethodField()
    # Get company name from company relation
    company_name = serializers.SerializerMethodField()
    # Read-only computed duration in days
    duration_days = serializers.ReadOnlyField()
    # Read-only computed active status
    is_active = serializers.ReadOnlyField()
    # Get validator's full name (if validated)
    validated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicalCertificate
        # Include all certificate fields
        fields = [
            'id', 'company', 'company_name', 'employee', 'employee_name',
            'certificate_type', 'status', 'inps_code', 'inps_protocol',
            'start_date', 'end_date', 'expected_return_date',
            'diagnosis_code', 'diagnosis_description',
            'doctor_name', 'doctor_tax_code', 'medical_facility',
            'attachment', 'content_hash', 'duration_days', 'is_active',
            'validated_by', 'validated_by_name', 'validated_at', 'validation_notes',
            'created_at', 'updated_at'
        ]
        # Auto-generated fields are read-only
        read_only_fields = ['content_hash', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        """Get the employee's string representation."""
        return str(obj.employee)

    def get_company_name(self, obj):
        """Get the company's name."""
        return obj.company.name

    def get_validated_by_name(self, obj):
        """
        Get the validator's full name or email.
        
        Args:
            obj: The MedicalCertificate instance
            
        Returns:
            Validator's full name or email, or None if not validated
        """
        if obj.validated_by:
            return obj.validated_by.get_full_name() or obj.validated_by.email
        return None


# Serializer for creating medical certificates
class MedicalCertificateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalCertificate
        # Include fields needed for certificate creation
        fields = [
            'company', 'employee', 'certificate_type', 'status',
            'inps_code', 'inps_protocol', 'start_date', 'end_date',
            'expected_return_date', 'diagnosis_code', 'diagnosis_description',
            'doctor_name', 'doctor_tax_code', 'medical_facility', 'attachment'
        ]

    def validate_inps_code(self, value):
        """
        Validate and normalize INPS code.
        
        Args:
            value: The INPS code to validate
            
        Returns:
            Uppercase INPS code if valid
            
        Raises:
            ValidationError: If code is too short
        """
        # Check minimum length
        if value and len(value) < 10:
            raise serializers.ValidationError("Codice INPS deve essere di almeno 10 caratteri")
        # Uppercase for consistency
        return value.upper()

    def validate(self, data):
        """
        Cross-field validation for certificate dates.
        
        Args:
            data: All validated fields
            
        Returns:
            Validated data if dates are valid
            
        Raises:
            ValidationError: If end_date is before start_date
        """
        # Validate end date is after start date
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError("La data fine deve essere successiva alla data inizio")
        return data


# Serializer for OfflineTimeEntry model
class OfflineTimeEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = OfflineTimeEntry
        # Include all offline time entry fields
        fields = [
            'id', 'user', 'company', 'entry_type', 'timestamp', 'source',
            'latitude', 'longitude', 'location_accuracy', 'notes',
            'sync_status', 'synced_at', 'device_id', 'app_version',
            'created_at'
        ]
        # Sync-related fields are read-only (set by system)
        read_only_fields = ['sync_status', 'synced_at', 'created_at']


# Serializer for AbsenceType model
class AbsenceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceType
        # Include all absence type fields
        fields = [
            'id', 'company', 'name', 'code', 'requires_certificate',
            'certificate_type', 'max_days_per_year', 'max_consecutive_days',
            'requires_approval', 'is_paid', 'deduction_code',
            'color', 'icon', 'is_active', 'sort_order'
        ]


# ============================================================
# SAFETY SERIALIZERS
# ============================================================


# Serializer for SafetyCourse model
class SafetyCourseSerializer(serializers.ModelSerializer):
    # Get company name from company relation
    company_name = serializers.CharField(source='company.name', read_only=True)
    # Count of employees assigned to this course
    assigned_count = serializers.SerializerMethodField()
    # Count of employees who completed the course
    completed_count = serializers.SerializerMethodField()
    # Count of employees with pending status
    pending_count = serializers.SerializerMethodField()
    # Count of employees with expired status
    expired_count = serializers.SerializerMethodField()

    class Meta:
        model = SafetyCourse
        # Include all safety course fields
        fields = [
            "id", "company", "company_name", "title", "description", "category",
            "duration_minutes", "validity_months", "is_mandatory", "content_url",
            "assigned_count", "completed_count", "pending_count", "expired_count",
            "created_at", "updated_at"
        ]
        # Auto-generated fields are read-only
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_assigned_count(self, obj):
        """Get total count of employee trainings assigned to this course."""
        return obj.employee_trainings.count()

    def get_completed_count(self, obj):
        """Get count of completed employee trainings for this course."""
        return obj.employee_trainings.filter(status='completed').count()

    def get_pending_count(self, obj):
        """Get count of pending employee trainings for this course."""
        return obj.employee_trainings.filter(status='pending').count()

    def get_expired_count(self, obj):
        """Get count of expired employee trainings for this course."""
        return obj.employee_trainings.filter(status='expired').count()


# Serializer for creating safety courses
class SafetyCourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyCourse
        # Include fields needed for course creation
        fields = [
            "company", "title", "description", "category",
            "duration_minutes", "validity_months", "is_mandatory", "content_url"
        ]


# Serializer for EmployeeTraining model
class EmployeeTrainingSerializer(serializers.ModelSerializer):
    # Get employee's full name from nested relation
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    # Get employee's code from nested relation
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    # Get course title from nested relation
    course_title = serializers.CharField(source='course.title', read_only=True)
    # Get course category from nested relation
    course_category = serializers.CharField(source='course.category', read_only=True)
    # Read-only computed field - training is expired
    is_expired = serializers.SerializerMethodField()
    # Read-only computed field - training is overdue (pending and past due date)
    is_overdue = serializers.SerializerMethodField()
    # Read-only computed field - days until due date
    days_until_due = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeTraining
        # Include all employee training fields
        fields = [
            "id", "employee", "employee_name", "employee_code",
            "course", "course_title", "course_category",
            "assigned_at", "due_date", "completed_at", "expiry_date",
            "score", "certificate_url", "status", "notes",
            "is_expired", "is_overdue", "days_until_due"
        ]
        # Auto-generated fields are read-only
        read_only_fields = ["id", "assigned_at", "completed_at", "expiry_date"]

    def get_is_expired(self, obj):
        """
        Check if the training is expired.
        
        Args:
            obj: The EmployeeTraining instance
            
        Returns:
            True if status is 'expired' or expiry_date is in the past
        """
        # Explicitly marked as expired
        if obj.status == 'expired':
            return True
        # Expiry date has passed
        if obj.expiry_date and obj.expiry_date < timezone.now():
            return True
        return False

    def get_is_overdue(self, obj):
        """
        Check if the training is overdue (pending and past due date).
        
        Args:
            obj: The EmployeeTraining instance
            
        Returns:
            True if status is 'pending' and due_date is in the past
        """
        if obj.status == 'pending' and obj.due_date < timezone.now().date():
            return True
        return False

    def get_days_until_due(self, obj):
        """
        Calculate days until due date.
        
        Args:
            obj: The EmployeeTraining instance
            
        Returns:
            Number of days until due, or None if already completed
        """
        # Return None for completed trainings
        if obj.status == 'completed':
            return None
        # Calculate and return days until due
        delta = obj.due_date - timezone.now().date()
        return delta.days


# Serializer for SafetyInspection model
class SafetyInspectionSerializer(serializers.ModelSerializer):
    # Get company name from company relation
    company_name = serializers.CharField(source='company.name', read_only=True)
    # Get inspector's full name from nested relation (allows None)
    inspector_name = serializers.CharField(source='inspector.full_name', read_only=True, default=None)
    # Read-only computed field - inspection is overdue
    is_overdue = serializers.SerializerMethodField()
    # Read-only computed field - days until scheduled date
    days_until_scheduled = serializers.SerializerMethodField()

    class Meta:
        model = SafetyInspection
        # Include all safety inspection fields
        fields = [
            "id", "company", "company_name", "location", "inspector", "inspector_name",
            "scheduled_date", "completed_date", "status", "findings",
            "risk_level", "corrective_actions", "created_at", "updated_at",
            "is_overdue", "days_until_scheduled"
        ]
        # Auto-generated fields are read-only
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_is_overdue(self, obj):
        """
        Check if inspection is overdue (scheduled but past date).
        
        Args:
            obj: The SafetyInspection instance
            
        Returns:
            True if status is 'scheduled' and scheduled_date is in the past
        """
        if obj.status == 'scheduled' and obj.scheduled_date < timezone.now().date():
            return True
        return False

    def get_days_until_scheduled(self, obj):
        """
        Calculate days until scheduled date.
        
        Args:
            obj: The SafetyInspection instance
            
        Returns:
            Number of days until scheduled date (can be negative if past)
        """
        delta = obj.scheduled_date - timezone.now().date()
        return delta.days


# Serializer for SafetyAlert model
class SafetyAlertSerializer(serializers.ModelSerializer):
    # Get company name from company relation
    company_name = serializers.CharField(source='company.name', read_only=True)
    # Get employee's full name from nested relation (allows None)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True, default=None)
    # Read-only boolean conversion of is_read (for consistent naming)
    is_read_boolean = serializers.SerializerMethodField()
    # Read-only computed field - days until due date
    days_until_due = serializers.SerializerMethodField()

    class Meta:
        model = SafetyAlert
        # Include all safety alert fields
        fields = [
            "id", "company", "company_name", "employee", "employee_name",
            "alert_type", "title", "message", "severity",
            "is_read", "is_read_boolean", "due_date", "days_until_due",
            "created_at", "read_at"
        ]
        # Auto-generated fields are read-only
        read_only_fields = ["id", "created_at", "read_at"]

    def get_is_read_boolean(self, obj):
        """
        Convert is_read to boolean (ensures consistent type in response).
        
        Args:
            obj: The SafetyAlert instance
            
        Returns:
            Boolean value of is_read
        """
        returnobj.is_read

    def get_days_until_due(self, obj):
        """
        Calculate days until due date.
        
        Args:
            obj: The SafetyAlert instance
            
        Returns:
            Number of days until due, or None if no due date set
        """
        if not obj.due_date:
            return None
        delta = obj.due_date - timezone.now().date()
        return delta.days


# ============================================================
# PAYROLL SERIALIZERS
# ============================================================


# Compact serializer for Company in payroll context
class PayrollCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        # Include essential company fields only
        fields = ("id", "name", "public_id", "status")


# Serializer for EmployeeProfile in payroll context
class PayrollEmployeeSerializer(serializers.ModelSerializer):
    # Include computed full name
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = EmployeeProfile
        # Include employee identification fields
        fields = ("id", "employee_code", "first_name", "last_name", "full_name", "status")


# Serializer for User in payroll context
class PayrollUserSerializer(serializers.ModelSerializer):
    # Include computed full name
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        # Include user identification fields
        fields = ("id", "email", "first_name", "last_name", "full_name", "role")


# Serializer for Document model
class DocumentSerializer(serializers.ModelSerializer):
    # Include nested company data (read-only)
    company = PayrollCompanySerializer(read_only=True)
    # Include nested employee data (read-only)
    employee = PayrollEmployeeSerializer(read_only=True)
    # Include nested uploaded_by user data (read-only)
    uploaded_by = PayrollUserSerializer(read_only=True)
    # Extract original filename from metadata (read-only computed)
    original_filename = serializers.SerializerMethodField()

    class Meta:
        model = Document
        # Include all document fields
        fields = (
            "id", "company", "employee", "uploaded_by", "category", "title",
            "description", "mime_type", "file_size", "visibility", "status",
            "original_filename", "metadata", "created_at", "updated_at", "archived_at",
        )

    def get_original_filename(self, obj):
        """
        Extract original filename from metadata dictionary.
        
        Args:
            obj: The Document instance
            
        Returns:
            Original filename or empty string if not present
        """
        return obj.metadata.get("original_filename", "")


# Serializer for PayrollDocumentLink model
class PayrollDocumentLinkSerializer(serializers.ModelSerializer):
    # Include nested document data (read-only)
    document = DocumentSerializer(read_only=True)

    class Meta:
        model = PayrollDocumentLink
        # Include link fields
        fields = ("id", "role_in_workflow", "document", "created_at")


# Serializer for PayrollRun model
class PayrollRunSerializer(serializers.ModelSerializer):
    # Include nested company data (read-only)
    company = PayrollCompanySerializer(read_only=True)
    # Include nested employee data (read-only)
    employee = PayrollEmployeeSerializer(read_only=True)
    # Include nested labor consultant data (read-only)
    labor_consultant = PayrollUserSerializer(read_only=True)
    # Include related documents (computed)
    documents = serializers.SerializerMethodField()

    class Meta:
        model = PayrollRun
        # Include all payroll run fields
        fields = (
            "id", "company", "employee", "labor_consultant", "month", "year",
            "status", "notes_company", "notes_consultant", "period_reference",
            "metadata", "approved_at", "delivered_at", "created_at", "updated_at", "documents",
        )

    def get_documents(self, obj):
        """
        Get all documents linked to this payroll run.
        
        Args:
            obj: The PayrollRun instance
            
        Returns:
            List of serialized document links
        """
        # Eagerly load document and related data to avoid N+1 queries
        links = obj.document_links.select_related(
            "document", "document__company", "document__employee",
            "document__employee__user", "document__uploaded_by",
        ).all()
        # Serialize the document links
        return PayrollDocumentLinkSerializer(links, many=True, context=self.context).data


# Query serializer for payroll runs
class PayrollQuerySerializer(serializers.Serializer):
    # Optional company ID filter
    company_id = serializers.UUIDField(required=False)
    # Optional employee ID filter
    employee_id = serializers.UUIDField(required=False)
    # Optional month filter (1-12)
    month = serializers.IntegerField(min_value=1, max_value=12, required=False)
    # Optional year filter
    year = serializers.IntegerField(min_value=2000, max_value=3000, required=False)
    # Optional status filter
    status = serializers.ChoiceField(choices=PayrollRun.StatusChoices.choices, required=False)


# Query serializer for documents
class DocumentQuerySerializer(serializers.Serializer):
    # Optional company ID filter
    company_id = serializers.UUIDField(required=False)
    # Optional employee ID filter
    employee_id = serializers.UUIDField(required=False)
    # Optional status filter
    status = serializers.ChoiceField(choices=Document.StatusChoices.choices, required=False)


# Serializer for creating payroll runs
class PayrollRunCreateSerializer(serializers.Serializer):
    # Optional company ID (auto-set from context if not provided)
    company_id = serializers.UUIDField(required=False)
    # Required employee ID
    employee_id = serializers.UUIDField()
    # Optional labor consultant ID
    labor_consultant_id = serializers.UUIDField(required=False, allow_null=True)
    # Required month (1-12)
    month = serializers.IntegerField(min_value=1, max_value=12)
    # Required year
    year = serializers.IntegerField(min_value=2000, max_value=3000)
    # Optional company notes
    notes_company = serializers.CharField(required=False, allow_blank=True)
    # Optional consultant notes
    notes_consultant = serializers.CharField(required=False, allow_blank=True)
    # Optional period reference string
    period_reference = serializers.CharField(required=False, allow_blank=True, max_length=120)
    # Optional JSON metadata
    metadata = serializers.JSONField(required=False)


# Serializer for updating payroll runs
class PayrollRunUpdateSerializer(serializers.Serializer):
    # Optional labor consultant ID
    labor_consultant_id = serializers.UUIDField(required=False, allow_null=True)
    # Optional company notes
    notes_company = serializers.CharField(required=False, allow_blank=True)
    # Optional consultant notes
    notes_consultant = serializers.CharField(required=False, allow_blank=True)
    # Optional period reference string
    period_reference = serializers.CharField(required=False, allow_blank=True, max_length=120)
    # Optional JSON metadata
    metadata = serializers.JSONField(required=False)


# Serializer for changing payroll run status
class PayrollStatusChangeSerializer(serializers.Serializer):
    # New status (required)
    status = serializers.ChoiceField(choices=PayrollRun.StatusChoices.choices)
    # Optional note about the status change
    note = serializers.CharField(required=False, allow_blank=True)


# Serializer for attaching documents to payroll runs
class PayrollAttachDocumentSerializer(serializers.Serializer):
    # Document ID to attach (required)
    document_id = serializers.UUIDField()
    # Role of the document in the workflow (defaults to ATTACHMENT)
    role_in_workflow = serializers.ChoiceField(
        choices=PayrollDocumentLink.RoleInWorkflowChoices.choices,
        default=PayrollDocumentLink.RoleInWorkflowChoices.ATTACHMENT,
        required=False,
    )


# Serializer for monthly payroll summary row
class PayrollMonthlySummaryRowSerializer(serializers.Serializer):
    # Employee ID
    employee_id = serializers.UUIDField()
    # Employee name
    employee_name = serializers.CharField()
    # Month number
    month = serializers.IntegerField()
    # Year number
    year = serializers.IntegerField()
    # Total payroll runs count
    runs = serializers.IntegerField()
    # Approved runs count
    approved_runs = serializers.IntegerField()
    # Delivered runs count
    delivered_runs = serializers.IntegerField()
    # Archived runs count
    archived_runs = serializers.IntegerField()
    # Documents count for this employee/month
    documents_count = serializers.IntegerField()


# Serializer for creating documents
class DocumentCreateSerializer(serializers.Serializer):
    # Optional company ID
    company_id = serializers.UUIDField(required=False)
    # Optional employee ID
    employee_id = serializers.UUIDField(required=False, allow_null=True)
    # Optional payroll run ID to link document to
    payroll_run_id = serializers.UUIDField(required=False, allow_null=True)
    # Role in payroll workflow (defaults to ATTACHMENT)
    role_in_workflow = serializers.ChoiceField(
        choices=PayrollDocumentLink.RoleInWorkflowChoices.choices,
        default=PayrollDocumentLink.RoleInWorkflowChoices.ATTACHMENT,
        required=False,
    )
    # Document category (required)
    category = serializers.ChoiceField(choices=Document.CategoryChoices.choices)
    # Document title (required)
    title = serializers.CharField(max_length=255)
    # Optional description
    description = serializers.CharField(required=False, allow_blank=True)
    # The file itself (required)
    file = serializers.FileField()
    # Visibility setting (required)
    visibility = serializers.ChoiceField(choices=Document.VisibilityChoices.choices)
    # Document status - defaults to ACTIVE
    status = serializers.ChoiceField(choices=Document.StatusChoices.choices, default=Document.StatusChoices.ACTIVE, required=False)
    # Optional JSON metadata
    metadata = serializers.JSONField(required=False)


# Serializer for updating documents
class DocumentUpdateSerializer(serializers.Serializer):
    # Optional new title
    title = serializers.CharField(max_length=255, required=False)
    # Optional new description
    description = serializers.CharField(required=False, allow_blank=True)
    # Optional new visibility
    visibility = serializers.ChoiceField(choices=Document.VisibilityChoices.choices, required=False)
    # Optional new status
    status = serializers.ChoiceField(choices=Document.StatusChoices.choices, required=False)
    # Optional new metadata
    metadata = serializers.JSONField(required=False)


# ============================================================
# ONBOARDING SERIALIZERS
# ============================================================


# Serializer for OnboardingProgress model
class OnboardingProgressSerializer(serializers.ModelSerializer):
    # Computed steps for this role (read-only)
    steps = serializers.SerializerMethodField()
    # Computed progress percentage (read-only)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = OnboardingProgress
        # Include all onboarding progress fields
        fields = ['id', 'role', 'current_step', 'completed_steps', 'is_completed', 
                 'steps', 'progress_percentage', 'created_at', 'updated_at']
        # Auto-generated fields are read-only
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_steps(self, obj):
        """Get the onboarding steps for this user's role."""
        return OnboardingProgress.get_steps_for_role(obj.role)
    
    def get_progress_percentage(self, obj):
        """Calculate and return the progress percentage."""
        return obj.get_progress_percentage()


# Serializer for OnboardingTask model
class OnboardingTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingTask
        # Include all task fields
        fields = ['id', 'title', 'description', 'action_url', 'is_completed', 
                 'completed_at', 'order']
        # Auto-generated fields are read-only
        read_only_fields = ['id', 'completed_at']


# ============================================================
# AUTOMATION SERIALIZERS
# ============================================================


# Serializer for AutomationRule model
class AutomationRuleSerializer(serializers.ModelSerializer):
    """Serializer for automation rules"""

    class Meta:
        model = AutomationRule
        # Include all automation rule fields
        fields = [
            'id', 'name', 'description', 'trigger_type', 'conditions',
            'action_type', 'action_payload', 'is_active', 'last_run_at',
            'created_at', 'updated_at'
        ]
        # Auto-generated fields are read-only
        read_only_fields = ['id', 'last_run_at', 'created_at', 'updated_at']


# Serializer for Task model
class TaskSerializer(serializers.ModelSerializer):
    """Serializer for automation tasks"""

    # Get assigned user's name (computed)
    assigned_to_name = serializers.SerializerMethodField()
    # Get creator's name (computed)
    created_by_name = serializers.SerializerMethodField()
    # Get source rule's name (computed)
    source_rule_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        # Include all task fields
        fields = [
            'id', 'company', 'assigned_to', 'assigned_to_name', 'title',
            'description', 'status', 'priority', 'due_date', 'completed_at',
            'created_by', 'created_by_name', 'source_rule', 'source_rule_name',
            'metadata', 'created_at', 'updated_at'
        ]
        # Auto-generated fields are read-only
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        """
        Get the assigned user's display name.
        
        Args:
            obj: The Task instance
            
        Returns:
            User's full name or email, or None if not assigned
        """
        if obj.assigned_to:
            return obj.assigned_to.full_name or obj.assigned_to.email
        return None

    def get_created_by_name(self, obj):
        """
        Get the creator's display name.
        
        Args:
            obj: The Task instance
            
        Returns:
            User's full name or email, or None if not found
        """
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.email
        return None

    def get_source_rule_name(self, obj):
        """
        Get the source automation rule's name.
        
        Args:
            obj: The Task instance
            
        Returns:
            Rule name or None if not from a rule
        """
        if obj.source_rule:
            return obj.source_rule.name
        return None
