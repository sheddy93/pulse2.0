"""
PulseHR Models - Modular Package
================================

This package contains all Django models organized by domain:
- _base.py: BaseModel, SoftDeleteModel, TimestampedModel
- _choices.py: All TextChoices enumerations
- company.py: Company, Department, OfficeLocation
- users.py: User, UserCompanyAccess
- roles.py: Role, Permission, CompanyRole
- employee.py: EmployeeProfile, ConsultantCompanyLink
- attendance.py: TimeEntry, AttendanceDayReview, AttendancePeriod, AttendanceCorrection, OfflineTimeEntry, AbsenceType
- leave.py: LeaveType, LeaveBalance, LeaveRequest
- documents.py: Document
- payroll.py: PayrollRun, PayrollDocumentLink
- notifications.py: Notification, UserDeviceToken
- billing.py: PricingPlan, PricingConfig, StripeCustomer, StripeEvent
- automation.py: AutomationRule, Task
- safety.py: SafetyCourse, EmployeeTraining, SafetyInspection, SafetyAlert
- medical.py: MedicalVisit, MedicalCertificate
- audit.py: AuditLog
- signature.py: SignatureRequest, DocumentReceipt, SignatureLog
- sso.py: SSOProvider, SSOSession, SSOUserLink
- onboarding.py: OnboardingProgress, OnboardingTask

All models are also re-exported from the parent users.models module for backward compatibility.
"""

# Base classes
from ._base import BaseModel, SoftDeleteModel, TimestampedModel

# Choices
from ._choices import (
    AttendanceCorrectionActionTypeChoices,
    AttendanceDayReviewStatusChoices,
    AttendancePeriodStatusChoices,
    CompanyBillingCycleChoices,
    CompanyStatusChoices,
    ConsultantLinkRequestedByChoices,
    ConsultantLinkStatusChoices,
    EmployeeStatusChoices,
    LeaveRequestStatusChoices,
    LeaveTypeTypeChoices,
    NotificationPriorityChoices,
    NotificationTypeChoices,
    OfflineTimeEntrySyncStatusChoices,
    PricingBillingCycleChoices,
    PricingPlanTypeChoices,
    RoleScopeChoices,
    SafetyAlertSeverityChoices,
    SafetyAlertTypeChoices,
    SafetyCourseCategoryChoices,
    SafetyInspectionRiskLevelChoices,
    SafetyInspectionStatusChoices,
    StripeSubscriptionStatusChoices,
    TaskPriorityChoices,
    TaskStatusChoices,
    TimeEntryLocationSourceChoices,
    TimeEntrySourceChoices,
    TimeEntryTypeChoices,
    UserCompanyAccessScopeChoices,
    UserDeviceTypeChoices,
    UserRoleChoices,
    AuditLogActionChoices,
    AutomationActionTypeChoices,
    AutomationTriggerTypeChoices,
    EmployeeTrainingStatusChoices,
    MedicalCertificateStatusChoices,
    MedicalCertificateTypeChoices,
    MedicalVisitStatusChoices,
    MedicalVisitTypeChoices,
    OnboardingRoleTypeChoices,
    DocumentCategoryChoices,
    DocumentStatusChoices,
    DocumentVisibilityChoices,
    PayrollDocumentRoleChoices,
    PayrollRunStatusChoices,
)

# Company models
from .company import (
    Company,
    Department,
    OfficeLocation,
    protected_document_upload_to,
)

# User models
from .users import (
    User,
    UserCompanyAccess,
)

# Role models
from .roles import (
    Role,
    Permission,
    CompanyRole,
)

# Employee models
from .employee import (
    EmployeeProfile,
    ConsultantCompanyLink,
)

# Attendance models
from .attendance import (
    TimeEntry,
    AttendanceDayReview,
    AttendancePeriod,
    AttendanceCorrection,
    OfflineTimeEntry,
    AbsenceType,
)

# Leave models
from .leave import (
    LeaveType,
    LeaveBalance,
    LeaveRequest,
)

# Document models
from .documents import (
    Document,
)

# Payroll models
from .payroll import (
    PayrollRun,
    PayrollDocumentLink,
)

# Notification models
from .notifications import (
    Notification,
    UserDeviceToken,
)

# Billing/Pricing models
from .billing import (
    PricingPlan,
    PricingConfig,
    StripeCustomer,
    StripeEvent,
)

