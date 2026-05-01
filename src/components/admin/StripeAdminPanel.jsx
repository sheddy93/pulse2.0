import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, RefreshCw, CreditCard, Users, Check, X, Star, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["blue", "violet", "emerald", "orange", "red", "slate"];
const COLOR_CLASSES = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  red: "bg-red-100 text-red-700 border-red-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_COLORS = {
  active: "bg-emerald-100 text-emerald-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-orange-100 text-orange-700",
  canceled: "bg-red-100 text-red-600",
  unpaid: "bg-red-100 text-red-600",
};

const EMPTY_PLAN = {
  name: "", description: "", price_monthly: 0, max_employees: 0,
  features: [], is_popular: false, color: "blue", sort_order: 0, is_active: true
};

export default function StripeAdminPanel() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState("plans");
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [featuresInput, setFeaturesInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [p, s] = await Promise.all([
      base44.entities.SubscriptionPlan.filter({ is_active: true }),
      base44.entities.CompanySubscription.list("-created_date", 100)
    ]);
    setPlans([...p].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    setSubscriptions(s);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditPlan(null);
    setForm(EMPTY_PLAN);
    setFeaturesInput("");
    setShowForm(true);
  };

  const openEdit = (plan) => {
    setEditPlan(plan);
    setForm({ ...plan });
    setFeaturesInput((plan.features || []).join("\n"));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price_monthly) return toast.error("Nome e prezzo obbligatori");
    setSaving(true);
    try {
      const features = featuresInput.split("\n").map(f => f.trim()).filter(Boolean);
      const payload = { ...form, features };
      const res = await base44.functions.invoke("stripeAdminPlans", {
        action: editPlan ? "update_plan" : "create_plan",
        plan_id: editPlan?.id,
        ...payload
      });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(editPlan ? "Piano aggiornato" : "Piano creato su Stripe!");
      setShowForm(false);
      await loadData();
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Eliminare "${plan.name}"? Le aziende con abbonamento attivo non saranno colpite.`)) return;
    try {
      const res = await base44.functions.invoke("stripeAdminPlans", { action: "delete_plan", plan_id: plan.id });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("Piano disattivato");
      await loadData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("stripeAdminPlans", { action: "sync_stripe" });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`Sincronizzati ${res.data.synced} abbonamenti`);
      await loadData();
    } catch (e) {
      toast.error(e.message);
    }
    setSyncing(false);
  };

  const activeCount = subscriptions.filter(s => s.status === "active" || s.status === "trialing").length;
  const mrr = subscriptions.filter(s => s.status === "active").reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-semibold uppercase">Piani Attivi</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">{plans.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-semibold uppercase">Abbonati</p>
          <p className="text-3xl font-bold text-emerald-800 mt-1">{activeCount}</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="text-xs text-violet-600 font-semibold uppercase">MRR stimato</p>
          <p className="text-3xl font-bold text-violet-800 mt-1">€{mrr.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: "plans", label: "Piani Abbonamento", icon: CreditCard },
          { id: "subscriptions", label: "Abbonamenti Aziende", icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{plans.length} piani configurati</p>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Nuovo Piano
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-slate-900">{editPlan ? "Modifica Piano" : "Nuovo Piano Stripe"}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome Piano *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Startup" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Prezzo mensile (€) *</label>
                  <input type="number" value={form.price_monthly} onChange={e => setForm({ ...form, price_monthly: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="99" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Max dipendenti (0 = illimitati)</label>
                  <input type="number" value={form.max_employees} onChange={e => setForm({ ...form, max_employees: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Ordine visualizzazione</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Descrizione</label>
                <input value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Piano ideale per piccole aziende" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Features (una per riga)</label>
                <textarea value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} rows={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder={"Gestione dipendenti\nPresenze e timbrature\nDocumenti\nChat interna"} />
              </div>
              <div className="flex gap-6 items-center flex-wrap">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Colore badge</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })}
                        className={`w-8 h-8 rounded-full border-2 ${COLOR_CLASSES[c]} ${form.color === c ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}>
                        {form.color === c && <Check className="w-4 h-4 mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_popular} onChange={e => setForm({ ...form, is_popular: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /> Popolare</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Salvataggio..." : editPlan ? "Aggiorna Piano" : "Crea su Stripe"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
                  Annulla
                </button>
              </div>
            </div>
          )}

          {/* Plans list */}
          {loading ? (
            <div className="py-8 text-center text-slate-400">Caricamento...</div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessun piano configurato</p>
              <p className="text-sm text-slate-400 mt-1">Crea il primo piano per abilitare gli abbonamenti</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                      {plan.is_popular && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">
                          <Star className="w-3 h-3" /> Popolare
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${COLOR_CLASSES[plan.color] || COLOR_CLASSES.blue}`}>
                        {plan.color}
                      </span>
                    </div>
                    {plan.description && <p className="text-sm text-slate-500 mt-1">{plan.description}</p>}
                    <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-slate-600">
                      <span className="font-bold text-xl text-slate-900">€{plan.price_monthly}<span className="text-sm font-normal text-slate-500">/mese</span></span>
                      {plan.max_employees > 0 && <span>Max {plan.max_employees} dipendenti</span>}
                      {plan.stripe_price_id && (
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{plan.stripe_price_id}</span>
                      )}
                    </div>
                    {plan.features?.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            <Check className="w-3 h-3 text-emerald-500" /> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(plan)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(plan)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{subscriptions.length} abbonamenti totali</p>
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizzazione..." : "Sync da Stripe"}
            </button>
          </div>
          {subscriptions.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessun abbonamento ancora</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Azienda</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Piano</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Importo</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Stato</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Scadenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{sub.company_name || sub.company_id}</p>
                        {sub.stripe_customer_id && <p className="text-xs text-slate-400 font-mono">{sub.stripe_customer_id}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{sub.plan_name || sub.plan_id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">€{sub.amount || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[sub.status] || STATUS_COLORS.active}`}>
                          {sub.status}
                        </span>
                        {sub.cancel_at_period_end && <span className="ml-2 text-xs text-orange-600">• Cancella a fine periodo</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("it-IT") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}