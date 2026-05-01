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

// Auth
import RoleRedirect from './pages/auth/RoleRedirect';
import RoleSelection from './pages/auth/RoleSelection';
import UnknownRole from './pages/auth/UnknownRole';
import RegisterCompany from './pages/auth/RegisterCompany';
import RegisterConsultant from './pages/auth/RegisterConsultant';

// Dashboards
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ConsultantDashboard from './pages/dashboard/ConsultantDashboard';
import CompanyDashboard from './pages/dashboard/CompanyDashboard';
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard';

// Company
import EmployeeList from './pages/company/EmployeeList';
import NewEmployee from './pages/company/NewEmployee';
import EmployeeImport from './pages/company/EmployeeImport';
import CompanyConsultants from './pages/company/CompanyConsultants';
import DocumentsPage from './pages/company/DocumentsPage';
import ExpiryCalendar from './pages/company/ExpiryCalendar';
import OvertimePage from './pages/company/OvertimePage';
import ShiftManagement from './pages/company/ShiftManagement';
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
import HRCalendarPage from './pages/company/HRCalendarPage';
import ExpenseManagement from './pages/company/ExpenseManagement';
import EmployeeExpenses from './pages/employee/EmployeeExpenses';
import LeaveBalance from './pages/employee/LeaveBalance';
import ManagerLeaveRequests from './pages/company/ManagerLeaveRequests';
import AdminAnalytics from './pages/dashboard/AdminAnalytics';
import OnboardingWizard from './pages/employee/OnboardingWizard';
import OnboardingTracking from './pages/company/OnboardingTracking';
import TrainingPlanManagement from './pages/company/TrainingPlanManagement';
import TrainingDashboard from './pages/employee/TrainingDashboard';
import CertificationExpiry from './pages/company/CertificationExpiry';
import SuperAdminSettings from './pages/dashboard/SuperAdminSettings';
import SubscriptionPage from './pages/company/SubscriptionPage';
import TrainingPortal from './pages/employee/TrainingPortal';
import PersonalDocuments from './pages/employee/PersonalDocuments';
import PerformanceFeedback from './pages/employee/PerformanceFeedback';
import Chat from './pages/employee/Chat';

// Consultant
import LinkRequests from './pages/consultant/LinkRequests';
import DocumentReviewPage from './pages/consultant/DocumentReviewPage';

