/**
 * Dashboard Builder Page
 * Permette personalizzazione dashboard
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import QuickStats from '@/components/dashboard/QuickStats';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function DashboardBuilder() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Carica stats
      const entries = await base44.entities.TimeEntry.filter(
        { user_email: me.email },
        '-timestamp',
        30
      );

      const hours = entries.length * 8; // mock calculation
      const leaves = 20; // mock

      setStats({
        hours_worked: hours,
        leave_balance: leaves,
        expiring: 0
      });

      setLoading(false);
    };

    init();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Il Mio Dashboard</h1>
          <Button
            onClick={() => setShowCustomizer(true)}
            variant="outline"
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Personalizza
          </Button>
        </div>

        {/* Quick Stats */}
        <QuickStats stats={stats} />

        {/* Content Area */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">
            Clicca su "Personalizza" per aggiungere i widget che preferisci
          </p>
        </div>

        {showCustomizer && (
          <DashboardCustomizer
            onClose={() => setShowCustomizer(false)}
            userId={user?.id}
            companyId={user?.company_id}
          />
        )}
      </div>
    </AppShell>
  );
}