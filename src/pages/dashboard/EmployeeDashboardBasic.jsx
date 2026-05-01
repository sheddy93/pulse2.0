/**
 * pages/dashboard/EmployeeDashboardBasic.jsx
 * Dashboard per employee: attività personali
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Clock, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmployeeDashboardBasic() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      try {
        const emps = await base44.entities.EmployeeProfile?.filter({ user_email: me.email });
        setEmployee(emps?.[0] || null);
      } catch (err) {
        console.error('Error loading employee:', err);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="green" />;
  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">{employee?.job_title || 'Benvenuto'}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/dashboard/employee/attendance" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Timbratura</p>
                <p className="text-sm text-slate-500">Registra la tua presenza</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/employee/leave" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-orange-300 transition-colors">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-semibold text-slate-900">Ferie & Permessi</p>
                <p className="text-sm text-slate-500">Gestisci il tuo tempo libero</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/employee/personal-documents" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="font-semibold text-slate-900">Documenti</p>
                <p className="text-sm text-slate-500">I tuoi documenti</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}