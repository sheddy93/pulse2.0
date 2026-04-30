import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Auth
import RoleRedirect from './pages/auth/RoleRedirect';
import UnknownRole from './pages/auth/UnknownRole';

// Dashboards
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ConsultantDashboard from './pages/dashboard/ConsultantDashboard';
import CompanyDashboard from './pages/dashboard/CompanyDashboard';
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard';

// Company area
import EmployeeList from './pages/company/EmployeeList';
import NewEmployee from './pages/company/NewEmployee';
import CompanyConsultants from './pages/company/CompanyConsultants';

// Consultant area
import LinkRequests from './pages/consultant/LinkRequests';

// Employee area
import AttendancePage from './pages/employee/AttendancePage';
import LeaveRequestPage from './pages/employee/LeaveRequestPage';
import EmployeeProfile from './pages/employee/EmployeeProfile';

// Shared coming soon
import ComingSoon from './components/layout/ComingSoon';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Root → role redirect */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Error */}
      <Route path="/error/unknown-role" element={<UnknownRole />} />

      {/* Admin */}
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/admin/*" element={<AdminDashboard />} />

      {/* Consultant */}
      <Route path="/dashboard/consultant" element={<ConsultantDashboard />} />
      <Route path="/dashboard/consultant/companies" element={<EmployeeList />} />
      <Route path="/dashboard/consultant/employees" element={<EmployeeList />} />
      <Route path="/dashboard/consultant/link-requests" element={<LinkRequests />} />
      <Route path="/dashboard/consultant/documents" element={<ComingSoon title="Documenti consulente" dashboardPath="/dashboard/consultant" />} />
      <Route path="/dashboard/consultant/settings" element={<ComingSoon title="Impostazioni" dashboardPath="/dashboard/consultant" />} />

      {/* Company */}
      <Route path="/dashboard/company" element={<CompanyDashboard />} />
      <Route path="/dashboard/company/employees" element={<EmployeeList />} />
      <Route path="/dashboard/company/employees/new" element={<NewEmployee />} />
      <Route path="/dashboard/company/employees/:id" element={<ComingSoon title="Scheda dipendente" dashboardPath="/dashboard/company/employees" />} />
      <Route path="/dashboard/company/consultants" element={<CompanyConsultants />} />
      <Route path="/dashboard/company/attendance" element={<ComingSoon title="Presenze aziendali" dashboardPath="/dashboard/company" />} />
      <Route path="/dashboard/company/documents" element={<ComingSoon title="Documenti aziendali" dashboardPath="/dashboard/company" />} />
      <Route path="/dashboard/company/settings" element={<ComingSoon title="Impostazioni azienda" dashboardPath="/dashboard/company" />} />

      {/* Employee */}
      <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
      <Route path="/dashboard/employee/attendance" element={<AttendancePage />} />
      <Route path="/dashboard/employee/history" element={<AttendancePage />} />
      <Route path="/dashboard/employee/leave" element={<LeaveRequestPage />} />
      <Route path="/dashboard/employee/profile" element={<EmployeeProfile />} />
      <Route path="/dashboard/employee/documents" element={<ComingSoon title="I miei documenti" dashboardPath="/dashboard/employee" />} />
      <Route path="/dashboard/employee/contract" element={<ComingSoon title="Il mio contratto" dashboardPath="/dashboard/employee" />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
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
  )
}

export default App