/**
 * App.jsx
 * -------
 * Entry point dell'applicazione React. Definisce:
 *  - Provider globali: AuthProvider, QueryClientProvider, Router
 *  - Tutte le Route dell'app organizzate per ruolo
 *  - AuthenticatedApp: gestisce stati di caricamento, errori auth, force password change
 *
 * ⚠️  Per aggiungere una nuova pagina:
 *  1. Importa il componente in cima (sezione "Add page imports here")
 *  2. Aggiungi un <Route path="..." element={<Componente />} /> dentro <Routes>
 *  3. Rispetta la convenzione delle path per ruolo:
 *     - Super Admin: /dashboard/admin/*
 *     - Consulente:  /dashboard/consultant/*
 *     - Azienda:     /dashboard/company/*
 *     - Dipendente:  /dashboard/employee/*
 */
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import NotificationManager from '@/components/pwa/NotificationManager';
import Landing from './pages/Landing';
import LandingNew from './pages/LandingNew';
import LandingInnovative from './pages/LandingInnovative';
import DashboardHome from './pages/dashboard/DashboardHome';

// Auth
import RoleRedirect from './pages/auth/RoleRedirect';
import RoleSelection from './pages/auth/RoleSelection';
import UnknownRole from './pages/auth/UnknownRole';
import RegisterCompany from './pages/auth/RegisterCompany';
import RegisterConsultant from './pages/auth/RegisterConsultant';

// Dashboards
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import ConsultantDashboardBasic from './pages/dashboard/ConsultantDashboardBasic';
import CompanyOwnerDashboard from './pages/dashboard/CompanyOwnerDashboard';
import ManagerDashboard from './pages/dashboard/ManagerDashboard';
import EmployeeDashboardBasic from './pages/dashboard/EmployeeDashboardBasic';
import EmployeeDashboardOptimized from './pages/dashboard/EmployeeDashboardOptimized';
import CompanyDashboardOptimized from './pages/dashboard/CompanyDashboardOptimized';
import DashboardBuilder from './pages/company/DashboardBuilder';

// Company
import EmployeeListNew from './pages/company/EmployeeListNew';
import EmployeeCreateNew from './pages/company/EmployeeCreateNew';
import EmployeeDetailNew from './pages/company/EmployeeDetailNew';
import EmployeeImport from './pages/company/EmployeeImport';
import CompanyConsultants from './pages/company/CompanyConsultants';
import DocumentsPage from './pages/company/DocumentsPage';
import ExpiryCalendar from './pages/company/ExpiryCalendar';
import OvertimePage from './pages/company/OvertimePage';
import ShiftManagement from './pages/company/ShiftManagementEnhanced';
import AnnouncementBoard from './pages/company/AnnouncementBoard';
import SkillManagement from './pages/company/SkillManagement';
import AssetManagement from './pages/company/AssetManagement';
import AssetAssignmentPage from './pages/company/AssetAssignmentPage';
import AuditLogPage from './pages/company/AuditLogPage';
import BenefitManagement from './pages/company/BenefitManagement';
import IntegrationSettings from './pages/company/IntegrationSettings';
import JobPostings from './pages/company/JobPostings';
import CandidateTracking from './pages/company/CandidateTracking';
import TrainingManagement from './pages/company/TrainingManagement';
import PerformanceManagement from './pages/company/PerformanceManagement';
import GivePerformanceReview from './pages/company/GivePerformanceReview';
import HRAnalytics from './pages/company/HRAnalytics';
import AdvancedAnalytics from './pages/company/AdvancedAnalytics';
import HRCalendarPage from './pages/company/HRCalendarPage';
import ExpenseManagement from './pages/company/ExpenseManagement';
import EmployeeExpenses from './pages/employee/EmployeeExpenses';
import LeaveBalance from './pages/employee/LeaveBalance';
import ManagerLeaveRequests from './pages/company/ManagerLeaveRequests';
import AdminAnalytics from './pages/dashboard/AdminAnalytics';
import AdminAnalyticsDashboard from './pages/dashboard/AdminAnalyticsDashboard';
import OnboardingWizard from './pages/employee/OnboardingWizard';
import OnboardingTracking from './pages/company/OnboardingTracking';
import TrainingPlanManagement from './pages/company/TrainingPlanManagement';
import TimeOffCalendarPage from './pages/company/TimeOffCalendarPage';
import DocumentTemplatePage from './pages/company/DocumentTemplatePage';
import TeamAnalyticsPage from './pages/company/TeamAnalyticsPage';
import APIManagement from './pages/company/APIManagement';
import IntegrationsPage from './pages/company/IntegrationsPage';
import TrainingDashboard from './pages/employee/TrainingDashboard';
import CertificationExpiry from './pages/company/CertificationExpiry';
import SuperAdminSettings from './pages/dashboard/SuperAdminSettings';
import SuperAdminPlatformSettings from './pages/dashboard/SuperAdminPlatformSettings';
import Tier2Dashboard from './pages/dashboard/Tier2Dashboard';
import FeatureManagement from './pages/dashboard/FeatureManagement';
import TemporaryLogins from './pages/dashboard/TemporaryLogins';
import PricingManagement from './pages/dashboard/PricingManagement';
import PricingPageNew from './pages/company/PricingPageNew';
import TrainingPortal from './pages/employee/TrainingPortal';
import PersonalDocuments from './pages/employee/PersonalDocuments';
import PerformanceFeedback from './pages/employee/PerformanceFeedback';
import Chat from './pages/employee/Chat';
import Messaging from './pages/employee/Messaging';
import TwoFactorAuthPage from './pages/employee/TwoFactorAuthPage';

