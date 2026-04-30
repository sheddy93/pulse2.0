from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .payroll_views import (
    CompanyPayrollOverviewView,
    ConsultantPayrollOverviewView,
    DocumentArchiveView,
)
from .consultant_advanced_views import (
    ConsultantDashboardView,
    ConsultantCompanyDetailView,
    ConsultantCompaniesListView,
    ConsultantCompanyEmployeesView,
    ConsultantSafetyOverviewView,
)
from .payroll_views import (
    DocumentDetailView,
    DocumentDownloadView,
    DocumentListCreateView,
    EmployeePayrollMineView,
    PayrollAttachDocumentView,
    PayrollChangeStatusView,
    PayrollDetailView,
    PayrollDocumentsView,
    PayrollListCreateView,
    PayrollMonthlySummaryView,
    PayrollAssistantView,
)
from .leave_views import (
    LeaveTypeListView,
    LeaveBalanceListView,
    LeaveRequestListView,
    LeaveRequestDetailView,
    LeaveRequestApproveView,
    LeaveCalendarView,
    LeaveStatsView,
)
from .views import (
    BreakEndView,
    BreakStartView,
    ChangePasswordView,
    CheckInView,
    CheckOutView,
    CompanyAdminCreateView,
    CompanyAttendanceApproveDayView,
    CompanyAttendanceApproveMonthView,
    CompanyAttendanceCorrectEntryView,
    CompanyAttendanceDailyReviewView,
    CompanyAttendanceOverviewView,
    CompanyRequestConsultantLinkView,
    CompanyRegistrationView,
    CompanyRoleViewSet,
    CompanySelfView,
    CompanyUserViewSet,
    CompanyViewSet,
    ConsultantCompanyLinkApproveView,
    ConsultantCompanyLinkListView,
    ConsultantCompanyLinkRejectView,
    ConsultantCompanyLinkRemoveView,
    ConsultantRegistrationView,
    ConsultantRequestCompanyLinkView,
    ConsultantCompaniesView,
    ConsultantCompanyOverviewView,
    DepartmentViewSet,
    EmailVerifyView,
    EmployeeProfileViewSet,
    LoginView,
    MonthlyAttendanceSummaryView,
    LogoutView,
    MeView,
    NotificationViewSet,
    OfficeLocationViewSet,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PermissionViewSet,
    ResendVerificationEmailView,
    TimeHistoryView,
    TimeTodayView,
    AttendanceWorkflowAssistantView,
)
from .analytics_views import (
    analytics_overview,
    analytics_revenue,
    analytics_conversion,
    analytics_plans,
)
from .pricing_views import PricingPlanViewSet, PricingConfigViewSet, company_limits
from .pricing_admin_views import PricingAdminViewSet
from .companies_admin_views import CompaniesAdminViewSet
from .stripe_views import (
    StripeBillingStatusView,
    StripeCustomerCreateView,
    StripeSubscriptionCancelView,
    StripeSubscriptionCreateView,
    StripeWebhookView,
)
from .reports_views import (
    AttendanceReportView,
    AttendanceSummaryReportView,
    PayrollReportView,
    CompaniesReportView,
    LeavesReportView,
    LeaveBalancesReportView,
    EmployeesReportView,
    ReportsDashboardView,
    ReportsListView,
)
from .geolocation_views import (
    GeoLocationView,
    OfficeLocationsView,
    GPSHistoryView,
    CheckInWithLocationView,
    CheckOutWithLocationView,
)
from .search_views import GlobalSearchView, QuickSearchView
from .push_views import DeviceTokenView, PushTestView
from .safety_views import (
    SafetyCourseViewSet,
    EmployeeTrainingViewSet,
    SafetyInspectionViewSet,
    SafetyAlertViewSet,
    SafetyDashboardView,
    EmployeeComplianceView,
    BulkAssignCoursesView,
)
from .serializers import (
    SafetyCourseSerializer,
    EmployeeTrainingSerializer,
    SafetyInspectionSerializer,
    SafetyAlertSerializer,
)
from .signature_views import (
    SignatureRequestView,
    SignatureSignView,
    DocumentReceiptView,
    SignatureStatusView,
)
from .saml_views import (
    SSOInitView,
    SAMLACSView,
    SAMLMetadataView,
    SSOConfigView,
    OIDCCallbackView,
    SSOLogoutView,
)
from .views import OnboardingProgressView

