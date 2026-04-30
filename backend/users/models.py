"""
PulseHR Models - Backward Compatibility Module
===============================================

This module exists for backward compatibility.
All models have been moved to the models/ package.
Please import from users.models directly or from specific submodules.

Example:
    # Old way (still works for backward compatibility)
    from users.models import User, Company

    # New recommended way
    from users.models.users import User
    from users.models.company import Company
"""

# Re-export everything from the new modular structure for backward compatibility
from .models import (
    # Base
    BaseModel,
    SoftDeleteModel,
    TimestampedModel,

    # Company
    Company,
    Department,
    OfficeLocation,
    protected_document_upload_to,

    # Users
    User,
    UserCompanyAccess,

    # Roles
    Role,
    Permission,
    CompanyRole,

    # Employee
    EmployeeProfile,
    ConsultantCompanyLink,

    # Attendance
    TimeEntry,
    AttendanceDayReview,
    AttendancePeriod,
    AttendanceCorrection,
    OfflineTimeEntry,
    AbsenceType,

    # Leave
    LeaveType,
    LeaveBalance,
    LeaveRequest,

    # Documents
    Document,

    # Payroll
    PayrollRun,
    PayrollDocumentLink,

    # Notifications
    Notification,
    UserDeviceToken,

    # Billing
    PricingPlan,
    PricingConfig,
    StripeCustomer,
    StripeEvent,

    # Automation
    AutomationRule,
    Task,

    # Safety
    SafetyCourse,
    EmployeeTraining,
    SafetyInspection,
    SafetyAlert,
    generate_safety_alerts_for_company,

    # Medical
    MedicalVisit,
    MedicalCertificate,

    # Audit
    AuditLog,

    # Onboarding
    OnboardingProgress,
    OnboardingTask,

    # Signature
    SignatureRequest,
    DocumentReceipt,
    SignatureLog,

    # SSO
    SSOProvider,
    SSOSession,
    SSOUserLink,

    # Choices
    UserRoleChoices,
    CompanyStatusChoices,
    CompanyBillingCycleChoices,
    EmployeeStatusChoices,
    TimeEntryTypeChoices,
    TimeEntrySourceChoices,
    AttendanceDayReviewStatusChoices,
    AttendancePeriodStatusChoices,
    AttendanceCorrectionActionTypeChoices,
    LeaveTypeTypeChoices,
    LeaveRequestStatusChoices,
    DocumentCategoryChoices,
    DocumentVisibilityChoices,
    DocumentStatusChoices,
    PayrollRunStatusChoices,
    PayrollDocumentRoleChoices,
    AuditLogActionChoices,
    NotificationPriorityChoices,
    NotificationTypeChoices,
    UserDeviceTypeChoices,
    PricingPlanTypeChoices,
    PricingBillingCycleChoices,
    StripeSubscriptionStatusChoices,
    MedicalVisitTypeChoices,
    MedicalVisitStatusChoices,
    MedicalCertificateTypeChoices,
    MedicalCertificateStatusChoices,
    OnboardingRoleTypeChoices,
    AutomationTriggerTypeChoices,
    AutomationActionTypeChoices,
    TaskStatusChoices,
    TaskPriorityChoices,
    SafetyCourseCategoryChoices,
    EmployeeTrainingStatusChoices,
    SafetyInspectionStatusChoices,
    SafetyInspectionRiskLevelChoices,
    SafetyAlertTypeChoices,
    SafetyAlertSeverityChoices,
    RoleScopeChoices,
    UserCompanyAccessScopeChoices,
    ConsultantLinkStatusChoices,
    ConsultantLinkRequestedByChoices,
    OfflineTimeEntrySyncStatusChoices,
    TimeEntryLocationSourceChoices,
)

__all__ = [
    'BaseModel',
    'SoftDeleteModel',
    'TimestampedModel',
    'Company',
    'Department',
    'OfficeLocation',
    'protected_document_upload_to',
    'User',
    'UserCompanyAccess',
    'Role',
    'Permission',
    'CompanyRole',
    'EmployeeProfile',
    'ConsultantCompanyLink',
    'TimeEntry',
    'AttendanceDayReview',
    'AttendancePeriod',
    'AttendanceCorrection',
    'OfflineTimeEntry',
    'AbsenceType',
    'LeaveType',
    'LeaveBalance',
    'LeaveRequest',
    'Document',
    'PayrollRun',
    'PayrollDocumentLink',
    'Notification',
    'UserDeviceToken',
    'PricingPlan',
    'PricingConfig',
    'StripeCustomer',
    'StripeEvent',
    'AutomationRule',
    'Task',
    'SafetyCourse',
    'EmployeeTraining',
    'SafetyInspection',
    'SafetyAlert',
    'generate_safety_alerts_for_company',
    'MedicalVisit',
    'MedicalCertificate',
    'AuditLog',
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