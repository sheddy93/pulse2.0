"""
Choice classes for PulseHR models.
Contains all TextChoices enumerations used across the application.
"""

from django.db import models

# ============================================================
# COMPANY CHOICES
# ============================================================

class CompanyStatusChoices(models.TextChoices):
    """Company status for lifecycle management"""
    ACTIVE = "active", "Active"
    SUSPENDED = "suspended", "Suspended"
    INACTIVE = "inactive", "Inactive"
    TRIAL = "trial", "Trial"
    CANCELLED = "cancelled", "Cancelled"


class CompanyBillingCycleChoices(models.TextChoices):
    """Billing cycle options for subscriptions"""
    MONTHLY = "monthly", "Monthly"
    YEARLY = "yearly", "Yearly"


# ============================================================
# USER / ROLE CHOICES
# ============================================================

class UserRoleChoices(models.TextChoices):
    """User role classifications"""
    SUPER_ADMIN = "super_admin", "Super Admin"
    PLATFORM_OWNER = "platform_owner", "Platform Owner"
    COMPANY_OWNER = "company_owner", "Company Owner"
    COMPANY_ADMIN = "company_admin", "Company Admin"
    HR_MANAGER = "hr_manager", "HR Manager"
    MANAGER = "manager", "Manager"
    EXTERNAL_CONSULTANT = "external_consultant", "External Consultant"
    LABOR_CONSULTANT = "labor_consultant", "Labor Consultant"
    SAFETY_CONSULTANT = "safety_consultant", "Safety Consultant"
    EMPLOYEE = "employee", "Employee"


class RoleScopeChoices(models.TextChoices):
    """Role scope: global vs company-scoped"""
    GLOBAL = "global", "Global"
    COMPANY = "company", "Company"


class UserCompanyAccessScopeChoices(models.TextChoices):
    """Access scope levels for user-company relationships"""
    FULL = "full", "Full"
    LIMITED = "limited", "Limited"
    READ_ONLY = "read_only", "Read Only"


# ============================================================
# CONSULTANT LINK CHOICES
# ============================================================

class ConsultantLinkStatusChoices(models.TextChoices):
    """Status of consultant-company link requests"""
    PENDING_COMPANY = "pending_company", "Pending Company"
    PENDING_CONSULTANT = "pending_consultant", "Pending Consultant"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class ConsultantLinkRequestedByChoices(models.TextChoices):
    """Who initiated the consultant-company link request"""
    CONSULTANT = "consultant", "Consultant"
    COMPANY = "company", "Company"


# ============================================================
# EMPLOYEE CHOICES
# ============================================================

class EmployeeStatusChoices(models.TextChoices):
    """Employee employment status"""
    ACTIVE = "active", "Active"
    SUSPENDED = "suspended", "Suspended"
    INACTIVE = "inactive", "Inactive"


# ============================================================
# ATTENDANCE CHOICES
# ============================================================

class TimeEntryTypeChoices(models.TextChoices):
    """Type of time entry records"""
    CHECK_IN = "check_in", "Check In"
    BREAK_START = "break_start", "Break Start"
    BREAK_END = "break_end", "Break End"
    CHECK_OUT = "check_out", "Check Out"


class TimeEntrySourceChoices(models.TextChoices):
    """Source of time entry"""
    WEB = "web", "Web"
    MOBILE = "mobile", "Mobile"


class TimeEntryLocationSourceChoices(models.TextChoices):
    """How location was determined"""
    GPS = "gps", "GPS"
    NETWORK = "network", "Network"
    MANUAL = "manual", "Manuale"
    OFFICE_WIFI = "office_wifi", "Office WiFi"


class AttendanceDayReviewStatusChoices(models.TextChoices):
    """Daily attendance review status"""
    DRAFT = "draft", "Draft"
    REVIEW_NEEDED = "review_needed", "Review Needed"
    APPROVED = "approved", "Approved"
    CORRECTED = "corrected", "Corrected"


class AttendancePeriodStatusChoices(models.TextChoices):
    """Monthly attendance period status"""
    OPEN = "open", "Open"
    IN_REVIEW = "in_review", "In Review"
    APPROVED = "approved", "Approved"
    CLOSED = "closed", "Closed"
    EXPORTED = "exported", "Exported"


class AttendanceCorrectionActionTypeChoices(models.TextChoices):
    """Action type for attendance corrections"""
    ADD = "add", "Add"
    UPDATE = "update", "Update"
    DELETE = "delete", "Delete"


class OfflineTimeEntrySyncStatusChoices(models.TextChoices):
    """Sync status for offline time entries"""
    PENDING = 'pending', 'In attesa sync'
    SYNCING = 'syncing', 'In sincronizzazione'
    SYNCED = 'synced', 'Sincronizzato'
    FAILED = 'failed', 'Fallito'


