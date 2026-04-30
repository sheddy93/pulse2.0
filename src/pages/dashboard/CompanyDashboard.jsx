import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/layout/StatCard";
import PageLoader from "@/components/layout/PageLoader";
import { Users, Briefcase, CalendarDays, UserPlus, Copy, Check, Building2 } from "lucide-react";
import PayrollExport from "@/components/company/PayrollExport";

const STATUS_BADGE = {
  active: { label: "Attivo", cls: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Inattivo", cls: "bg-slate-100 text-slate-500" },
  onboarding: { label: "Onboarding", cls: "bg-blue-100 text-blue-700" },
};

export default function CompanyDashboard() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, emps, links, leaveReqs] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id }),
        base44.entities.ConsultantCompanyLink.filter({ company_id: me.company_id, status: "approved" }),
        base44.entities.LeaveRequest.filter({ company_id: me.company_id, status: "pending" }),
      ]);
      setCompany(companies[0] || null);
      setEmployees(emps);
      setConsultants(links);
      setLeaves(leaveReqs);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="blue" />;

  const activeEmps = employees.filter(e => e.status === "active");
  const isNew = employees.length === 0;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold mb-1">{company?.name || "Dashboard Azienda"}</h1>
              <p className="text-blue-200 text-sm">Gestisci dipendenti, presenze, documenti e consulenti.</p>
            </div>
            {company?.public_id && (
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div>
                  <p className="text-xs text-blue-200">ID pubblico azienda</p>
                  <code className="text-sm font-bold tracking-widest">{company.public_id}</code>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(company.public_id); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/dashboard/company/employees/new" className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Aggiungi lavoratore
            </Link>
            <Link to="/dashboard/company/consultants" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Gestisci consulenti
            </Link>
            {company && <PayrollExport companyId={company.id} employees={employees} />}
          </div>
        </div>

        {/* No company warning */}
        {!company && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
            <Building2 className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">Account non associato a un'azienda</p>
            <p className="text-sm text-slate-500 mt-1">Contatta l'amministratore della piattaforma.</p>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Dipendenti attivi" value={activeEmps.length} icon={Users} color="blue" />
          <StatCard label="Consulenti collegati" value={consultants.length} icon={Briefcase} color="violet" />
          <StatCard label="Richieste ferie" value={leaves.length} icon={CalendarDays} color="orange" sub="In attesa" />
          <StatCard label="Dipendenti totali" value={employees.length} icon={Users} color="slate" />
        </div>

        {/* Onboarding checklist */}
        {isNew && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-800 mb-3">✨ Inizia con PulseHR</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Aggiungi il primo lavoratore", path: "/dashboard/company/employees/new" },
                { label: "Collega un consulente", path: "/dashboard/company/consultants" },
                { label: "Visualizza le presenze", path: "/dashboard/company/attendance" },
                { label: "Carica i documenti", path: "/dashboard/company/documents" },
              ].map(item => (
                <Link key={item.path} to={item.path} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors text-sm font-medium text-slate-700">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Employees table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Dipendenti recenti</h2>
            <Link to="/dashboard/company/employees" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Vedi tutti →</Link>
          </div>
          {employees.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mb-3" />
              <p className="font-medium text-slate-600">Nessun dipendente ancora</p>
              <Link to="/dashboard/company/employees/new" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                Aggiungi il primo lavoratore
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Nome", "Mansione", "Reparto", "Stato", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.slice(0, 8).map(emp => {
                    const badge = STATUS_BADGE[emp.status] || STATUS_BADGE.active;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{emp.first_name} {emp.last_name}</td>
                        <td className="px-5 py-3 text-slate-500">{emp.job_title || "—"}</td>
                        <td className="px-5 py-3 text-slate-500">{emp.department || "—"}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span></td>
                        <td className="px-5 py-3 text-right">
                          <Link to={`/dashboard/company/employees/${emp.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Apri scheda →</Link>
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