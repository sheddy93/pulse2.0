import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/layout/StatCard";
import PageLoader from "@/components/layout/PageLoader";
import { Building2, Users, Briefcase, Activity } from "lucide-react";

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
      setStats({
        companies: companies.length,
        employees: employees.length,
        consultants: users.filter(u => u.role === "consultant").length,
        users: users.length,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="red" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Dashboard Super Admin</h1>
          <p className="text-red-200 text-sm">Controllo completo sulla piattaforma PulseHR.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Aziende" value={stats.companies} icon={Building2} color="blue" />
          <StatCard label="Dipendenti" value={stats.employees} icon={Users} color="green" />
          <StatCard label="Consulenti" value={stats.consultants} icon={Briefcase} color="violet" />
          <StatCard label="Utenti totali" value={stats.users} icon={Activity} color="orange" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Stato sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Aziende attive", val: stats.companies },
              { label: "Dipendenti registrati", val: stats.employees },
              { label: "Consulenti attivi", val: stats.consultants },
            ].map(({ label, val }) => (
              <div key={label} className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}