// Consultant
import LinkRequests from './pages/consultant/LinkRequests';
import DocumentReviewPage from './pages/consultant/DocumentReviewPage';

// Employee
import AttendancePage from './pages/employee/AttendancePage';
import AttendanceCalendarPage from './pages/employee/AttendanceCalendar';
import LeaveRequestPage from './pages/employee/LeaveRequestPage';
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';
import MyProfile from './pages/employee/MyProfile';
import DocumentSignaturePage from './pages/employee/DocumentSignaturePage';
import EmployeeShiftCalendarPage from './pages/employee/EmployeeShiftCalendarPage';
import OvertimeRequestPage from './pages/employee/OvertimeRequestPage';
import SkillsPage from './pages/employee/SkillsPage';
import BenefitsPage from './pages/employee/BenefitsPage';
import NotificationPreferencesPage from './pages/employee/NotificationPreferencesPage';
import SubscriptionPage from './pages/company/SubscriptionPage';
import CheckoutPage from './pages/company/CheckoutPage';
import MyAccountSubscription from './pages/company/MyAccountSubscription';
import PayrollExport from './pages/company/PayrollExport';
import ReportGenerator from './pages/company/ReportGenerator';
import WorkflowConfiguration from './pages/company/WorkflowConfiguration';
import GeofenceManagement from './pages/company/GeofenceManagement';
import CompanyAttendancePage from './pages/company/CompanyAttendancePage';
import CompanySettings from './pages/company/CompanySettings';
import ConsultantSettings from './pages/consultant/ConsultantSettings';
import AdminCompanies from './pages/dashboard/AdminCompanies';
import AdminUsers from './pages/dashboard/AdminUsers';
import AdminSystem from './pages/dashboard/AdminSystem';
import EmployeeContract from './pages/employee/EmployeeContract';
import CreateCompanyAdmin from './pages/company/CreateCompanyAdmin';
import AdminsList from './pages/company/AdminsList';
import EmployeeCard from './pages/company/EmployeeCard';
import DocumentArchive from './pages/company/DocumentArchive';
import DocumentManagement from './pages/employee/DocumentManagement';
import SendMessage from './pages/company/SendMessage';
import InboxMessages from './pages/employee/InboxMessages';
import ForcePasswordChange from './pages/auth/ForcePasswordChange';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Shared
import ComingSoon from './components/layout/ComingSoon';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  // Force password change if needed
  if (user?.must_change_password) {
    return <ForcePasswordChange onComplete={() => window.location.reload()} />;
  }

  return (
    <>
      <NotificationManager user={user} />
      <InstallPrompt />
      <Routes>
      {/* Landing Page */}
      <Route path="/landing" element={<LandingNew />} />
      <Route path="/landing-new" element={<LandingInnovative />} />
      <Route path="/" element={<LandingInnovative />} />
      <Route path="/dashboard" element={<DashboardHome />} />

      {/* Auth Routes */}
      <Route path="/auth/role-selection" element={<RoleSelection />} />
      <Route path="/auth/register/company" element={<RegisterCompany />} />
      <Route path="/auth/register/consultant" element={<RegisterConsultant />} />
      <Route path="/error/unknown-role" element={<UnknownRole />} />

      {/* Super Admin */}
      <Route path="/dashboard/admin" element={<SuperAdminDashboard />} />
      <Route path="/dashboard/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/dashboard/admin/analytics-advanced" element={<AdminAnalyticsDashboard />} />
      <Route path="/dashboard/admin/settings" element={<SuperAdminSettings />} />
      <Route path="/dashboard/admin/platform-settings" element={<SuperAdminPlatformSettings />} />
      <Route path="/dashboard/admin/tier2" element={<Tier2Dashboard />} />
      <Route path="/dashboard/admin/temporary-logins" element={<TemporaryLogins />} />
      <Route path="/dashboard/admin/pricing" element={<PricingManagement />} />
      <Route path="/dashboard/admin/features" element={<FeatureManagement />} />
      <Route path="/dashboard/admin/companies" element={<AdminCompanies />} />
      <Route path="/dashboard/admin/users" element={<AdminUsers />} />
      <Route path="/dashboard/admin/system" element={<AdminSystem />} />

      {/* Consultant */}
      <Route path="/dashboard/consultant" element={<ConsultantDashboardBasic />} />
      <Route path="/dashboard/consultant/companies" element={<EmployeeListNew />} />
      <Route path="/dashboard/consultant/employees" element={<EmployeeListNew />} />
      <Route path="/dashboard/consultant/link-requests" element={<LinkRequests />} />
      <Route path="/dashboard/consultant/document-review" element={<DocumentReviewPage />} />
      <Route path="/dashboard/consultant/calendar" element={<HRCalendarPage />} />
      <Route path="/dashboard/consultant/documents" element={<ComingSoon title="Documenti" dashboardPath="/dashboard/consultant" />} />
      <Route path="/dashboard/consultant/settings" element={<ConsultantSettings />} />
      <Route path="/dashboard/consultant/employees/:id" element={<EmployeeCard />} />

      {/* Company */}
      <Route path="/dashboard/company" element={<CompanyDashboardOptimized />} />
      <Route path="/dashboard/company/employees" element={<EmployeeListNew />} />
      <Route path="/dashboard/company/employees/new" element={<EmployeeCreateNew />} />
      <Route path="/dashboard/company/employees/:id" element={<EmployeeDetailNew />} />
      <Route path="/dashboard/company/employees/import" element={<EmployeeImport />} />
      <Route path="/dashboard/company/admins" element={<AdminsList />} />
      <Route path="/dashboard/company/admins/new" element={<CreateCompanyAdmin />} />
      <Route path="/dashboard/company/consultants" element={<CompanyConsultants />} />
      <Route path="/dashboard/company/attendance" element={<CompanyAttendancePage />} />
      <Route path="/dashboard/company/overtime" element={<OvertimePage />} />
      <Route path="/dashboard/company/shifts" element={<ShiftManagement />} />
      <Route path="/dashboard/company/announcements" element={<AnnouncementBoard />} />
      <Route path="/dashboard/company/skills" element={<SkillManagement />} />
      <Route path="/dashboard/company/assets" element={<AssetManagement />} />
      <Route path="/dashboard/company/asset-assignments" element={<AssetAssignmentPage />} />
      <Route path="/dashboard/company/audit-log" element={<AuditLogPage />} />
      <Route path="/dashboard/company/documents" element={<DocumentsPage />} />
      <Route path="/dashboard/company/documents/expiring" element={<ExpiryCalendar />} />
      <Route path="/dashboard/company/document-archive" element={<DocumentArchive />} />
      <Route path="/dashboard/company/send-message" element={<SendMessage />} />
      <Route path="/dashboard/company/benefits" element={<BenefitManagement />} />
      <Route path="/dashboard/company/integrations" element={<IntegrationSettings />} />
      <Route path="/dashboard/company/job-postings" element={<JobPostings />} />
      <Route path="/dashboard/company/candidates" element={<CandidateTracking />} />
      <Route path="/dashboard/company/training" element={<TrainingManagement />} />
      <Route path="/dashboard/company/performance" element={<PerformanceManagement />} />
      <Route path="/dashboard/company/give-feedback" element={<GivePerformanceReview />} />
      <Route path="/dashboard/company/analytics" element={<HRAnalytics />} />
      <Route path="/dashboard/company/ai-analytics" element={<AdvancedAnalytics />} />
      <Route path="/dashboard/company/calendar" element={<HRCalendarPage />} />
      <Route path="/dashboard/company/time-off-calendar" element={<TimeOffCalendarPage />} />
      <Route path="/dashboard/company/expenses" element={<ExpenseManagement />} />
      <Route path="/dashboard/company/leave-requests" element={<ManagerLeaveRequests />} />
      <Route path="/dashboard/company/onboarding-tracking" element={<OnboardingTracking />} />
      <Route path="/dashboard/company/training-plans" element={<TrainingPlanManagement />} />
      <Route path="/dashboard/company/certification-expiry" element={<CertificationExpiry />} />
      <Route path="/dashboard/company/subscription" element={<SubscriptionPage />} />
      <Route path="/dashboard/company/checkout" element={<CheckoutPage />} />
      <Route path="/dashboard/company/my-account" element={<MyAccountSubscription />} />
      <Route path="/dashboard/company/pricing-plans" element={<PricingPageNew />} />
      <Route path="/dashboard/company/payroll-export" element={<PayrollExport />} />
      <Route path="/dashboard/company/report-generator" element={<ReportGenerator />} />
      <Route path="/dashboard/company/workflow-configuration" element={<WorkflowConfiguration />} />
      <Route path="/dashboard/company/geofence" element={<GeofenceManagement />} />
      <Route path="/dashboard/company/document-templates" element={<DocumentTemplatePage />} />
      <Route path="/dashboard/company/team-analytics" element={<TeamAnalyticsPage />} />
      <Route path="/dashboard/company/dashboard-builder" element={<DashboardBuilder />} />
      <Route path="/dashboard/company/settings" element={<CompanySettings />} />
      <Route path="/dashboard/company/api" element={<APIManagement />} />

      {/* Employee */}
      <Route path="/dashboard/employee" element={<EmployeeDashboardOptimized />} />
      <Route path="/dashboard/employee/attendance" element={<AttendancePage />} />
      <Route path="/dashboard/employee/calendar" element={<AttendanceCalendarPage />} />
      <Route path="/dashboard/employee/history" element={<AttendancePage />} />
      <Route path="/dashboard/employee/leave" element={<LeaveRequestPage />} />
      <Route path="/dashboard/employee/leave-balance" element={<LeaveBalance />} />
      <Route path="/dashboard/employee/overtime" element={<OvertimeRequestPage />} />
      <Route path="/dashboard/employee/documents" element={<DocumentSignaturePage />} />
      <Route path="/dashboard/employee/personal-documents" element={<PersonalDocuments />} />
      <Route path="/dashboard/employee/document-management" element={<DocumentManagement />} />
      <Route path="/dashboard/employee/messages" element={<InboxMessages />} />
      <Route path="/dashboard/employee/skills" element={<SkillsPage />} />
      <Route path="/dashboard/employee/benefits" element={<BenefitsPage />} />
      <Route path="/dashboard/employee/training" element={<TrainingPortal />} />
      <Route path="/dashboard/employee/training-plans" element={<TrainingDashboard />} />
      <Route path="/dashboard/employee/feedback" element={<PerformanceFeedback />} />
      <Route path="/dashboard/employee/chat" element={<Chat />} />
      <Route path="/dashboard/employee/messaging" element={<Messaging />} />
      <Route path="/dashboard/employee/two-factor" element={<TwoFactorAuthPage />} />
      <Route path="/dashboard/employee/expenses" element={<EmployeeExpenses />} />
      <Route path="/dashboard/employee/onboarding" element={<OnboardingWizard />} />
      <Route path="/dashboard/employee/profile" element={<EmployeeProfilePage />} />
      <Route path="/dashboard/employee/notification-settings" element={<NotificationPreferencesPage />} />
      <Route path="/dashboard/employee/contract" element={<EmployeeContract />} />
      <Route path="/dashboard/employee/my-profile" element={<MyProfile />} />
      <Route path="/dashboard/employee/shifts" element={<EmployeeShiftCalendarPage />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;