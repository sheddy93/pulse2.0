/**
 * pages/dashboard/SuperAdminDashboard.jsx
 * Dashboard master super_admin: Overview, Companies, Users, System, Analytics
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import SuperAdminOverview from '@/components/admin/SuperAdminOverview';
import CompanyManagement from '@/components/admin/CompanyManagement';
import UserManagement from '@/components/admin/UserManagement';
import SystemHealth from '@/components/admin/SystemHealth';
import LandingPageManager from '@/components/admin/LandingPageManager';
import PricingConfigManager from '@/components/admin/PricingConfigManager';
import { LayoutGrid, Building2, Users, Activity, BarChart3, Palette, DollarSign } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    companies: 0,
    users: 0,
    activeSubscriptions: 0,
    totalEmployees: 0,
    totalStorage: 0,
    alerts: 0,
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (me?.role !== 'super_admin') {
        window.location.href = '/';
        return;
      }
      setUser(me);
      
      try {
        const [companies, users, subs, employees] = await Promise.all([
          base44.entities.Company.list(),
          base44.entities.User.list(),
          base44.entities.CompanySubscription.list(),
          base44.entities.EmployeeProfile.list(),
        ]);
        
        setStats({
          companies: companies?.length || 0,
          users: users?.length || 0,
          activeSubscriptions: subs?.filter(s => s.status === 'active')?.length || 0,
          totalEmployees: employees?.length || 0,
          totalStorage: Math.round((employees?.length || 0) * 2.5),
          alerts: 1,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="red" />;
  if (!user) return null;

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: LayoutGrid },
    { id: 'companies', label: 'Aziende', icon: Building2 },
    { id: 'users', label: 'Utenti', icon: Users },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'landing', label: 'Landing Page', icon: Palette },
    { id: 'system', label: 'Sistema', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Control Center</h1>
          <p className="text-slate-600 mt-1">Gestione completa della piattaforma PulseHR</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex gap-1 p-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <SuperAdminOverview stats={stats} />}
            {activeTab === 'companies' && <CompanyManagement />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'pricing' && <PricingConfigManager />}
            {activeTab === 'landing' && <LandingPageManager />}
            {activeTab === 'system' && <SystemHealth />}
            {activeTab === 'analytics' && (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Analytics avanzate - Coming Soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}