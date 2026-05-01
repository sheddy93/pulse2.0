import { useState, useEffect } from "react";
// All base44 references removed - Stripe plans via backend functions
import { Plus, Trash2, Save, RefreshCw, Check, CreditCard, Star, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_PLAN = {
  name: "",
  description: "",
  price_monthly: 0,
  price_yearly: 0,
  max_employees: 10,
  max_admins: 1,
  features: [],
  is_active: true,
  is_popular: false,
  sort_order: 0,
  color: "blue",
};

const COLORS = ["blue", "violet", "emerald", "orange", "red", "slate"];

export default function StripePlansManager() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [newFeature, setNewFeature] = useState({});

  const loadPlans = async () => {
    const p = await base44.entities.SubscriptionPlan.list("-sort_order");
    setPlans(p);
    setLoading(false);
  };

  useEffect(() => { loadPlans(); }, []);

  const addPlan = async () => {
    const plan = await base44.entities.SubscriptionPlan.create({ ...DEFAULT_PLAN, name: "Nuovo Piano", sort_order: plans.length });
    setPlans(prev => [...prev, plan]);
    setExpanded(plan.id);
    toast.success("Piano creato");
  };

  const updateLocal = (id, field, value) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const savePlan = async (plan) => {
    setSaving(plan.id);
    await base44.entities.SubscriptionPlan.update(plan.id, plan);
    toast.success(`Piano "${plan.name}" salvato`);
    setSaving(null);
  };

  const deletePlan = async (plan) => {
    if (!confirm(`Eliminare il piano "${plan.name}"?`)) return;
    await base44.entities.SubscriptionPlan.delete(plan.id);
    setPlans(prev => prev.filter(p => p.id !== plan.id));
    toast.success("Piano eliminato");
  };

  const syncToStripe = async (plan) => {
    if (!plan.id) return;
    setSyncing(plan.id);
    // Save first
    await base44.entities.SubscriptionPlan.update(plan.id, plan);
    setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    try {
      const res = await base44.functions.invoke("stripePlans", { action: "sync_to_stripe", plan });
      if (res.data?.success) {
        toast.success("Sincronizzato con Stripe!");
        await loadPlans();
      } else {
        toast.error(res.data?.error || "Errore sync Stripe");
      }
    } catch (e) {
      toast.error(e.message);
    }
    setSyncing(null);
  };

  const addFeature = (planId) => {
    const text = newFeature[planId];
    if (!text?.trim()) return;
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: [...(p.features || []), text.trim()] } : p));
    setNewFeature(prev => ({ ...prev, [planId]: "" }));
  };

  const removeFeature = (planId, idx) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: p.features.filter((_, i) => i !== idx) } : p));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Piani di Abbonamento</h2>
          <p className="text-sm text-slate-500">Configura piani e sincronizzali con Stripe</p>
        </div>
        <button onClick={addPlan} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nuovo Piano
        </button>
      </div>

      {plans.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nessun piano configurato</p>
          <p className="text-sm text-slate-400 mt-1">Clicca "Nuovo Piano" per iniziare</p>
        </div>
      )}

      {plans.map(plan => (
        <div key={plan.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50"
            onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
          >
            <div className={`w-3 h-3 rounded-full ${plan.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{plan.name}</span>
                {plan.is_popular && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold flex items-center gap-1"><Star className="w-3 h-3" />Popolare</span>}
                {plan.stripe_product_id && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">✓ Stripe</span>}
              </div>
              <p className="text-sm text-slate-500">€{plan.price_monthly}/mese · €{plan.price_yearly || "—"}/anno · max {plan.max_employees} dipendenti</p>
            </div>
            {expanded === plan.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {/* Body */}
          {expanded === plan.id && (
            <div className="border-t border-slate-100 p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Piano</label>
                  <input value={plan.name} onChange={e => updateLocal(plan.id, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Colore</label>
                  <select value={plan.color || "blue"} onChange={e => updateLocal(plan.id, "color", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prezzo Mensile (€)</label>
                  <input type="number" value={plan.price_monthly} onChange={e => updateLocal(plan.id, "price_monthly", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prezzo Annuale (€)</label>
                  <input type="number" value={plan.price_yearly || ""} onChange={e => updateLocal(plan.id, "price_yearly", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Dipendenti</label>
                  <input type="number" value={plan.max_employees} onChange={e => updateLocal(plan.id, "max_employees", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Admin</label>
                  <input type="number" value={plan.max_admins} onChange={e => updateLocal(plan.id, "max_admins", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ordine</label>
                  <input type="number" value={plan.sort_order} onChange={e => updateLocal(plan.id, "sort_order", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrizione</label>
                <textarea value={plan.description || ""} onChange={e => updateLocal(plan.id, "description", e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={plan.is_active} onChange={e => updateLocal(plan.id, "is_active", e.target.checked)} className="rounded" />
                  <span>Attivo</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={plan.is_popular || false} onChange={e => updateLocal(plan.id, "is_popular", e.target.checked)} className="rounded" />
                  <span>Popolare</span>
                </label>
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Funzionalità incluse</label>
                <div className="space-y-2 mb-2">
                  {(plan.features || []).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="flex-1">{f}</span>
                      <button onClick={() => removeFeature(plan.id, i)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newFeature[plan.id] || ""} onChange={e => setNewFeature(p => ({ ...p, [plan.id]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addFeature(plan.id)}
                    placeholder="Aggiungi funzionalità..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => addFeature(plan.id)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stripe IDs (read-only) */}
              {plan.stripe_product_id && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1 text-xs text-emerald-700">
                  <p><strong>Stripe Product:</strong> {plan.stripe_product_id}</p>
                  {plan.stripe_price_monthly_id && <p><strong>Price Mensile:</strong> {plan.stripe_price_monthly_id}</p>}
                  {plan.stripe_price_yearly_id && <p><strong>Price Annuale:</strong> {plan.stripe_price_yearly_id}</p>}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 flex-wrap pt-2 border-t border-slate-100">
                <button onClick={() => savePlan(plan)} disabled={saving === plan.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saving === plan.id ? "Salvataggio..." : "Salva"}
                </button>
                <button onClick={() => syncToStripe(plan)} disabled={syncing === plan.id}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${syncing === plan.id ? "animate-spin" : ""}`} />
                  {syncing === plan.id ? "Sincronizzando..." : "Sync Stripe"}
                </button>
                <button onClick={() => deletePlan(plan)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> Elimina
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}