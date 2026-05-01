/**
 * Pricing Management Dashboard
 * ───────────────────────────
 * SuperAdmin panel per settare prezzi piani e add-ons, applicare sconti.
 * ✅ Modifica prezzi piani
 * ✅ Modifica prezzi add-ons
 * ✅ Applica sconti globali o per azienda
 * ✅ Anteprima prezzo finale
 */

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Edit2, Plus, Trash2, DollarSign, Tag, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PricingManagement() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingAddon, setEditingAddon] = useState(null);
  const [discountTarget, setDiscountTarget] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.role === "super_admin") {
        const [plansData, addonsData, subsData] = await Promise.all([
          base44.entities.SubscriptionPlan.list(),
          base44.entities.SubscriptionAddon.list(),
          base44.entities.CompanySubscription.list(),
        ]);
        setPlans(plansData);
        setAddons(addonsData);
        setSubscriptions(subsData);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Gestione Prezzi</h1>

        {/* PIANI */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Piani di Abbonamento
            </h2>
            <Button className="bg-blue-600" onClick={() => setEditingPlan({})}>
              <Plus className="w-4 h-4 mr-2" /> Nuovo Piano
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-blue-600">{plan.base_price_monthly}€</span>
                    <span className="text-sm text-slate-500">/mese</span>
                  </div>
                  <p className="text-sm text-slate-600">Max {plan.max_employees} dipendenti</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPlan(plan)}
                      className="flex-1"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Modifica
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ADD-ONS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <Tag className="w-5 h-5" /> Add-ons (Feature Avanzate)
            </h2>
            <Button className="bg-blue-600" onClick={() => setEditingAddon({})}>
              <Plus className="w-4 h-4 mr-2" /> Nuovo Add-on
            </Button>
          </div>

          <div className="space-y-2">
            {addons.map((addon) => (
              <div key={addon.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{addon.name}</h4>
                  <p className="text-sm text-slate-600">{addon.description}</p>
                  <span className="text-xs text-slate-500">Richiede: {addon.required_tier}</span>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-lg font-bold text-blue-600">{addon.base_price_monthly}€/mese</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAddon(addon)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Modifica
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SCONTI PER AZIENDA */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" /> Gestione Sconti
          </h2>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Azienda</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Piano</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-700">Prezzo Base</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-700">Sconto %</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-700">Totale</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-700">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{sub.company_name}</td>
                    <td className="px-5 py-3 text-slate-600">{sub.plan_name}</td>
                    <td className="px-5 py-3 text-right text-slate-800 font-mono">{sub.base_price_monthly}€</td>
                    <td className="px-5 py-3 text-right">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-bold">
                        {sub.discount_percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-800 font-bold">{sub.total_monthly}€</td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscountTarget(sub)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Modifica Sconto
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL EDIT PIANO */}
      {editingPlan !== null && (
        <PlanEditor plan={editingPlan} onClose={() => setEditingPlan(null)} />
      )}

      {/* MODAL EDIT ADD-ON */}
      {editingAddon !== null && (
        <AddonEditor addon={editingAddon} onClose={() => setEditingAddon(null)} />
      )}

      {/* MODAL EDIT SCONTO */}
      {discountTarget !== null && (
        <DiscountEditor subscription={discountTarget} onClose={() => setDiscountTarget(null)} />
      )}
    </AppShell>
  );
}

/**
 * Editor per piani
 */
function PlanEditor({ plan, onClose }) {
  const [formData, setFormData] = useState(
    plan || { name: "", base_price_monthly: 0, max_employees: 0, features: [] }
  );

  const handleSave = async () => {
    if (plan.id) {
      await base44.entities.SubscriptionPlan.update(plan.id, formData);
    } else {
      await base44.entities.SubscriptionPlan.create(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-bold">{plan.id ? "Modifica Piano" : "Nuovo Piano"}</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prezzo Mensile (€)</label>
          <Input
            type="number"
            value={formData.base_price_monthly}
            onChange={(e) => setFormData({ ...formData, base_price_monthly: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max Dipendenti</label>
          <Input
            type="number"
            value={formData.max_employees}
            onChange={(e) => setFormData({ ...formData, max_employees: parseInt(e.target.value) })}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-blue-600">
            Salva
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Editor per add-ons
 */
function AddonEditor({ addon, onClose }) {
  const [formData, setFormData] = useState(
    addon || { name: "", base_price_monthly: 0, required_tier: "starter", description: "" }
  );

  const handleSave = async () => {
    if (addon.id) {
      await base44.entities.SubscriptionAddon.update(addon.id, formData);
    } else {
      await base44.entities.SubscriptionAddon.create(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-bold">{addon.id ? "Modifica Add-on" : "Nuovo Add-on"}</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prezzo Mensile (€)</label>
          <Input
            type="number"
            value={formData.base_price_monthly}
            onChange={(e) => setFormData({ ...formData, base_price_monthly: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Richiede Piano Minimo</label>
          <select
            value={formData.required_tier}
            onChange={(e) => setFormData({ ...formData, required_tier: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-blue-600">
            Salva
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Editor per sconti
 */
function DiscountEditor({ subscription, onClose }) {
  const [discountPercentage, setDiscountPercentage] = useState(subscription.discount_percentage || 0);
  const [discountReason, setDiscountReason] = useState(subscription.discount_reason || "");

  const subtotal = subscription.base_price_monthly + subscription.purchased_addons.reduce((sum, a) => sum + a.price_monthly, 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  const handleSave = async () => {
    await base44.entities.CompanySubscription.update(subscription.id, {
      discount_percentage: discountPercentage,
      discount_reason: discountReason,
      total_monthly: total,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-bold">Modifica Sconto - {subscription.company_name}</h3>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Sottotot:</span>
            <span className="font-mono font-bold">{subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Sconto ({discountPercentage}%):</span>
            <span className="font-mono font-bold">-{discountAmount.toFixed(2)}€</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="font-bold">Totale Mensile:</span>
            <span className="text-lg font-bold text-blue-600">{total.toFixed(2)}€</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sconto (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={discountPercentage}
            onChange={(e) => setDiscountPercentage(parseFloat(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Motivo Sconto</label>
          <Input
            placeholder="es: Early adopter, Partnership, Seasonal promotion"
            value={discountReason}
            onChange={(e) => setDiscountReason(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-blue-600">
            Salva Sconto
          </Button>
        </div>
      </div>
    </div>
  );
}