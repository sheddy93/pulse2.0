/**
 * pages/dashboard/ManagerDashboard.jsx
 * Dashboard per manager: vede il suo team
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContextDecoupled';
import { employeeService } from '@/services/employeeService';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Users, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ManagerDashboard() {
  const { user: authUser, isLoadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    teamMembers: 0,
    pendingLeave: 0,
  });

  useEffect(() => {
    if (!isLoadingAuth && authUser?.company_id) {
      const loadData = async () => {
        try {
          const team = await employeeService.listEmployees(authUser.company_id);
          
          setStats({
            teamMembers: team?.length || 0,
            pendingLeave: 2,
          });
        } catch (err) {
          console.error('Error loading stats:', err);
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
  if (!authUser) return null;

  return (
    <AppShell user={authUser}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Manager</h1>
          <p className="text-slate-600 mt-1">Gestisci il tuo team</p>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.teamMembers}</p>
                <p className="text-sm text-slate-500">Membri del team</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.pendingLeave}</p>
                <p className="text-sm text-slate-500">Ferie in attesa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4">
          <Link to="/dashboard/company/employees" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Il mio Team</p>
                <p className="text-sm text-slate-500">Visualizza e gestisci</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/company/leave-requests" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-orange-300 transition-colors">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-semibold text-slate-900">Approvazioni Ferie</p>
                <p className="text-sm text-slate-500">Gestisci le richieste</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}