# ============================================================
# DOCUMENT CHOICES
# ============================================================

class DocumentCategoryChoices(models.TextChoices):
    """Document category classifications"""
    PAYROLL_DOCUMENT = "payroll_document", "Payroll Document"
    EMPLOYEE_DOCUMENT = "employee_document", "Employee Document"
    COMPANY_DOCUMENT = "company_document", "Company Document"
    SAFETY_DOCUMENT = "safety_document", "Safety Document"
    OTHER = "other", "Other"


class DocumentVisibilityChoices(models.TextChoices):
    """Document access visibility levels"""
    COMPANY_ONLY = "company_only", "Company Only"
    CONSULTANT_ONLY = "consultant_only", "Consultant Only"
    COMPANY_AND_CONSULTANT = "company_and_consultant", "Company and Consultant"
    EMPLOYEE_ONLY = "employee_only", "Employee Only"
    EMPLOYEE_AND_COMPANY = "employee_and_company", "Employee and Company"
    EMPLOYEE_COMPANY_CONSULTANT = "employee_company_consultant", "Employee Company Consultant"


class DocumentStatusChoices(models.TextChoices):
    """Document status"""
    DRAFT = "draft", "Draft"
    ACTIVE = "active", "Active"
    ARCHIVED = "archived", "Archived"


# ============================================================
# PAYROLL CHOICES
# ============================================================

class PayrollRunStatusChoices(models.TextChoices):
    """Payroll run processing status"""
    DRAFT = "draft", "Draft"
    WAITING_DOCUMENTS = "waiting_documents", "Waiting Documents"
    IN_PROGRESS = "in_progress", "In Progress"
    READY_FOR_REVIEW = "ready_for_review", "Ready For Review"
    APPROVED_BY_COMPANY = "approved_by_company", "Approved By Company"
    DELIVERED_TO_EMPLOYEE = "delivered_to_employee", "Delivered To Employee"
    CORRECTION_REQUESTED = "correction_requested", "Correction Requested"
    ARCHIVED = "archived", "Archived"


class PayrollDocumentRoleChoices(models.TextChoices):
    """Role of document in payroll workflow"""
    INPUT = "input", "Input"
    OUTPUT = "output", "Output"
    ATTACHMENT = "attachment", "Attachment"
    FINAL_PAYSLIP = "final_payslip", "Final Payslip"


# ============================================================
# LEAVE CHOICES
# ============================================================

class LeaveTypeTypeChoices(models.TextChoices):
    """Leave type categories"""
    VACATION = "vacation", "Ferie"
    SICK = "sick", "Malattia"
    PERSONAL = "personal", "Permesso personale"
    MATERNITY = "maternity", "Maternita"
    PATERNITY = "paternity", "Paternita"
    BEREAVEMENT = "bereavement", "Lutto"
    UNPAID = "unpaid", "Non retribuito"
    OTHER = "other", "Altro"


class LeaveRequestStatusChoices(models.TextChoices):
    """Leave request status"""
    PENDING = "pending", "In attesa"
    APPROVED = "approved", "Approvato"
    REJECTED = "rejected", "Rifiutato"
    CANCELLED = "cancelled", "Annullato"


# ============================================================
# AUDIT LOG CHOICES
# ============================================================

