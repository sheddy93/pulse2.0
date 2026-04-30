import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Search, Filter, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const PLAN_TYPES = {
  onboarding: "Onboarding",
  skill_development: "Sviluppo Competenze",
  compliance: "Conformità",
  career_growth: "Crescita Carriera",
  custom: "Personalizzato"
};

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700"
};

export default function TrainingPlanManagement() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      if (!me.company_id) {
        setLoading(false);
        return;
      }

      const [plansData, empsData] = await Promise.all([
        base44.entities.TrainingPlan.filter({ company_id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id, status: "active" })
      ]);

      setPlans(plansData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setEmployees(empsData);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = plans.filter(plan => {
    const matchesSearch = plan.employee_name.toLowerCase().includes(search.toLowerCase()) ||
                         plan.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || plan.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <PageLoader color="blue" />;

  const stats = {
    total: plans.length,
    active: plans.filter(p => p.status === "active").length,
    completed: plans.filter(p => p.status === "completed").length,
    overdue: plans.filter(p => p.courses?.some(c => c.status === "overdue")).length
  };

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Piani di Formazione</h1>
            <p className="text-slate-600 mt-1">Gestisci piani personalizzati e competenze dipendenti</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Nuovo Piano
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Total Piani</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Attivi</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Completati</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Scaduti</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca dipendente o piano..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tutti</option>
            <option value="draft">Bozza</option>
            <option value="active">Attivo</option>
            <option value="completed">Completato</option>
            <option value="cancelled">Annullato</option>
          </select>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessun piano trovato</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Dipendente</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Piano</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Tipo</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Avanzamento</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Stato</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Scadenza</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(plan => (
                    <tr key={plan.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <p className="font-semibold text-slate-900">{plan.employee_name}</p>
                        <p className="text-xs text-slate-500">{plan.employee_email}</p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-semibold text-slate-800">{plan.title}</p>
                      </td>
                      <td className="px-6 py-3 text-xs">
                        {PLAN_TYPES[plan.plan_type]}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${plan.progress_percentage || 0}%` }} />
                          </div>
                          <span className="text-xs font-bold">{plan.progress_percentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[plan.status]}`}>
                          {plan.status === "draft" ? "Bozza" : plan.status === "active" ? "Attivo" : plan.status === "completed" ? "Completato" : "Annullato"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {plan.end_date ? format(new Date(plan.end_date), "d MMM yyyy", { locale: it }) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <button className="text-blue-600 hover:text-blue-700 font-semibold text-xs">
                          Modifica
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}