# Automation models
from .automation import (
    AutomationRule,
    Task,
)

# Safety models
from .safety import (
    SafetyCourse,
    EmployeeTraining,
    SafetyInspection,
    SafetyAlert,
    generate_safety_alerts_for_company,
)

# Medical models
from .medical import (
    MedicalVisit,
    MedicalCertificate,
)

# Audit models
from .audit import (
    AuditLog,
)

# Onboarding models
from .onboarding import (
    OnboardingProgress,
    OnboardingTask,
)

# Signature models
from .signature import (
    SignatureRequest,
    DocumentReceipt,
    SignatureLog,
)

# SSO models
from .sso import (
    SSOProvider,
    SSOSession,
    SSOUserLink,
)

# Re-export for backward compatibility
__all__ = [
    # Base
    'BaseModel',
    'SoftDeleteModel',
    'TimestampedModel',

    # Company
    'Company',
    'Department',
    'OfficeLocation',
    'protected_document_upload_to',

    # Users
    'User',
    'UserCompanyAccess',

    # Roles
    'Role',
    'Permission',
    'CompanyRole',

    # Employee
    'EmployeeProfile',
    'ConsultantCompanyLink',

    # Attendance
    'TimeEntry',
    'AttendanceDayReview',
    'AttendancePeriod',
    'AttendanceCorrection',
    'OfflineTimeEntry',
    'AbsenceType',

    # Leave
    'LeaveType',
    'LeaveBalance',
    'LeaveRequest',

    # Documents
    'Document',

    # Payroll
    'PayrollRun',
    'PayrollDocumentLink',

    # Notifications
    'Notification',
    'UserDeviceToken',

    # Billing
    'PricingPlan',
    'PricingConfig',
    'StripeCustomer',
    'StripeEvent',

    # Automation
    'AutomationRule',
    'Task',

    # Safety
    'SafetyCourse',
    'EmployeeTraining',
    'SafetyInspection',
    'SafetyAlert',
    'generate_safety_alerts_for_company',

    # Medical
    'MedicalVisit',
    'MedicalCertificate',

    # Audit
    'AuditLog',

    # Onboarding
    'OnboardingProgress',
    'OnboardingTask',

    # Signature
    'SignatureRequest',
    'DocumentReceipt',
    'SignatureLog',

    # SSO
    'SSOProvider',
    'SSOSession',
    'SSOUserLink',

    # Choices - for convenience
    'UserRoleChoices',
    'CompanyStatusChoices',
    'CompanyBillingCycleChoices',
    'EmployeeStatusChoices',
    'TimeEntryTypeChoices',
    'TimeEntrySourceChoices',
    'AttendanceDayReviewStatusChoices',
    'AttendancePeriodStatusChoices',
    'AttendanceCorrectionActionTypeChoices',
    'LeaveTypeTypeChoices',
    'LeaveRequestStatusChoices',
    'DocumentCategoryChoices',
    'DocumentVisibilityChoices',
    'DocumentStatusChoices',
    'PayrollRunStatusChoices',
    'PayrollDocumentRoleChoices',
    'AuditLogActionChoices',
    'NotificationPriorityChoices',
    'NotificationTypeChoices',
    'UserDeviceTypeChoices',
    'PricingPlanTypeChoices',
    'PricingBillingCycleChoices',
    'StripeSubscriptionStatusChoices',
    'MedicalVisitTypeChoices',
    'MedicalVisitStatusChoices',
    'MedicalCertificateTypeChoices',
    'MedicalCertificateStatusChoices',
    'OnboardingRoleTypeChoices',
    'AutomationTriggerTypeChoices',
    'AutomationActionTypeChoices',
    'TaskStatusChoices',
    'TaskPriorityChoices',
    'SafetyCourseCategoryChoices',
    'EmployeeTrainingStatusChoices',
    'SafetyInspectionStatusChoices',
    'SafetyInspectionRiskLevelChoices',
    'SafetyAlertTypeChoices',
    'SafetyAlertSeverityChoices',
    'RoleScopeChoices',
    'UserCompanyAccessScopeChoices',
    'ConsultantLinkStatusChoices',
    'ConsultantLinkRequestedByChoices',
    'OfflineTimeEntrySyncStatusChoices',
    'TimeEntryLocationSourceChoices',
]

# Import signals to register Django signal handlers
from . import signals  # noqa: E402