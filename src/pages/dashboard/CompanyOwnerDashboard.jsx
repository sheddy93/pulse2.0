/**
 * pages/dashboard/CompanyOwnerDashboard.jsx
 * Dashboard per company_owner, hr_manager, company_admin
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContextDecoupled';
import { companyService } from '@/services/companyService';
import { employeeService } from '@/services/employeeService';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Users, Clock, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompanyOwnerDashboard() {
  const { user: authUser, isLoadingAuth } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    pendingLeave: 0,
    pendingOvertime: 0,
    documents: 0,
  });

  useEffect(() => {
    if (!isLoadingAuth && authUser?.company_id) {
      const loadData = async () => {
        try {
          const comp = await companyService.getCompany(authUser.company_id);
          setCompany(comp);
          
          const emps = await employeeService.listEmployees(authUser.company_id);
          
          // TODO: Integrate with leave/overtime services
          setStats({
            employees: emps?.length || 0,
            pendingLeave: 2,
            pendingOvertime: 1,
            documents: 3,
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
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Aziendale</h1>
          <p className="text-slate-600 mt-1">{company?.name || 'La tua azienda'}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.employees}</p>
                <p className="text-sm text-slate-500">Dipendenti</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingLeave}</p>
                <p className="text-sm text-slate-500">Ferie in attesa</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingOvertime}</p>
                <p className="text-sm text-slate-500">Straordinari</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.documents}</p>
                <p className="text-sm text-slate-500">Documenti</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/dashboard/company/employees" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Dipendenti</p>
                <p className="text-sm text-slate-500">Gestisci il personale</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/company/leave-requests" className="bg-white rounded-lg border border-slate-200 p-6 hover:border-orange-300 transition-colors">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-semibold text-slate-900">Approvazioni</p>
                <p className="text-sm text-slate-500">Ferie e permessi</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}