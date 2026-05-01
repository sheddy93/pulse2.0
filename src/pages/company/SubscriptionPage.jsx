import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Check, CreditCard, Zap, Star, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const COLOR_MAP = {
  blue: "border-blue-500 bg-blue-600",
  violet: "border-violet-500 bg-violet-600",
  emerald: "border-emerald-500 bg-emerald-600",
  orange: "border-orange-500 bg-orange-600",
  red: "border-red-500 bg-red-600",
  slate: "border-slate-500 bg-slate-600",
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState("monthly");

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const [p, subs] = await Promise.all([
        base44.entities.SubscriptionPlan.filter({ is_active: true }),
        base44.entities.CompanySubscription.filter({ company_email: me.email }),
      ]);
      setPlans(p.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setCurrentSub(subs[0] || null);
    }).finally(() => setLoading(false));
  }, []);

  const handleCheckout = (plan) => {
    navigate(`/dashboard/company/checkout?plan=${plan.id}&interval=${billing}`);
  };

  if (loading) return <PageLoader color="blue" />;

  const STATUS_BADGE = {
    active: "bg-emerald-100 text-emerald-700",
    trialing: "bg-blue-100 text-blue-700",
    past_due: "bg-red-100 text-red-700",
    canceled: "bg-slate-100 text-slate-600",
  };

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Abbonamento</h1>
          <p className="text-sm text-slate-500">Scegli il piano più adatto alla tua azienda</p>
        </div>

        {/* Current subscription */}
        {currentSub && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-slate-800">Piano attuale: {currentSub.plan_name}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[currentSub.status] || "bg-slate-100 text-slate-600"}`}>
                  {currentSub.status}
                </span>
              </div>
              {currentSub.current_period_end && (
                <p className="text-sm text-slate-500 mt-1">
                  Rinnovo: {format(new Date(currentSub.current_period_end), "d MMMM yyyy", { locale: it })} · €{currentSub.amount}/{currentSub.billing_interval === "monthly" ? "mese" : "anno"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === "monthly" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
              Mensile
            </button>
            <button onClick={() => setBilling("yearly")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === "yearly" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
              Annuale <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">-20%</span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        {plans.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nessun piano disponibile al momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const isCurrentPlan = currentSub?.plan_id === plan.id && currentSub?.status === "active";
              const price = billing === "monthly" ? plan.price_monthly : (plan.price_yearly || plan.price_monthly * 12 * 0.8);
              const colors = COLOR_MAP[plan.color] || COLOR_MAP.blue;
              const btnBg = colors.split(" ")[1];

              return (
                <div key={plan.id} className={`relative bg-white rounded-2xl border-2 flex flex-col overflow-hidden transition-all hover:shadow-lg ${plan.is_popular ? colors.split(" ")[0] : "border-slate-200"}`}>
                  {plan.is_popular && (
                    <div className={`flex items-center justify-center gap-1.5 py-2 text-white text-xs font-bold ${btnBg}`}>
                      <Star className="w-3.5 h-3.5" /> PIANO PIÙ POPOLARE
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                    {plan.description && <p className="text-sm text-slate-500 mt-1">{plan.description}</p>}
                    
                    <div className="mt-4 mb-2">
                      <span className="text-4xl font-bold text-slate-900">€{price}</span>
                      <span className="text-slate-400 text-sm">/{billing === "monthly" ? "mese" : "anno"}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-5">Fino a {plan.max_employees} dipendenti</p>

                    <ul className="space-y-2.5 flex-1 mb-6">
                      {(plan.features || []).map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-semibold text-sm border border-emerald-200">
                        <Check className="w-4 h-4" /> Piano Attivo
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCheckout(plan)}
                        className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 ${btnBg}`}
                      >
                        <Zap className="w-4 h-4" />
                        Inizia ora
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}