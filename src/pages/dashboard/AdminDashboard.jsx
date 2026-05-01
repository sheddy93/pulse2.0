import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Users, Building2, Activity, TrendingUp, Settings, BarChart3, Globe, Zap, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    companies: 0, 
    users: 0, 
    employees: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    consultants: 0
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const [companies, users, employees, subs, consultants] = await Promise.all([
        base44.entities.Company.list(),
        base44.entities.User.list(),
        base44.entities.EmployeeProfile.list(),
        base44.entities.CompanySubscription.list(),
        base44.entities.User.filter({ role: "consultant" }),
      ]);
      
      const activeSubCount = subs.filter(s => s.status === "active").length;
      const trialSubCount = subs.filter(s => s.status === "trialing").length;

      setStats({ 
        companies: companies.length,
        users: users.length,
        employees: employees.length,
        activeSubscriptions: activeSubCount,
        trialSubscriptions: trialSubCount,
        consultants: consultants.length
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="red" />;

  const KPIs = [
    { label: "Aziende", value: stats.companies, icon: Building2, color: "text-blue-600 bg-blue-50", path: "/dashboard/admin/companies" },
    { label: "Utenti totali", value: stats.users, icon: Users, color: "text-violet-600 bg-violet-50", path: "/dashboard/admin/users" },
    { label: "Dipendenti", value: stats.employees, icon: Activity, color: "text-emerald-600 bg-emerald-50", path: null },
    { label: "Abbonamenti Attivi", value: stats.activeSubscriptions, icon: TrendingUp, color: "text-orange-600 bg-orange-50", path: "/dashboard/admin/companies" },
  ];

  const alerts = [
    ...(stats.trialSubscriptions > 0 ? [{ type: "info", text: `${stats.trialSubscriptions} aziende in trial` }] : []),
    ...(stats.employees === 0 ? [{ type: "warning", text: "Nessun dipendente registrato" }] : []),
  ];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
          <p className="text-slate-600">Panoramica completa della piattaforma PulseHR</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIs.map((s) => {
            const Comp = s.path ? Link : "div";
            const props = s.path ? { to: s.path } : {};
            return (
              <Comp key={s.label} {...props} className={`bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 ${s.path ? "hover:border-slate-300 transition-colors cursor-pointer" : ""}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              </Comp>
            );
          })}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`rounded-lg p-4 flex items-center gap-3 ${
                alert.type === "warning" 
                  ? "bg-orange-50 border border-orange-200" 
                  : "bg-blue-50 border border-blue-200"
              }`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${alert.type === "warning" ? "text-orange-600" : "text-blue-600"}`} />
                <p className={`text-sm font-medium ${alert.type === "warning" ? "text-orange-700" : "text-blue-700"}`}>{alert.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/dashboard/admin/companies" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Gestione Aziende</p>
              <p className="text-xs text-slate-500">Monitora e attiva/disattiva</p>
            </div>
          </Link>

          <Link to="/dashboard/admin/users" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-violet-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Gestione Utenti</p>
              <p className="text-xs text-slate-500">Ruoli e permessi</p>
            </div>
          </Link>

          <Link to="/dashboard/admin/analytics" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Analytics</p>
              <p className="text-xs text-slate-500">Report piattaforma</p>
            </div>
          </Link>

          <Link to="/dashboard/admin/temporary-logins" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Login Temporanei</p>
              <p className="text-xs text-slate-500">Crea credenziali</p>
            </div>
          </Link>

          <Link to="/dashboard/admin/system" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-red-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Sistema</p>
              <p className="text-xs text-slate-500">Stato piattaforma</p>
            </div>
          </Link>

          <Link to="/dashboard/admin/settings" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Impostazioni</p>
              <p className="text-xs text-slate-500">Piani, email, landing</p>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}