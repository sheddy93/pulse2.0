import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Users, UserPlus, Search, Upload, Filter } from "lucide-react";

const STATUS_BADGE = {
  active: { label: "Attivo", cls: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Inattivo", cls: "bg-slate-100 text-slate-500" },
  onboarding: { label: "Onboarding", cls: "bg-blue-100 text-blue-700" },
};

export default function EmployeeList() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      let emps = [];
      const companyRoles = ["company", "company_owner", "company_admin", "hr_manager", "manager"];
      const consultantRoles = ["consultant", "labor_consultant", "external_consultant", "safety_consultant"];
      if (companyRoles.includes(me.role)) {
        emps = await base44.entities.EmployeeProfile.filter({ company_id: me.company_id });
      } else if (consultantRoles.includes(me.role)) {
        const links = await base44.entities.ConsultantCompanyLink.filter({ consultant_email: me.email, status: "approved" });
        if (links.length > 0) {
          const ids = links.map(l => l.company_id);
          const all = await base44.entities.EmployeeProfile.list();
          emps = all.filter(e => ids.includes(e.company_id));
        }
      }
      setEmployees(emps);
    }).finally(() => setLoading(false));
  }, []);

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${e.first_name} ${e.last_name} ${e.email || ""} ${e.department || ""} ${e.job_title || ""}`.toLowerCase().includes(q);
    const matchDept = !filterDept || e.department === filterDept;
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const consultantRoles = ["consultant", "labor_consultant", "external_consultant", "safety_consultant"];
  const basePath = consultantRoles.includes(user?.role) ? "/dashboard/consultant" : "/dashboard/company";

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dipendenti</h1>
            <p className="text-sm text-slate-500">{employees.length} lavoratori</p>
          </div>
          {["company", "company_owner", "company_admin", "hr_manager"].includes(user?.role) && (
            <div className="flex gap-2">
              <Link to="/dashboard/company/employees/import" className="flex items-center gap-2 px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100">
                <Upload className="w-4 h-4" /> Importa CSV
              </Link>
              <Link to="/dashboard/company/employees/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                <UserPlus className="w-4 h-4" /> Aggiungi
              </Link>
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cerca nome, email, reparto..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tutti i reparti</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tutti gli stati</option>
            <option value="active">Attivo</option>
            <option value="onboarding">Onboarding</option>
            <option value="inactive">Inattivo</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
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
                    {["Nome", "Email", "Mansione", "Reparto", "Stato", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(emp => {
                    const badge = STATUS_BADGE[emp.status] || STATUS_BADGE.active;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{emp.first_name} {emp.last_name}</td>
                        <td className="px-5 py-3 text-slate-500">{emp.email || "—"}</td>
                        <td className="px-5 py-3 text-slate-500">{emp.job_title || "—"}</td>
                        <td className="px-5 py-3 text-slate-500">{emp.department || "—"}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span></td>
                        <td className="px-5 py-3 text-right">
                          <Link to={`${basePath}/employees/${emp.id}`} className="text-blue-600 hover:text-blue-700 font-medium text-xs whitespace-nowrap">Scheda →</Link>
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