import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContextDecoupled';
import { companyService } from '@/services/companyService';
import { employeeService } from '@/services/employeeService';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Users, AlertCircle, TrendingUp, Clock, FileText, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CompanyDashboardOptimized() {
  const { user: authUser, isLoadingAuth } = useAuth();
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoadingAuth && authUser?.company_id) {
      const loadData = async () => {
        try {
          const comp = await companyService.getCompany(authUser.company_id);
          setCompany(comp);

          const emps = await employeeService.listEmployees(authUser.company_id);
          
          // TODO: Integrate with leave/shift services
          setStats({
            activeEmployees: emps.filter(e => e.employment_status === 'active').length,
            totalEmployees: emps.length,
            pendingApprovals: 2,
            shiftAlerts: 1,
            expiringDocs: 3,
            geofenceAlerts: 0
          });

          setAlerts([
            { type: 'leave', count: 2, color: 'orange' },
            { type: 'shift', count: 1, color: 'red' },
            { type: 'docs', count: 3, color: 'yellow' }
          ]);
        } catch (err) {
          console.error('Error loading dashboard:', err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    } else if (!isLoadingAuth) {
      setLoading(false);
    }
  }, [authUser, isLoadingAuth]);

  if (loading || isLoadingAuth) return <PageLoader color="blue" />;

  const modules = [
    { label: 'Dipendenti', icon: Users, path: '/dashboard/company/employees', color: 'from-blue-500 to-blue-600' },
    { label: 'Presenze', icon: Clock, path: '/dashboard/company/attendance', color: 'from-emerald-500 to-teal-600' },
    { label: 'Approvazioni', icon: AlertCircle, path: '/dashboard/company/leave-requests', color: 'from-orange-500 to-red-600' },
    { label: 'Turni', icon: Clock, path: '/dashboard/company/shifts', color: 'from-yellow-500 to-orange-600' },
    { label: 'Documenti', icon: FileText, path: '/dashboard/company/documents', color: 'from-indigo-500 to-purple-600' },
    { label: 'Analytics', icon: BarChart3, path: '/dashboard/company/analytics', color: 'from-pink-500 to-rose-600' }
  ];

  return (
    <AppShell user={authUser}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
              {company?.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Dashboard amministrativo</p>
          </motion.div>

          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
          >
            {stats && [
              { label: 'Dipendenti Attivi', value: stats.activeEmployees, icon: '👥' },
              { label: 'Totale', value: stats.totalEmployees, icon: '👨‍💼' },
              { label: 'Approvazioni', value: stats.pendingApprovals, icon: '⏳' },
              { label: 'Alert Turni', value: stats.shiftAlerts, icon: '⚠️' },
              { label: 'Doc Scadenti', value: stats.expiringDocs, icon: '📄' },
              { label: 'Geofence', value: stats.geofenceAlerts, icon: '📍' }
            ].map((kpi, i) => (
              <div
                key={i}
                className={`p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow ${
                  kpi.value > 0 ? 'ring-2 ring-orange-500/50' : ''
                }`}
              >
                <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">{kpi.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Active Alerts */}
          {alerts && alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 md:p-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/40 rounded-xl"
            >
              <h3 className="font-semibold text-red-900 dark:text-red-200 flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5" />
                Azioni Richieste
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {alerts.map((alert, i) => (
                  <div key={i} className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{alert.count}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">{alert.type}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick Access Modules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
          >
            {modules.map((module, i) => {
              const Icon = module.icon;
              return (
                <Link
                  key={i}
                  to={module.path}
                  className="p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all group"
                >
                  <div className={`bg-gradient-to-br ${module.color} w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 md:w-6 h-5 md:h-6 text-white" />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-slate-800 dark:text-white text-center line-clamp-2">
                    {module.label}
                  </p>
                </Link>
              );
            })}
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 md:p-8 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Suggerimento</h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm md:text-base">
              Accedi a "Geofence" per configurare zone geografiche di lavoro e ricevere alert automatici su violazioni.
            </p>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}