import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Edit2, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

const BENEFIT_TYPES = {
  health_insurance: "Assicurazione sanitaria",
  dental: "Dentale",
  vision: "Visione",
  life_insurance: "Assicurazione vita",
  retirement: "Pensione",
  flexible_spending: "Spese flessibili",
  gym_wellness: "Palestra/Wellness",
  other: "Altro"
};

export default function BenefitManagement() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "health_insurance",
    description: "",
    provider: "",
    coverage_levels: "Employee,Employee+Spouse,Family",
    monthly_cost_employee: 0,
    monthly_cost_company: 0,
    enrollment_period_start: "",
    enrollment_period_end: "",
    is_mandatory: false,
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, plans] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.BenefitPlan.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setPlans(plans);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      company_id: company.id,
      ...form,
      coverage_levels: form.coverage_levels.split(",").map(s => s.trim()),
      monthly_cost_employee: parseFloat(form.monthly_cost_employee),
      monthly_cost_company: parseFloat(form.monthly_cost_company),
    };

    if (editingId) {
      await base44.entities.BenefitPlan.update(editingId, data);
    } else {
      await base44.entities.BenefitPlan.create(data);
    }

    const updated = await base44.entities.BenefitPlan.filter({ company_id: company.id });
    setPlans(updated);
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      type: "health_insurance",
      description: "",
      provider: "",
      coverage_levels: "Employee,Employee+Spouse,Family",
      monthly_cost_employee: 0,
      monthly_cost_company: 0,
      enrollment_period_start: "",
      enrollment_period_end: "",
      is_mandatory: false,
    });
  };

  const handleDelete = async (id) => {
    if (confirm("Elimina questo piano benefit?")) {
      await base44.entities.BenefitPlan.delete(id);
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestione Benefit</h1>
            <p className="text-sm text-slate-500">{company?.name}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Nuovo Piano
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Nuovo Piano Benefit</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Assicurazione Sanitas"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(BENEFIT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Provider</label>
                <input
                  type="text"
                  value={form.provider}
                  onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Sanitas"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Livelli copertura (virgola separati)</label>
                <input
                  type="text"
                  value={form.coverage_levels}
                  onChange={e => setForm(f => ({ ...f, coverage_levels: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Costo mensile dipendente (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monthly_cost_employee}
                  onChange={e => setForm(f => ({ ...f, monthly_cost_employee: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Costo mensile azienda (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monthly_cost_company}
                  onChange={e => setForm(f => ({ ...f, monthly_cost_company: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Inizio periodo enrollment</label>
                <input
                  type="date"
                  value={form.enrollment_period_start}
                  onChange={e => setForm(f => ({ ...f, enrollment_period_start: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fine periodo enrollment</label>
                <input
                  type="date"
                  value={form.enrollment_period_end}
                  onChange={e => setForm(f => ({ ...f, enrollment_period_end: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrizione</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Dettagli del piano..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mandatory"
                  checked={form.is_mandatory}
                  onChange={e => setForm(f => ({ ...f, is_mandatory: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="mandatory" className="text-sm text-slate-600">Obbligatorio per tutti</label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Salva Piano
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Piani Disponibili ({plans.length})</h2>
          </div>
          {plans.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400">Nessun piano benefit ancora</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {plans.map(plan => (
                <div key={plan.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{plan.name}</h3>
                        {plan.is_mandatory && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">Obbligatorio</span>}
                      </div>
                      <p className="text-sm text-slate-600">{BENEFIT_TYPES[plan.type]}</p>
                      {plan.description && <p className="text-xs text-slate-500 mt-1">{plan.description}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        {plan.provider && <span>Provider: {plan.provider}</span>}
                        {plan.enrollment_period_start && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(plan.enrollment_period_start), "d MMM")} - {format(new Date(plan.enrollment_period_end), "d MMM")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingId(plan.id); setShowForm(true); }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}