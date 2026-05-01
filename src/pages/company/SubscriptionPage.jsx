import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { CreditCard, Check, Star, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const COLOR_BORDERS = {
  blue: "border-blue-400 ring-blue-400",
  violet: "border-violet-400 ring-violet-400",
  emerald: "border-emerald-400 ring-emerald-400",
  orange: "border-orange-400 ring-orange-400",
  red: "border-red-400 ring-red-400",
  slate: "border-slate-400 ring-slate-400",
};

const COLOR_BG = {
  blue: "bg-blue-600 hover:bg-blue-700",
  violet: "bg-violet-600 hover:bg-violet-700",
  emerald: "bg-emerald-600 hover:bg-emerald-700",
  orange: "bg-orange-600 hover:bg-orange-700",
  red: "bg-red-600 hover:bg-red-700",
  slate: "bg-slate-600 hover:bg-slate-700",
};

const STATUS_LABELS = {
  active: { label: "Attivo", cls: "bg-emerald-100 text-emerald-700" },
  trialing: { label: "Trial", cls: "bg-blue-100 text-blue-700" },
  past_due: { label: "Pagamento scaduto", cls: "bg-orange-100 text-orange-700" },
  canceled: { label: "Cancellato", cls: "bg-red-100 text-red-600" },
  unpaid: { label: "Non pagato", cls: "bg-red-100 text-red-600" },
};

export default function SubscriptionPage() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const [p, companies] = await Promise.all([
        base44.entities.SubscriptionPlan.filter({ is_active: true }),
        base44.entities.Company.filter({ owner_email: me.email })
      ]);
      setPlans([...p].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      if (companies[0]) {
        const subs = await base44.entities.CompanySubscription.filter({ company_id: companies[0].id });
        setCurrentSub(subs[0] || null);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (plan) => {
    // Check if inside iframe
    if (window.self !== window.top) {
      toast.error("Il checkout funziona solo dall'app pubblicata, non dall'anteprima.");
      return;
    }
    setCheckingOut(plan.id);
    try {
      const res = await base44.functions.invoke("stripeCheckout", { plan_id: plan.id });
      if (res.data?.error) throw new Error(res.data.error);
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e) {
      toast.error(e.message);
    }
    setCheckingOut(null);
  };

  const handlePortal = async () => {
    if (window.self !== window.top) {
      toast.error("Il portale funziona solo dall'app pubblicata.");
      return;
    }
    setOpeningPortal(true);
    try {
      const res = await base44.functions.invoke("stripeManagePlan", { action: "portal" });
      if (res.data?.error) throw new Error(res.data.error);
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e) {
      toast.error(e.message);
    }
    setOpeningPortal(false);
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Abbonamento</h1>
          <p className="text-slate-500 mt-1">Scegli il piano più adatto alla tua azienda</p>
        </div>

        {/* Current subscription */}
        {currentSub && (
          <div className={`rounded-xl border-2 p-5 ${currentSub.status === 'active' || currentSub.status === 'trialing' ? 'border-emerald-300 bg-emerald-50' : 'border-orange-300 bg-orange-50'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Abbonamento corrente: {currentSub.plan_name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABELS[currentSub.status]?.cls || ""}`}>
                    {STATUS_LABELS[currentSub.status]?.label || currentSub.status}
                  </span>
                </div>
                {currentSub.current_period_end && (
                  <p className="text-sm text-slate-600 mt-1">
                    {currentSub.cancel_at_period_end ? "⚠️ Cancella il " : "Rinnovo il "}
                    <strong>{new Date(currentSub.current_period_end).toLocaleDateString("it-IT")}</strong>
                  </p>
                )}
                {currentSub.amount > 0 && (
                  <p className="text-sm text-slate-600">€{currentSub.amount}/mese</p>
                )}
              </div>
              <button onClick={handlePortal} disabled={openingPortal}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
                <ExternalLink className="w-4 h-4" />
                {openingPortal ? "Apertura..." : "Gestisci abbonamento"}
              </button>
            </div>
          </div>
        )}

        {/* Warning if in iframe */}
        {window.self !== window.top && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">Il checkout Stripe è disponibile solo dall'app pubblicata, non dall'anteprima dell'editor.</p>
          </div>
        )}

        {/* Plans */}
        {plans.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nessun piano disponibile</p>
            <p className="text-sm text-slate-400 mt-1">I piani verranno configurati dall'amministratore</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${plans.length === 1 ? "max-w-sm" : plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {plans.map(plan => {
              const isCurrentPlan = currentSub?.plan_id === plan.id && (currentSub?.status === 'active' || currentSub?.status === 'trialing');
              return (
                <div key={plan.id}
                  className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col gap-4 transition-all ${
                    plan.is_popular
                      ? `${COLOR_BORDERS[plan.color] || COLOR_BORDERS.blue} ring-2 shadow-lg`
                      : "border-slate-200 hover:border-slate-300"
                  } ${isCurrentPlan ? "ring-2 ring-emerald-400" : ""}`}>
                  {plan.is_popular && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 ${COLOR_BG[plan.color] || COLOR_BG.blue} text-white text-xs font-bold rounded-full shadow`}>
                      <Star className="w-3 h-3" /> Più popolare
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow">
                      <Check className="w-3 h-3" /> Piano attuale
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {plan.description && <p className="text-sm text-slate-500 mt-1">{plan.description}</p>}
                    {plan.max_employees > 0 && <p className="text-xs text-slate-400 mt-0.5">Fino a {plan.max_employees} dipendenti</p>}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">€{plan.price_monthly}</span>
                    <span className="text-slate-500 text-sm">/mese</span>
                  </div>
                  <ul className="flex-1 space-y-2.5">
                    {(plan.features || []).map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={checkingOut !== null || isCurrentPlan}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isCurrentPlan
                        ? "bg-emerald-100 text-emerald-700 cursor-default"
                        : `${COLOR_BG[plan.color] || COLOR_BG.blue} text-white`
                    }`}>
                    {checkingOut === plan.id ? "Reindirizzamento..." : isCurrentPlan ? "Piano attuale" : "Abbonati ora"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}