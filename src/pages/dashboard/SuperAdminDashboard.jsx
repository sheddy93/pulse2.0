/**
 * pages/dashboard/SuperAdminDashboard.jsx
 * Dashboard per super_admin: panoramica aziende, utenti, analytics
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    companies: 0,
    users: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (me?.role !== 'super_admin') {
        window.location.href = '/';
        return;
      }
      setUser(me);
      
      try {
        const [companies, users, subs] = await Promise.all([
          base44.entities.Company.list(),
          base44.entities.User.list(),
          base44.entities.CompanySubscription.list(),
        ]);
        
        setStats({
          companies: companies?.length || 0,
          users: users?.length || 0,
          activeSubscriptions: subs?.filter(s => s.status === 'active')?.length || 0,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="red" />;
  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Panoramica piattaforma PulseHR</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.companies}</p>
                <p className="text-sm text-slate-500">Aziende</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.users}</p>
                <p className="text-sm text-slate-500">Utenti totali</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.activeSubscriptions}</p>
                <p className="text-sm text-slate-500">Abbonamenti attivi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/dashboard/admin/companies" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Gestione Aziende</p>
                <p className="text-sm text-slate-500">Monitora e configura</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/admin/users" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-violet-300 transition-colors">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-violet-600" />
              <div>
                <p className="font-semibold text-slate-900">Gestione Utenti</p>
                <p className="text-sm text-slate-500">Ruoli e permessi</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}