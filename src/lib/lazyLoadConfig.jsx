import { lazy } from 'react';

/**
 * Lazy Load Configuration
 * Code-split heavy pages to improve initial load time
 */

// Heavy Analytics Pages (80KB+)
export const AdvancedAnalytics = lazy(() => 
  import('../pages/company/AdvancedAnalytics').then(m => ({ default: m.default }))
);

export const HRAnalytics = lazy(() => 
  import('../pages/company/HRAnalytics').then(m => ({ default: m.default }))
);

export const TeamAnalyticsPage = lazy(() => 
  import('../pages/company/TeamAnalyticsPage').then(m => ({ default: m.default }))
);

// Heavy Report Pages (65KB+)
export const ReportGenerator = lazy(() => 
  import('../pages/company/ReportGenerator').then(m => ({ default: m.default }))
);

export const PerformanceManagement = lazy(() => 
  import('../pages/company/PerformanceManagement').then(m => ({ default: m.default }))
);

// Heavy Dashboard Pages (72KB+)
export const AdminAnalyticsDashboard = lazy(() => 
  import('../pages/dashboard/AdminAnalyticsDashboard').then(m => ({ default: m.default }))
);

/**
 * Fallback Loading Component
 */
export function LazyLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="text-slate-600 font-medium">Caricamento in corso...</p>
        <p className="text-xs text-slate-500">Un momento, stiamo preparando la pagina</p>
      </div>
    </div>
  );
}