class AuditLogActionChoices(models.TextChoices):
    """Audit log action types for compliance tracking"""
    COMPANY_CREATED = "company_created", "Company Created"
    COMPANY_REGISTERED = "company_registered", "Company Registered"
    COMPANY_SUSPENDED = "company_suspended", "Company Suspended"
    COMPANY_REACTIVATED = "company_reactivated", "Company Reactivated"
    COMPANY_DEACTIVATED = "company_deactivated", "Company Deactivated"
    COMPANY_SOFT_DELETED = "company_soft_deleted", "Company Soft Deleted"
    COMPANY_ACCESS_RESET = "company_access_reset", "Company Access Reset"
    COMPANY_USER_CREATED = "company_user_created", "Company User Created"
    COMPANY_USER_UPDATED = "company_user_updated", "Company User Updated"
    COMPANY_USER_DISABLED = "company_user_disabled", "Company User Disabled"
    ROLE_ASSIGNED = "role_assigned", "Role Assigned"
    EMPLOYEE_CREATED = "employee_created", "Employee Created"
    EMPLOYEE_UPDATED = "employee_updated", "Employee Updated"
    EMPLOYEE_SUSPENDED = "employee_suspended", "Employee Suspended"
    EMPLOYEE_REACTIVATED = "employee_reactivated", "Employee Reactivated"
    PASSWORD_RESET = "password_reset", "Password Reset"
    INVITE_GENERATED = "invite_generated", "Invite Generated"
    ATTENDANCE_CORRECTED = "attendance_corrected", "Attendance Corrected"
    ATTENDANCE_DAY_APPROVED = "attendance_day_approved", "Attendance Day Approved"
    ATTENDANCE_MONTH_APPROVED = "attendance_month_approved", "Attendance Month Approved"
    ANOMALY_REVIEWED = "anomaly_reviewed", "Anomaly Reviewed"
    CONSULTANT_ACCESS = "consultant_access", "Consultant Access"
    CONSULTANT_LINK_REQUESTED = "consultant_link_requested", "Consultant Link Requested"
    CONSULTANT_LINK_APPROVED = "consultant_link_approved", "Consultant Link Approved"
    CONSULTANT_LINK_REJECTED = "consultant_link_rejected", "Consultant Link Rejected"
    CONSULTANT_LINK_REMOVED = "consultant_link_removed", "Consultant Link Removed"
    DOCUMENT_UPLOADED = "document_uploaded", "Document Uploaded"
    DOCUMENT_DOWNLOADED = "document_downloaded", "Document Downloaded"
    DOCUMENT_ARCHIVED = "document_archived", "Document Archived"
    PAYROLL_CREATED = "payroll_created", "Payroll Created"
    PAYROLL_STATUS_CHANGED = "payroll_status_changed", "Payroll Status Changed"
    PAYROLL_APPROVED = "payroll_approved", "Payroll Approved"
    PAYROLL_CORRECTION_REQUESTED = "payroll_correction_requested", "Payroll Correction Requested"
    PAYROLL_DELIVERED = "payroll_delivered", "Payroll Delivered"
    UNAUTHORIZED_ACCESS_ATTEMPT = "unauthorized_access_attempt", "Unauthorized Access Attempt"
    LEAVE_REQUESTED = "leave_requested", "Leave Requested"
    LEAVE_APPROVED = "leave_approved", "Leave Approved"
    LEAVE_REJECTED = "leave_rejected", "Leave Rejected"
    LEAVE_CANCELLED = "leave_cancelled", "Leave Cancelled"


# ============================================================
# NOTIFICATION CHOICES
# ============================================================

class NotificationPriorityChoices(models.TextChoices):
    """Notification priority levels"""
    LOW = "low", "Bassa"
    MEDIUM = "medium", "Media"
    HIGH = "high", "Alta"
    URGENT = "urgent", "Urgente"


class NotificationTypeChoices(models.TextChoices):
    """Notification type for styling"""
    INFO = "info", "Info"
    SUCCESS = "success", "Successo"
    WARNING = "warning", "Avviso"
    ERROR = "error", "Errore"
    ATTENTION = "attention", "Richiede attenzione"


# ============================================================
# DEVICE TOKEN CHOICES
# ============================================================

class UserDeviceTypeChoices(models.TextChoices):
    """Device type for push notifications"""
    IOS = "ios", "iOS"
    ANDROID = "android", "Android"
    WEB = "web", "Web"


# ============================================================
# PRICING / PLANS CHOICES
# ============================================================

class PricingPlanTypeChoices(models.TextChoices):
    """Subscription plan tiers"""
    STARTER = "starter", "Starter"
    PROFESSIONAL = "professional", "Professional"
    ENTERPRISE = "enterprise", "Enterprise"


class PricingBillingCycleChoices(models.TextChoices):
    """Billing cycle for pricing plans"""
    MONTHLY = "monthly", "Mensile"
    YEARLY = "yearly", "Annuale"


# ============================================================
# STRIPE CHOICES
# ============================================================

class StripeSubscriptionStatusChoices(models.TextChoices):
    """Stripe subscription status"""
    ACTIVE = "active", "Active"
    PAST_DUE = "past_due", "Past Due"
    CANCELED = "canceled", "Canceled"
    TRIALING = "trialing", "Trialing"
    UNPAID = "unpaid", "Unpaid"


# ============================================================
# MEDICAL CHOICES
# ============================================================

class MedicalVisitTypeChoices(models.TextChoices):
    """Medical visit type categories"""
    PERIODIC = 'periodic', 'Periodica'
    PRE_EMPLOYMENT = 'pre_employment', 'Pre-assunzione'
    RETURN_TO_WORK = 'return_to_work', 'Rientro al lavoro'
    FOLLOW_UP = 'follow_up', 'Follow-up'
    FITNESS_TEST = 'fitness_test', 'Test di idoneita'
    OTHER = 'other', 'Altro'


class MedicalVisitStatusChoices(models.TextChoices):
    """Medical visit status"""
    SCHEDULED = 'scheduled', 'Programmata'
    COMPLETED = 'completed', 'Completata'
    CANCELLED = 'cancelled', 'Annullata'
    EXPIRED = 'expired', 'Scaduta'


