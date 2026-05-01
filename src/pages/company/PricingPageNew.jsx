/**
 * Pricing Page per Clienti
 * ────────────────────────
 * Mostra piani base + add-ons selezionabili.
 * ✅ Mostra solo add-ons disponibili per il piano scelto
 * ✅ Calcolo prezzo in real-time
 * ✅ Checkout con Stripe
 */

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function PricingPageNew() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [allAddons, setAllAddons] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const [plansData, addonsData] = await Promise.all([
        base44.entities.SubscriptionPlan.filter({ is_active: true }),
        base44.entities.SubscriptionAddon.filter({ is_active: true }),
      ]);
      setPlans(plansData.sort((a, b) => a.base_price_monthly - b.base_price_monthly));
      setAllAddons(addonsData);
      if (plansData.length > 0) setSelectedPlan(plansData[0]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="blue" />;

  // Filtra add-ons validi per il piano selezionato
  const validAddons = selectedPlan
    ? allAddons.filter((a) => {
        const tierRanking = { starter: 1, professional: 2, enterprise: 3 };
        return tierRanking[selectedPlan.plan_tier || selectedPlan.tier] >= tierRanking[a.required_tier];
      })
    : [];

  // Calcola prezzo totale
  const addonsPrice = selectedAddons.reduce((sum, addonId) => {
    const addon = allAddons.find((a) => a.id === addonId);
    return sum + (addon?.base_price_monthly || 0);
  }, 0);
  const totalMonthly = (selectedPlan?.base_price_monthly || 0) + addonsPrice;

  const handleCheckout = async () => {
    // Reindirizza a checkout page con parametri
    const params = new URLSearchParams({
      plan_id: selectedPlan.id,
      addons: selectedAddons.join(","),
    });
    window.location.href = `/dashboard/company/checkout?${params}`;
  };

  return (
    <AppShell user={user}>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Scegli il Tuo Piano</h1>
          <p className="text-lg text-slate-600">Tutto quello che ti serve per gestire il tuo team</p>
        </div>

        {/* PIANI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => {
                setSelectedPlan(plan);
                setSelectedAddons([]);
              }}
              className={`rounded-xl border-2 transition-all cursor-pointer ${
                selectedPlan?.id === plan.id
                  ? "border-blue-600 bg-blue-50 shadow-lg"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="p-8">
                {plan.popular && (
                  <div className="mb-4 inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    POPOLARE
                  </div>
                )}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-slate-900">{plan.base_price_monthly}€</span>
                  <span className="text-slate-600 ml-2">/mese</span>
                </div>
                <p className="text-sm text-slate-600 mb-6">Fino a {plan.max_employees} dipendenti</p>

                <div className="space-y-3 mb-8">
                  {(plan.features || []).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setSelectedAddons([]);
                  }}
                  className={`w-full ${selectedPlan?.id === plan.id ? "bg-blue-600" : "bg-slate-200 text-slate-800"}`}
                >
                  {selectedPlan?.id === plan.id ? "✓ Selezionato" : "Seleziona"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* ADD-ONS */}
        {validAddons.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Aggiungi Feature Avanzate</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validAddons.map((addon) => (
                <div
                  key={addon.id}
                  onClick={() => {
                    if (selectedAddons.includes(addon.id)) {
                      setSelectedAddons(selectedAddons.filter((id) => id !== addon.id));
                    } else {
                      setSelectedAddons([...selectedAddons, addon.id]);
                    }
                  }}
                  className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    selectedAddons.includes(addon.id)
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{addon.name}</h4>
                      <p className="text-sm text-slate-600 mt-1">{addon.description}</p>
                      <div className="mt-3 space-y-1">
                        {(addon.features || []).slice(0, 2).map((f, idx) => (
                          <p key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                            <Check className="w-3 h-3 text-green-600" /> {f}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{addon.base_price_monthly}€</p>
                      <p className="text-xs text-slate-500">/mese</p>
                      <div className={`w-6 h-6 rounded border-2 mt-3 flex items-center justify-center ${
                        selectedAddons.includes(addon.id)
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300"
                      }`}>
                        {selectedAddons.includes(addon.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RIEPILOGO PREZZO */}
        <div className="max-w-md ml-auto space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Piano {selectedPlan?.name}</span>
              <span className="font-mono font-bold">{(selectedPlan?.base_price_monthly || 0).toFixed(2)}€</span>
            </div>
            {selectedAddons.length > 0 && (
              <>
                {selectedAddons.map((addonId) => {
                  const addon = allAddons.find((a) => a.id === addonId);
                  return (
                    <div key={addonId} className="flex justify-between text-sm">
                      <span className="text-slate-600">{addon?.name}</span>
                      <span className="font-mono font-bold">{addon?.base_price_monthly.toFixed(2)}€</span>
                    </div>
                  );
                })}
                <div className="border-t border-slate-200 pt-3" />
              </>
            )}
            <div className="flex justify-between text-lg">
              <span className="font-bold text-slate-900">Totale Mensile</span>
              <span className="text-3xl font-bold text-blue-600">{totalMonthly.toFixed(2)}€</span>
            </div>
          </div>

          <Button onClick={handleCheckout} className="w-full bg-blue-600 text-white py-3 text-lg font-bold rounded-xl">
            Procedi al Checkout →
          </Button>

          <p className="text-xs text-center text-slate-500">
            Primo mese a prezzo pieno. Cancella quando vuoi, senza impegno.
          </p>
        </div>
      </div>
    </AppShell>
  );
}