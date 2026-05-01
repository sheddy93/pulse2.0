import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Building2, Search, Users, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function AdminCompanies() {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (me?.role !== "super_admin") { window.location.href = "/"; return; }
      setUser(me);
      const [comps, emps, subs] = await Promise.all([
        base44.entities.Company.list(),
        base44.entities.EmployeeProfile.list(),
        base44.entities.CompanySubscription.list(),
      ]);
      setCompanies(comps);
      setEmployees(emps);
      setSubscriptions(subs);
    }).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (company) => {
    const updated = await base44.entities.Company.update(company.id, { is_active: !company.is_active });
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, is_active: !c.is_active } : c));
  };

  const filtered = companies.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader color="red" />;

  const getEmployeeCount = (companyId) => employees.filter(e => e.company_id === companyId).length;
  const getSubscription = (companyId) => subscriptions.find(s => s.company_id === companyId);

  const STATUS_BADGE = {
    active: "bg-emerald-100 text-emerald-700",
    trialing: "bg-blue-100 text-blue-700",
    past_due: "bg-red-100 text-red-700",
    canceled: "bg-slate-100 text-slate-500",
  };

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestione Aziende</h1>
            <p className="text-sm text-slate-500">{companies.length} aziende registrate</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Totale Aziende", value: companies.length, color: "text-blue-600 bg-blue-50" },
            { label: "Aziende Attive", value: companies.filter(c => c.is_active).length, color: "text-emerald-600 bg-emerald-50" },
            { label: "Totale Dipendenti", value: employees.length, color: "text-violet-600 bg-violet-50" },
            { label: "Con Abbonamento", value: subscriptions.filter(s => s.status === "active").length, color: "text-orange-600 bg-orange-50" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca per nome o email..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Azienda</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Contatti</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Dipendenti</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Abbonamento</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Stato</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(company => {
                  const sub = getSubscription(company.id);
                  return (
                    <tr key={company.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{company.name}</p>
                            <p className="text-xs text-slate-400">ID: {company.public_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-700">{company.email || "—"}</p>
                        <p className="text-xs text-slate-400">{company.phone || ""}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{getEmployeeCount(company.id)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {sub ? (
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[sub.status] || "bg-slate-100 text-slate-500"}`}>
                              {sub.plan_name}
                            </span>
                            <p className="text-xs text-slate-400 mt-0.5">{sub.status}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Nessun piano</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {company.is_active ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" /> Attiva
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                            <XCircle className="w-3.5 h-3.5" /> Disattiva
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleActive(company)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            company.is_active
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {company.is_active ? "Disattiva" : "Attiva"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nessuna azienda trovata</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}