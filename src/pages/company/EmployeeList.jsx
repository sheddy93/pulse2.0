import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import { Users, UserPlus, Search } from "lucide-react";

const STATUS_BADGE = {
  active: { label: "Attivo", cls: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Inattivo", cls: "bg-slate-100 text-slate-600" },
  onboarding: { label: "Onboarding", cls: "bg-blue-100 text-blue-700" },
};

export default function EmployeeList() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      let emps = [];
      if (me.role === "company") {
        emps = await base44.entities.EmployeeProfile.filter({ company_id: me.company_id });
      } else if (me.role === "consultant") {
        const links = await base44.entities.ConsultantCompanyLink.filter({ consultant_email: me.email, status: "approved" });
        const companyIds = links.map(l => l.company_id);
        const all = await base44.entities.EmployeeProfile.list();
        emps = all.filter(e => companyIds.includes(e.company_id));
      }
      setEmployees(emps);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return !q || `${e.first_name} ${e.last_name} ${e.email} ${e.department} ${e.job_title}`.toLowerCase().includes(q);
  });

  if (loading) return (
    <AppShell user={user}>
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppShell>
  );

  const basePath = user?.role === "consultant" ? "/dashboard/consultant" : "/dashboard/company";

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dipendenti</h1>
            <p className="text-sm text-slate-500">{employees.length} lavoratori totali</p>
          </div>
          {user?.role === "company" && (
            <Link to="/dashboard/company/employees/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              <UserPlus className="w-4 h-4" /> Aggiungi
            </Link>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per nome, email, reparto..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mb-3" />
              <p className="font-medium text-slate-600">{search ? "Nessun risultato" : "Nessun dipendente ancora"}</p>
              {!search && user?.role === "company" && (
                <Link to="/dashboard/company/employees/new" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                  Aggiungi il primo lavoratore
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Mansione</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Reparto</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Stato</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(emp => {
                    const badge = STATUS_BADGE[emp.status] || STATUS_BADGE.active;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{emp.first_name} {emp.last_name}</td>
                        <td className="px-5 py-3 text-slate-500">{emp.email || "—"}</td>
                        <td className="px-5 py-3 text-slate-600">{emp.job_title || "—"}</td>
                        <td className="px-5 py-3 text-slate-600">{emp.department || "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link to={`${basePath}/employees/${emp.id}`} className="text-blue-600 hover:text-blue-700 font-medium text-xs">
                            Apri scheda →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}