/**
 * Team Analytics Page
 * Wrapper per TeamAnalytics component
 */
import { useAuth } from '@/lib/AuthContext';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import TeamAnalytics from '@/components/dashboard/TeamAnalytics';

export default function TeamAnalyticsPage() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Team Analytics</h1>
        <TeamAnalytics managerId={user?.email} companyId={user?.company_id} />
      </div>
    </AppShell>
  );
}