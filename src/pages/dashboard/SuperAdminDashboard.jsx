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
    { id: 'subscriptions', label: 'Abbonamenti', icon: DollarSign },
    { id: 'audit', label: 'Audit Log', icon: Activity },
    { id: 'emails', label: 'Email Log', icon: BarChart3 },
    { id: 'stripe', label: 'Stripe Events', icon: DollarSign },
    { id: 'features', label: 'Feature Flags', icon: Palette },
    { id: 'ai', label: 'AI Usage', icon: BarChart3 },
    { id: 'storage', label: 'Storage', icon: Activity },
    { id: 'system', label: 'Sistema', icon: Activity },
  ];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Control Center</h1>
          <p className="text-slate-600 mt-1">Gestione completa della piattaforma AldevionHR</p>
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
            {activeTab === 'subscriptions' && (
              <div className="text-center py-12 text-slate-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Gestione Abbonamenti - Coming Soon</p>
              </div>
            )}
            {activeTab === 'audit' && (
              <div className="text-center py-12 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Audit Log Completo - Coming Soon</p>
              </div>
            )}
            {activeTab === 'emails' && (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Email Log - Coming Soon</p>
              </div>
            )}
            {activeTab === 'stripe' && (
              <div className="text-center py-12 text-slate-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Stripe Events - Coming Soon</p>
              </div>
            )}
            {activeTab === 'features' && (
              <div className="text-center py-12 text-slate-500">
                <Palette className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Feature Flags Management - Coming Soon</p>
              </div>
            )}
            {activeTab === 'ai' && (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>AI Usage Analytics - Disattivato (Assistente base only)</p>
                <p className="text-xs text-slate-400 mt-2">Pronto per Gemini/Claude integration</p>
              </div>
            )}
            {activeTab === 'storage' && (
              <div className="text-center py-12 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Storage Usage - Coming Soon</p>
              </div>
            )}
            {activeTab === 'system' && <SystemHealth />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}