class MedicalCertificateTypeChoices(models.TextChoices):
    """Medical certificate type categories"""
    SICKNESS = 'sickness', 'Malattia'
    MATERNITY = 'maternity', 'Maternita'
    PATERNITY = 'paternity', 'Paternita'
    INJURY = 'injury', 'Infortunio'
    OTHER = 'other', 'Altro'


class MedicalCertificateStatusChoices(models.TextChoices):
    """Medical certificate status"""
    PENDING = 'pending', 'In attesa validazione'
    VALIDATED = 'validated', 'Confermato'
    REJECTED = 'rejected', 'Rifiutato'
    EXPIRED = 'expired', 'Scaduto'


# ============================================================
# ONBOARDING CHOICES
# ============================================================

class OnboardingRoleTypeChoices(models.TextChoices):
    """Onboarding role types"""
    COMPANY = 'company', 'Azienda'
    CONSULTANT = 'consultant', 'Consulente'
    EMPLOYEE = 'employee', 'Dipendente'


# ============================================================
# AUTOMATION CHOICES
# ============================================================

class AutomationTriggerTypeChoices(models.TextChoices):
    """Automation trigger types"""
    MISSING_CLOCK_IN = 'missing_clock_in', 'Timbrazione mancante'
    LEAVE_PENDING_LONG = 'leave_pending_long', 'Ferie pending troppo a lungo'
    DOCUMENT_EXPIRING = 'document_expiring', 'Documento in scadenza'
    DOCUMENT_NOT_ACKNOWLEDGED = 'document_not_acknowledged', 'Doc non confermato'
    MONTHLY_REPORT = 'monthly_report_due', 'Report mensile'


class AutomationActionTypeChoices(models.TextChoices):
    """Automation action types"""
    CREATE_NOTIFICATION = 'create_notification', 'Crea notifica'
    CREATE_TASK = 'create_task', 'Crea task'
    SEND_EMAIL = 'send_email', 'Invia email'


# ============================================================
# TASK CHOICES
# ============================================================

class TaskStatusChoices(models.TextChoices):
    """Task status"""
    PENDING = 'pending', 'In attesa'
    IN_PROGRESS = 'in_progress', 'In corso'
    COMPLETED = 'completed', 'Completato'
    CANCELLED = 'cancelled', 'Annullato'


class TaskPriorityChoices(models.TextChoices):
    """Task priority levels"""
    LOW = 'low', 'Bassa'
    MEDIUM = 'medium', 'Media'
    HIGH = 'high', 'Alta'
    URGENT = 'urgent', 'Urgente'


# ============================================================
# SAFETY CHOICES
# ============================================================

class SafetyCourseCategoryChoices(models.TextChoices):
    """Safety course categories"""
    FIRE = "fire", "Antincendio"
    FIRST_AID = "first_aid", "Primo Soccorso"
    HYGIENE = "hygiene", "Igiene"
    GENERAL = "general", "Generale"
    WORKING_AT_HEIGHT = "working_at_height", "Lavori in Quota"
    ELECTRICAL = "electrical", "Elettrico"
    CHEMICAL = "chemical", "Chimico"
    MACHINERY = "machinery", "Macchinari"
    PPE = "ppe", "Uso DPI"
    RLS = "rls", "RLS - Rappresentante Lavoratori"
    MANUAL_HANDLING = "manual_handling", "Movimentazione Carichi"
    OTHER = "other", "Altro"


class EmployeeTrainingStatusChoices(models.TextChoices):
    """Employee training status"""
    PENDING = "pending", "In Attesa"
    COMPLETED = "completed", "Completato"
    EXPIRED = "expired", "Scaduto"


class SafetyInspectionStatusChoices(models.TextChoices):
    """Safety inspection status"""
    SCHEDULED = "scheduled", "Programmata"
    IN_PROGRESS = "in_progress", "In Corso"
    COMPLETED = "completed", "Completata"


class SafetyInspectionRiskLevelChoices(models.TextChoices):
    """Safety inspection risk levels"""
    LOW = "low", "Basso"
    MEDIUM = "medium", "Medio"
    HIGH = "high", "Alto"
    CRITICAL = "critical", "Critico"


class SafetyAlertTypeChoices(models.TextChoices):
    """Safety alert types"""
    COURSE_EXPIRING = "course_expiring", "Corso in Scadenza"
    COURSE_EXPIRED = "course_expired", "Corso Scaduto"
    INSPECTION_DUE = "inspection_due", "Ispezione Programmata"
    RISK_DETECTED = "risk_detected", "Rischio Rilevato"
    COMPLIANCE_WARNING = "compliance_warning", "Warn Compliance"
    NEW_COURSE = "new_course", "Nuovo Corso Assegnato"


class SafetyAlertSeverityChoices(models.TextChoices):
    """Safety alert severity levels"""
    INFO = "info", "Info"
    WARNING = "warning", "Warning"
    CRITICAL = "critical", "Critico"