from .dashboard_views import (
    CompanyDashboardSummaryView,
    ConsultantDashboardSummaryView,
    EmployeeDashboardSummaryView,
    AdminDashboardSummaryView,
)

from .medical_views import (
    MedicalVisitViewSet,
    MedicalCertificateViewSet,
    OfflineTimeEntryViewSet,
    AbsenceTypeViewSet,
    MedicalDashboardView,
    CheckInWithCertificateView,
)


router = DefaultRouter()
router.register("companies", CompanyViewSet, basename="companies")
router.register("company/users", CompanyUserViewSet, basename="company-users")
router.register("employees", EmployeeProfileViewSet, basename="employees")
router.register("departments", DepartmentViewSet, basename="departments")
router.register("office-locations", OfficeLocationViewSet, basename="office-locations")
router.register("company/roles", CompanyRoleViewSet, basename="company-roles")
router.register("permissions", PermissionViewSet, basename="permissions")
router.register("pricing/plans", PricingPlanViewSet, basename="pricing-plans")
router.register("pricing/config", PricingConfigViewSet, basename="pricing-config")
# Admin routes (super_admin only)
router.register("admin/pricing/plans", PricingAdminViewSet, basename="admin-pricing-plans")
router.register("admin/companies", CompaniesAdminViewSet, basename="admin-companies")

# Medical certificates and visits
router.register(r"medical-visits", MedicalVisitViewSet, basename="medical-visit")
router.register(r"medical-certificates", MedicalCertificateViewSet, basename="medical-certificate")
router.register(r"offline-entries", OfflineTimeEntryViewSet, basename="offline-entry")
router.register(r"absence-types", AbsenceTypeViewSet, basename="absence-type")


