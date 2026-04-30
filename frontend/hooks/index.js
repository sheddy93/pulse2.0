// Esporta tutti gli hooks per utilizzo centralizzato

// Auth hooks
export { useAuth, useRequireAuth, usePermission } from './use-auth';
export { default as authHook } from './use-auth';

// Dashboard hooks
export {
  useCurrentUser,
  useTodayAttendance,
  useMonthlyOverview,
  useMonthlySummary,
  useNotifications,
  useUnreadNotifications,
  useEmployees,
  useEmployee,
  useCompanies,
  useCurrentCompany,
  useConsultantCompanies,
  useConsultantCompanyOverview,
  useCompanyPayroll,
  usePayroll,
  useDashboardStats,
} from './use-dashboard';
export { default as dashboardHooks } from './use-dashboard';

// Leave requests hooks
export {
  useLeaveRequests,
  usePendingLeaveRequests,
  useLeaveStats,
  useLeaveActions,
  useLeaveBalance,
} from './use-leave-requests';
export { default as leaveRequestsHook } from './use-leave-requests';

// Notifications hooks
export { useUnreadCount, useNotification } from './use-notifications';
export { default as notificationsHook } from './use-notifications';

// Mobile sidebar hook (existing)
export { default as useMobileSidebar } from './use-mobile-sidebar';
