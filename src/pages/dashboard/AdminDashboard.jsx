import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Users, Building2, Activity, TrendingUp, Settings, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ companies: 0, users: 0 });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const [companies, users] = await Promise.all([
        base44.entities.Company.list(),
        base44.entities.User.list(),
      ]);
      setStats({ companies: companies.length, users: users.length });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="red" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Panoramica della piattaforma PulseHR</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Aziende", value: stats.companies, icon: Building2, color: "text-blue-600 bg-blue-50" },
            { label: "Utenti totali", value: stats.users, icon: Users, color: "text-violet-600 bg-violet-50" },
            { label: "Attività", value: "—", icon: Activity, color: "text-emerald-600 bg-emerald-50" },
            { label: "Revenue", value: "—", icon: TrendingUp, color: "text-orange-600 bg-orange-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/dashboard/admin/analytics" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Analytics</p>
              <p className="text-sm text-slate-500">Statistiche e report della piattaforma</p>
            </div>
          </Link>
          <Link to="/dashboard/admin/settings" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-violet-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Impostazioni</p>
              <p className="text-sm text-slate-500">Configura piani, Stripe e sistema</p>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}