// Employee
import AttendancePage from './pages/employee/AttendancePage';
import AttendanceCalendarPage from './pages/employee/AttendanceCalendar';
import LeaveRequestPage from './pages/employee/LeaveRequestPage';
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';
import DocumentSignaturePage from './pages/employee/DocumentSignaturePage';
import OvertimeRequestPage from './pages/employee/OvertimeRequestPage';
import SkillsPage from './pages/employee/SkillsPage';
import BenefitsPage from './pages/employee/BenefitsPage';
import NotificationSettings from './pages/employee/NotificationSettings';

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

  return (
    <>
      <NotificationManager user={user} />
      <InstallPrompt />
      <Routes>
      {/* Landing Page */}
      <Route path="/landing" element={<LandingNew />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Root */}
      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="/auth/role-selection" element={<RoleSelection />} />
      <Route path="/auth/register/company" element={<RegisterCompany />} />
      <Route path="/auth/register/consultant" element={<RegisterConsultant />} />
      <Route path="/error/unknown-role" element={<UnknownRole />} />

      {/* Super Admin */}
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/dashboard/admin/settings" element={<SuperAdminSettings />} />
      <Route path="/dashboard/admin/companies" element={<ComingSoon title="Gestione Aziende" dashboardPath="/dashboard/admin" />} />
      <Route path="/dashboard/admin/users" element={<ComingSoon title="Gestione Utenti" dashboardPath="/dashboard/admin" />} />
      <Route path="/dashboard/admin/system" element={<ComingSoon title="Sistema" dashboardPath="/dashboard/admin" />} />

      {/* Consultant */}
      <Route path="/dashboard/consultant" element={<ConsultantDashboard />} />
      <Route path="/dashboard/consultant/companies" element={<EmployeeList />} />
      <Route path="/dashboard/consultant/employees" element={<EmployeeList />} />
      <Route path="/dashboard/consultant/link-requests" element={<LinkRequests />} />
      <Route path="/dashboard/consultant/document-review" element={<DocumentReviewPage />} />
      <Route path="/dashboard/consultant/calendar" element={<HRCalendarPage />} />
      <Route path="/dashboard/consultant/documents" element={<ComingSoon title="Documenti" dashboardPath="/dashboard/consultant" />} />
      <Route path="/dashboard/consultant/settings" element={<ComingSoon title="Impostazioni" dashboardPath="/dashboard/consultant" />} />
      <Route path="/dashboard/consultant/employees/:id" element={<ComingSoon title="Scheda dipendente" dashboardPath="/dashboard/consultant/employees" />} />

      {/* Company */}
      <Route path="/dashboard/company" element={<CompanyDashboard />} />
      <Route path="/dashboard/company/employees" element={<EmployeeList />} />
      <Route path="/dashboard/company/employees/new" element={<NewEmployee />} />
      <Route path="/dashboard/company/employees/import" element={<EmployeeImport />} />
      <Route path="/dashboard/company/employees/:id" element={<ComingSoon title="Scheda dipendente" dashboardPath="/dashboard/company/employees" />} />
      <Route path="/dashboard/company/consultants" element={<CompanyConsultants />} />
      <Route path="/dashboard/company/attendance" element={<ComingSoon title="Presenze aziendali" dashboardPath="/dashboard/company" />} />
      <Route path="/dashboard/company/overtime" element={<OvertimePage />} />
      <Route path="/dashboard/company/shifts" element={<ShiftManagement />} />
      <Route path="/dashboard/company/announcements" element={<AnnouncementBoard />} />
      <Route path="/dashboard/company/skills" element={<SkillManagement />} />
      <Route path="/dashboard/company/assets" element={<AssetManagement />} />
      <Route path="/dashboard/company/asset-assignments" element={<AssetAssignmentPage />} />
      <Route path="/dashboard/company/audit-log" element={<AuditLogPage />} />
      <Route path="/dashboard/company/documents" element={<DocumentsPage />} />
      <Route path="/dashboard/company/documents/expiring" element={<ExpiryCalendar />} />
      <Route path="/dashboard/company/benefits" element={<BenefitManagement />} />
      <Route path="/dashboard/company/integrations" element={<IntegrationSettings />} />
      <Route path="/dashboard/company/job-postings" element={<JobPostings />} />
      <Route path="/dashboard/company/candidates" element={<CandidateTracking />} />
      <Route path="/dashboard/company/training" element={<TrainingManagement />} />
      <Route path="/dashboard/company/performance" element={<PerformanceManagement />} />
      <Route path="/dashboard/company/give-feedback" element={<GivePerformanceReview />} />
      <Route path="/dashboard/company/analytics" element={<HRAnalytics />} />
      <Route path="/dashboard/company/calendar" element={<HRCalendarPage />} />
      <Route path="/dashboard/company/expenses" element={<ExpenseManagement />} />
      <Route path="/dashboard/company/leave-requests" element={<ManagerLeaveRequests />} />
      <Route path="/dashboard/company/onboarding-tracking" element={<OnboardingTracking />} />
      <Route path="/dashboard/company/training-plans" element={<TrainingPlanManagement />} />
      <Route path="/dashboard/company/certification-expiry" element={<CertificationExpiry />} />
      <Route path="/dashboard/company/subscription" element={<SubscriptionPage />} />
      <Route path="/dashboard/company/settings" element={<ComingSoon title="Impostazioni azienda" dashboardPath="/dashboard/company" />} />

      {/* Employee */}
      <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
      <Route path="/dashboard/employee/attendance" element={<AttendancePage />} />
      <Route path="/dashboard/employee/calendar" element={<AttendanceCalendarPage />} />
      <Route path="/dashboard/employee/history" element={<AttendancePage />} />
      <Route path="/dashboard/employee/leave" element={<LeaveRequestPage />} />
      <Route path="/dashboard/employee/leave-balance" element={<LeaveBalance />} />
      <Route path="/dashboard/employee/overtime" element={<OvertimeRequestPage />} />
      <Route path="/dashboard/employee/documents" element={<DocumentSignaturePage />} />
      <Route path="/dashboard/employee/skills" element={<SkillsPage />} />
      <Route path="/dashboard/employee/benefits" element={<BenefitsPage />} />
      <Route path="/dashboard/employee/training" element={<TrainingPortal />} />
      <Route path="/dashboard/employee/training-plans" element={<TrainingDashboard />} />
      <Route path="/dashboard/employee/documents" element={<PersonalDocuments />} />
      <Route path="/dashboard/employee/feedback" element={<PerformanceFeedback />} />
      <Route path="/dashboard/employee/chat" element={<Chat />} />
      <Route path="/dashboard/employee/expenses" element={<EmployeeExpenses />} />
      <Route path="/dashboard/employee/onboarding" element={<OnboardingWizard />} />
      <Route path="/dashboard/employee/profile" element={<EmployeeProfilePage />} />
      <Route path="/dashboard/employee/notification-settings" element={<NotificationSettings />} />
      <Route path="/dashboard/employee/contract" element={<ComingSoon title="Il mio contratto" dashboardPath="/dashboard/employee" />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;