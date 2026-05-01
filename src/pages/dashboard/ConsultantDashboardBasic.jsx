/**
 * pages/dashboard/ConsultantDashboardBasic.jsx
 * Dashboard per external_consultant
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Building2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ConsultantDashboardBasic() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    companies: 0,
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      try {
        const links = await base44.entities.ConsultantCompanyLink?.filter({
          consultant_user_id: me.id,
          status: 'active'
        });
        setStats({
          companies: links?.length || 0,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="purple" />;
  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Consulente</h1>
          <p className="text-slate-600 mt-1">Gestisci le tue aziende clienti</p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{stats.companies}</p>
              <p className="text-sm text-slate-500">Aziende clienti collegate</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4">
          <Link to="/dashboard/consultant/companies" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-semibold text-slate-900">Aziende Clienti</p>
                <p className="text-sm text-slate-500">Visualizza le tue connessioni</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/consultant/document-review" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Revisione Documenti</p>
                <p className="text-sm text-slate-500">Documenti in attesa</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}