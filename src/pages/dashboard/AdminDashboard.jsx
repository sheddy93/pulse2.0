import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/layout/StatCard";
import { Building2, Users, Briefcase, Shield, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ companies: 0, employees: 0, consultants: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.Company.list(),
      base44.entities.EmployeeProfile.list(),
      base44.entities.User.list(),
    ]).then(([me, companies, employees, users]) => {
      setUser(me);
      const consultants = users.filter(u => u.role === "consultant");
      setStats({
        companies: companies.length,
        employees: employees.length,
        consultants: consultants.length,
        users: users.length,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Dashboard Super Admin</h1>
          </div>
          <p className="text-red-100">Hai accesso completo alla piattaforma PulseHR.</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Aziende registrate" value={stats.companies} icon={Building2} color="blue" />
          <StatCard label="Dipendenti totali" value={stats.employees} icon={Users} color="green" />
          <StatCard label="Consulenti" value={stats.consultants} icon={Briefcase} color="violet" />
          <StatCard label="Utenti totali" value={stats.users} icon={Activity} color="orange" />
        </div>

        {/* Info panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Panoramica sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">Aziende attive</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.companies}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">Dipendenti attivi</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.employees}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">Consulenti attivi</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.consultants}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-4 text-center">
            Sezioni di gestione avanzata disponibili nelle pagine dedicate.
          </p>
        </div>
      </div>
    </AppShell>
  );
}