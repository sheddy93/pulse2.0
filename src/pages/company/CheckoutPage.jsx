import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [allAddons, setAllAddons] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const planId = searchParams.get("plan");
  const billingInterval = searchParams.get("interval") || "monthly";

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      
      // Carica il piano selezionato
      if (planId) {
        const plans = await base44.entities.SubscriptionPlan.filter({ id: planId });
        if (plans[0]) setPlan(plans[0]);
      }

      // Carica tutti gli add-ons
      const addons = await base44.entities.SubscriptionAddon.filter({ is_active: true });
      setAllAddons(addons.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    }).finally(() => setLoading(false));
  }, [planId]);

  // Calcola prezzo totale
  const basePrice = billingInterval === "yearly" ? (plan?.price_yearly || 0) : (plan?.price_monthly || 0);
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + (addon.total_price || 0), 0);
  const totalPrice = basePrice + addonsTotal;

  // Gestisce selezione add-ons
  const toggleAddon = (addon, quantity) => {
    if (quantity === 0) {
      setSelectedAddons(selectedAddons.filter(a => a.addon_id !== addon.id));
    } else {
      const existing = selectedAddons.find(a => a.addon_id === addon.id);
      const totalPrice = quantity * addon.base_price;
      if (existing) {
        setSelectedAddons(selectedAddons.map(a => 
          a.addon_id === addon.id 
            ? { ...a, quantity, total_price: totalPrice }
            : a
        ));
      } else {
        setSelectedAddons([
          ...selectedAddons,
          {
            addon_id: addon.id,
            addon_name: addon.name,
            quantity,
            unit_price: addon.base_price,
            total_price: totalPrice
          }
        ]);
      }
    }
  };

  const handleCheckout = async () => {
    if (!plan) return;
    
    // Verifica se siamo in un iframe
    if (window.self !== window.top) {
      toast.error("Il checkout è disponibile solo dall'app pubblicata");
      return;
    }

    setProcessing(true);
    try {
      const priceId = billingInterval === "yearly" ? plan.stripe_price_yearly_id : plan.stripe_price_monthly_id;
      
      if (!priceId) {
        toast.error("Piano non configurato correttamente in Stripe");
        setProcessing(false);
        return;
      }

      const response = await base44.functions.invoke("stripeCheckout", {
        price_id: priceId,
        plan_id: plan.id,
        plan_name: plan.name,
        billing_interval: billingInterval,
        selected_addons: selectedAddons,
        company_id: user?.company_id
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error("Errore nella creazione della sessione di checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Errore durante il checkout");
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!plan) {
    return (
      <AppShell user={user}>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-slate-700">Piano non trovato</span>
          </div>
          <button
            onClick={() => navigate("/dashboard/company/subscription")}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Torna ai piani
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/dashboard/company/subscription")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Torna ai piani
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Piano selezionato */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h1>
              <p className="text-slate-600 mb-6">{plan.description}</p>

              <div className="mb-6 pb-6 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Piano base</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {billingInterval === "yearly" ? `€${plan.price_yearly}` : `€${plan.price_monthly}`}
                  </span>
                  <span className="text-slate-600">/{billingInterval === "yearly" ? "anno" : "mese"}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Max {plan.max_employees} dipendenti</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Include</p>
                <ul className="space-y-2">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Add-ons */}
            {allAddons.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Personalizza il tuo piano</h2>
                <div className="space-y-3">
                  {allAddons.map(addon => {
                    const selectedAddon = selectedAddons.find(a => a.addon_id === addon.id);
                    const quantity = selectedAddon?.quantity || 0;
                    
                    return (
                      <div key={addon.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">{addon.name}</p>
                            <p className="text-sm text-slate-600">{addon.description}</p>
                            <p className="text-sm font-medium text-blue-600 mt-1">
                              €{addon.base_price} {addon.unit_label}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleAddon(addon, Math.max(0, quantity - 1))}
                            className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={addon.max_quantity || 999}
                            value={quantity}
                            onChange={(e) => toggleAddon(addon, parseInt(e.target.value) || 0)}
                            className="w-16 px-3 py-1 border border-slate-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => toggleAddon(addon, quantity + 1)}
                            className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                          >
                            +
                          </button>
                          {quantity > 0 && (
                            <span className="ml-auto text-sm font-semibold text-slate-900">
                              €{selectedAddon.total_price}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Riepilogo ordine */}
          <div className="md:col-span-1">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 sticky top-6 space-y-4">
              <h3 className="font-bold text-slate-900">Riepilogo ordine</h3>

              <div className="space-y-2 pb-4 border-b border-slate-200">
                <div className="flex justify-between text-sm text-slate-700">
                  <span>{plan.name}</span>
                  <span className="font-medium">€{basePrice}</span>
                </div>
                {selectedAddons.map(addon => (
                  <div key={addon.addon_id} className="flex justify-between text-sm text-slate-700">
                    <span>{addon.addon_name} × {addon.quantity}</span>
                    <span className="font-medium">€{addon.total_price}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-slate-900">Totale</span>
                <div>
                  <span className="text-2xl font-bold text-slate-900">€{totalPrice}</span>
                  <span className="text-sm text-slate-600"> /{billingInterval === "yearly" ? "anno" : "mese"}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {processing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Elaborazione...
                  </>
                ) : (
                  "Procedi al pagamento"
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Potrai modificare o cancellare l'abbonamento in qualsiasi momento
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}