urlpatterns = [
    # Reports endpoints
    path("reports/list/", ReportsListView.as_view(), name="reports-list"),
    path("reports/attendance/", AttendanceReportView.as_view(), name="report-attendance"),
    path("reports/attendance/summary/", AttendanceSummaryReportView.as_view(), name="report-attendance-summary"),
    path("reports/payroll/", PayrollReportView.as_view(), name="report-payroll"),
    path("reports/companies/", CompaniesReportView.as_view(), name="report-companies"),
    path("reports/leaves/", LeavesReportView.as_view(), name="report-leaves"),
    path("reports/leaves/balances/", LeaveBalancesReportView.as_view(), name="report-leave-balances"),
    path("reports/employees/", EmployeesReportView.as_view(), name="report-employees"),
    path("reports/dashboard/", ReportsDashboardView.as_view(), name="reports-dashboard"),

    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("auth/verify-email/", EmailVerifyView.as_view(), name="verify-email"),
    path("auth/resend-verification/", ResendVerificationEmailView.as_view(), name="resend-verification"),

    # SSO/SAML endpoints
    path("auth/saml/init/<slug:company_slug>/", SSOInitView.as_view(), name="sso-init"),
    path("auth/saml/acs/", SAMLACSView.as_view(), name="saml-acs"),
    path("auth/saml/metadata/", SAMLMetadataView.as_view(), name="saml-metadata"),
    path("auth/saml/sls/", SAMLACSView.as_view(), name="saml-sls"),  # Single Logout Service
    path("auth/oidc/callback/", OIDCCallbackView.as_view(), name="oidc-callback"),
    path("auth/sso/config/", SSOConfigView.as_view(), name="sso-config"),
    path("auth/sso/logout/", SSOLogoutView.as_view(), name="sso-logout"),

    path("consultant-links/", ConsultantCompanyLinkListView.as_view(), name="consultant-links"),
    path("consultant-links/request-company/", ConsultantRequestCompanyLinkView.as_view(), name="consultant-link-request-company"),
    path("consultant-links/request-consultant/", CompanyRequestConsultantLinkView.as_view(), name="consultant-link-request-consultant"),
    path("consultant-links/approve/", ConsultantCompanyLinkApproveView.as_view(), name="consultant-link-approve"),
    path("consultant-links/reject/", ConsultantCompanyLinkRejectView.as_view(), name="consultant-link-reject"),
    path("consultant-links/remove/", ConsultantCompanyLinkRemoveView.as_view(), name="consultant-link-remove"),
    path("time/check-in/", CheckInView.as_view(), name="time-check-in"),
    path("time/break-start/", BreakStartView.as_view(), name="time-break-start"),
    path("time/break-end/", BreakEndView.as_view(), name="time-break-end"),
    path("time/check-out/", CheckOutView.as_view(), name="time-check-out"),
    path("time/today/", TimeTodayView.as_view(), name="time-today"),
    path("time/history/", TimeHistoryView.as_view(), name="time-history"),
    path("time/company/overview/", CompanyAttendanceOverviewView.as_view(), name="time-company-overview"),
    path("time/company/daily-review/", CompanyAttendanceDailyReviewView.as_view(), name="time-company-daily-review"),
    path("time/company/correct-entry/", CompanyAttendanceCorrectEntryView.as_view(), name="time-company-correct-entry"),
    path("time/company/approve-day/", CompanyAttendanceApproveDayView.as_view(), name="time-company-approve-day"),
    path("time/company/approve-month/", CompanyAttendanceApproveMonthView.as_view(), name="time-company-approve-month"),
    path("time/workflow-assistant/", AttendanceWorkflowAssistantView.as_view(), name="time-workflow-assistant"),
    path("time/consultant/companies/", ConsultantCompaniesView.as_view(), name="time-consultant-companies"),
    path("time/consultant/company-overview/", ConsultantCompanyOverviewView.as_view(), name="time-consultant-company-overview"),
    path("time/monthly-summary/", MonthlyAttendanceSummaryView.as_view(), name="time-monthly-summary"),
    path("documents/", DocumentListCreateView.as_view(), name="documents-list-create"),
    path("documents/<uuid:id>/", DocumentDetailView.as_view(), name="documents-detail"),
    path("documents/<uuid:id>/download/", DocumentDownloadView.as_view(), name="documents-download"),
    path("documents/<uuid:id>/archive/", DocumentArchiveView.as_view(), name="documents-archive"),
    path("payroll/", PayrollListCreateView.as_view(), name="payroll-list-create"),
    path("payroll/<uuid:id>/", PayrollDetailView.as_view(), name="payroll-detail"),
    path("payroll/<uuid:id>/change-status/", PayrollChangeStatusView.as_view(), name="payroll-change-status"),
    path("payroll/<uuid:id>/attach-document/", PayrollAttachDocumentView.as_view(), name="payroll-attach-document"),
    path("payroll/<uuid:id>/documents/", PayrollDocumentsView.as_view(), name="payroll-documents"),
    path("payroll/employee/mine/", EmployeePayrollMineView.as_view(), name="payroll-employee-mine"),
    path("payroll/company/overview/", CompanyPayrollOverviewView.as_view(), name="payroll-company-overview"),
    path("payroll/consultant/overview/", ConsultantPayrollOverviewView.as_view(), name="payroll-consultant-overview"),
    path("payroll/monthly-summary/", PayrollMonthlySummaryView.as_view(), name="payroll-monthly-summary"),
    path("payroll/assistant/", PayrollAssistantView.as_view(), name="payroll-assistant"),
    path("company/self/", CompanySelfView.as_view(), name="company-self"),
    path("company/admins/", CompanyAdminCreateView.as_view(), name="company-admins-create"),
    path("public/company-registration/", CompanyRegistrationView.as_view(), name="company-registration"),
    path("public/consultant-registration/", ConsultantRegistrationView.as_view(), name="consultant-registration"),
    # Notification endpoints
    path("notifications/", NotificationViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='notification-list'),
    path("notifications/<uuid:pk>/mark-read/", NotificationViewSet.as_view({
        'post': 'mark_read'
    }), name='notification-mark-read'),
    path("notifications/mark-all-read/", NotificationViewSet.as_view({
        'post': 'mark_all_read'
    }), name='notification-mark-all'),
    path("notifications/unread-count/", NotificationViewSet.as_view({
        'get': 'unread_count'
    }), name='notification-unread-count'),

    # Leave/Absence endpoints
    path("leave/types/", LeaveTypeListView.as_view(), name="leave-types"),
    path("leave/balances/", LeaveBalanceListView.as_view(), name="leave-balances"),
    path("leave/requests/", LeaveRequestListView.as_view(), name="leave-requests"),
    path("leave/requests/<uuid:id>/", LeaveRequestDetailView.as_view(), name="leave-request-detail"),
    path("leave/requests/<uuid:id>/approve/", LeaveRequestApproveView.as_view(), name="leave-request-approve"),
    path("leave/calendar/", LeaveCalendarView.as_view(), name="leave-calendar"),
    path("leave/stats/", LeaveStatsView.as_view(), name="leave-stats"),

    # Company limits/usage endpoint
    path("company/limits/", company_limits, name="company-limits"),

    # Admin Analytics endpoints (super_admin only)
    path("admin/analytics/overview/", analytics_overview, name="analytics-overview"),
    path("admin/analytics/revenue/", analytics_revenue, name="analytics-revenue"),
    path("admin/analytics/conversion/", analytics_conversion, name="analytics-conversion"),
    path("admin/analytics/plans/", analytics_plans, name="analytics-plans"),

    # Stripe Billing endpoints
    path("billing/create-customer/", StripeCustomerCreateView.as_view(), name="billing-create-customer"),
    path("billing/create-subscription/", StripeSubscriptionCreateView.as_view(), name="billing-create-subscription"),
    path("billing/cancel/", StripeSubscriptionCancelView.as_view(), name="billing-cancel"),
    path("billing/status/", StripeBillingStatusView.as_view(), name="billing-status"),

    # Stripe Webhook endpoint (no auth - uses signature verification)
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="webhooks-stripe"),

    # Geolocation endpoints
    path("geo/location/", GeoLocationView.as_view(), name="geo-location"),
    path("geo/offices/", OfficeLocationsView.as_view(), name="geo-offices"),
    path("geo/gps-history/", GPSHistoryView.as_view(), name="geo-gps-history"),
    path("time/check-in-gps/", CheckInWithLocationView.as_view(), name="time-check-in-gps"),
    path("time/check-out-gps/", CheckOutWithLocationView.as_view(), name="time-check-out-gps"),

    # Global Search endpoints
    path("search/", GlobalSearchView.as_view(), name="global-search"),
    path("search/quick/", QuickSearchView.as_view(), name="quick-search"),

    # Safety / Sicurezza sul Lavoro endpoints
    path("safety/courses/", SafetyCourseViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name="safety-courses"),
    path("safety/courses/<uuid:pk>/", SafetyCourseViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name="safety-courses-detail"),

    path("safety/trainings/", EmployeeTrainingViewSet.as_view({
        'get': 'list'
    }), name="safety-trainings"),
    path("safety/trainings/pending/", EmployeeTrainingViewSet.as_view({
        'get': 'pending'
    }), name="safety-trainings-pending"),
    path("safety/trainings/expiring/", EmployeeTrainingViewSet.as_view({
        'get': 'expiring'
    }), name="safety-trainings-expiring"),
    path("safety/trainings/assign/", EmployeeTrainingViewSet.as_view({
        'post': 'assign'
    }), name="safety-trainings-assign"),
    path("safety/trainings/<uuid:pk>/complete/", EmployeeTrainingViewSet.as_view({
        'post': 'complete'
    }), name="safety-trainings-complete"),
    path("safety/trainings/bulk-assign/", BulkAssignCoursesView.as_view(), name="safety-trainings-bulk-assign"),

    path("safety/inspections/", SafetyInspectionViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name="safety-inspections"),
    path("safety/inspections/<uuid:pk>/", SafetyInspectionViewSet.as_view({
        'get': 'retrieve',
        'put': 'update'
    }), name="safety-inspections-detail"),
    path("safety/inspections/<uuid:pk>/complete/", SafetyInspectionViewSet.as_view({
        'post': 'complete'
    }), name="safety-inspections-complete"),

    path("safety/alerts/", SafetyAlertViewSet.as_view({
        'get': 'list'
    }), name="safety-alerts"),
    path("safety/alerts/<uuid:pk>/mark-read/", SafetyAlertViewSet.as_view({
        'post': 'mark_read'
    }), name="safety-alerts-mark-read"),
    path("safety/alerts/generate/", SafetyAlertViewSet.as_view({
        'post': 'generate'
    }), name="safety-alerts-generate"),
    path("safety/alerts/mark-all-read/", SafetyAlertViewSet.as_view({
        'post': 'mark_all_read'
    }), name="safety-alerts-mark-all-read"),

    path("safety/dashboard/", SafetyDashboardView.as_view(), name="safety-dashboard"),
    path("safety/employee/<uuid:employee_id>/compliance/", EmployeeComplianceView.as_view(), name="safety-employee-compliance"),

    # Firma digitale endpoints
    path("signatures/request/", SignatureRequestView.as_view(), name="signature-request"),
    path("signatures/status/", SignatureStatusView.as_view(), name="signature-status"),
    path("sign/<str:token>/", SignatureSignView.as_view(), name="signature-sign"),
    path("receipt/<str:token>/", DocumentReceiptView.as_view(), name="document-receipt"),

    # Push notification endpoints
    path("push/register/", DeviceTokenView.as_view(), name="push-register"),
    path("push/test/", PushTestView.as_view(), name="push-test"),

    # Consulente Dashboard Avanzata
    # Dashboard summaries
    path('dashboard/company/summary/', CompanyDashboardSummaryView.as_view(), name='company_dashboard_summary'),
    path('dashboard/consultant/summary/', ConsultantDashboardSummaryView.as_view(), name='consultant_dashboard_summary'),
    path('dashboard/employee/summary/', EmployeeDashboardSummaryView.as_view(), name='employee_dashboard_summary'),
    path('dashboard/admin/summary/', AdminDashboardSummaryView.as_view(), name='admin_dashboard_summary'),

    path("onboarding/progress/", OnboardingProgressView.as_view(), name="onboarding_progress"),
    path("consultant/dashboard/", ConsultantDashboardView.as_view(), name="consultant-dashboard"),
    path("consultant/companies/", ConsultantCompaniesListView.as_view(), name="consultant-companies-list"),
    path("consultant/companies/<uuid:company_id>/", ConsultantCompanyDetailView.as_view(), name="consultant-company-detail"),
    path("consultant/companies/<uuid:company_id>/employees/", ConsultantCompanyEmployeesView.as_view(), name="consultant-company-employees"),
    path("consultant/payroll/overview/", ConsultantPayrollOverviewView.as_view(), name="consultant-payroll-overview"),
    path("consultant/safety/overview/", ConsultantSafetyOverviewView.as_view(), name="consultant-safety-overview"),

    # Medical certificates and visits endpoints
    path("medical/dashboard/", MedicalDashboardView.as_view(), name="medical-dashboard"),
    path("time/check-in-with-certificate/", CheckInWithCertificateView.as_view(), name="check-in-certificate"),

    path("", include(router.urls)),
]
