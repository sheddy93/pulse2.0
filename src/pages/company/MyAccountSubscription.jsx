import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Calendar, CreditCard, Package, AlertCircle, RefreshCw, Loader } from "lucide-react";
import { format, formatDistance } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function MyAccountSubscription() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [trial, setTrial] = useState(null);
  const [plan, setPlan] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      if (me.company_id) {
        const [comp, subs, trials] = await Promise.all([
          // TODO: Replace with service.Company.filter({ id: me.company_id }),
          // TODO: Replace with service.CompanySubscription.filter({ company_email: me.email }),
          // TODO: Replace with service.TrialSubscription.filter({ company_email: me.email || me.company_id })
        ]);

        if (comp[0]) setCompany(comp[0]);
        if (subs[0]) {
          setSubscription(subs[0]);
          // TODO: Replace with service.SubscriptionPlan.filter() call
          // setPlan(plans[0]);
          // Carica cronologia pagamenti
          await loadPaymentHistory(subs[0].stripe_customer_id);
        }
        if (trials[0]) setTrial(trials[0]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const loadPaymentHistory = async (customerId) => {
    setLoadingPayments(true);
    try {
      const response = await base44.functions.invoke("stripePaymentHistory", {
        customer_id: customerId
      });
      if (response.data.invoices) {
        setPaymentHistory(response.data.invoices);
      }
    } catch (error) {
      console.error("Error loading payment history:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleUpgradePlan = () => {
    navigate("/dashboard/company/subscription");
  };

  const handleUpdateAddons = () => {
    if (subscription) {
      navigate(`/dashboard/company/checkout?plan=${subscription.plan_id}&interval=${subscription.billing_interval}&edit=true`);
    }
  };

  if (loading) return <PageLoader />;

  const isTrialing = trial && trial.status === "active";
  const isSubscribed = subscription && subscription.status === "active";
  const trialDaysLeft = trial ? Math.ceil((new Date(trial.trial_end) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  const totalMonthlyPrice = subscription ? subscription.amount + (subscription.selected_addons?.reduce((sum, addon) => sum + (addon.total_price || 0), 0) || 0) : 0;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestione Abbonamento</h1>
          <p className="text-slate-600">Visualizza e gestisci il tuo abbonamento</p>
        </div>

        {/* Status Banner */}
        {isTrialing && trialDaysLeft <= 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Il tuo trial scade tra {trialDaysLeft} giorni</p>
              <p className="text-sm text-amber-700 mt-1">Seleziona un piano di pagamento prima della scadenza per continuare</p>
              <button
                onClick={handleUpgradePlan}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700"
              >
                Scegli un piano
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Piano Attuale */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Piano Attuale</h2>
            </div>

            {plan ? (
              <>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Nome Piano</p>
                  <p className="text-2xl font-bold text-slate-900">{plan.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Prezzo Base</p>
                    <p className="text-xl font-bold text-slate-900">
                      €{subscription.amount}
                      <span className="text-sm text-slate-500 font-normal">
                        /{subscription.billing_interval === "yearly" ? "anno" : "mese"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Max Dipendenti</p>
                    <p className="text-lg font-bold text-slate-900">{plan.max_employees}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Include</p>
                  <ul className="space-y-2">
                    {(plan.features || []).slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-blue-600 mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleUpgradePlan}
                  className="w-full px-4 py-2 border border-blue-300 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Cambia piano
                </button>
              </>
            ) : isTrialing ? (
              <div className="py-6 text-center">
                <p className="text-slate-600 mb-4">Stai usando il trial gratuito</p>
                <button
                  onClick={handleUpgradePlan}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Scegli un piano
                </button>
              </div>
            ) : (
              <p className="text-slate-600 text-center py-6">Nessun abbonamento attivo</p>
            )}
          </div>

          {/* Riepilogo Costi */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Costo Mensile</h2>
            </div>

            {subscription && (
              <>
                <div className="space-y-2 pb-4 border-b border-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-700">{plan?.name}</span>
                    <span className="font-semibold text-slate-900">€{subscription.amount}</span>
                  </div>
                  {subscription.selected_addons?.map(addon => (
                    <div key={addon.addon_id} className="flex justify-between text-sm">
                      <span className="text-slate-600">{addon.addon_name} × {addon.quantity}</span>
                      <span className="font-medium text-slate-900">€{addon.total_price}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-slate-900">Totale</span>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-900">€{totalMonthlyPrice}</p>
                    <p className="text-xs text-slate-600">/mese</p>
                  </div>
                </div>

                <button
                  onClick={handleUpdateAddons}
                  className="w-full px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-white transition-colors"
                >
                  Modifica add-ons
                </button>
              </>
            )}

            {isTrialing && (
              <div className="pt-4 border-t border-slate-300">
                <p className="text-xs text-slate-600 mb-2">Scadenza trial</p>
                <p className="text-lg font-bold text-slate-900">
                  {format(new Date(trial.trial_end), "d MMMM yyyy", { locale: it })}
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  Tra {trialDaysLeft} giorn{trialDaysLeft !== 1 ? "i" : "o"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add-ons Selezionati */}
        {subscription?.selected_addons && subscription.selected_addons.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add-ons Selezionati</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscription.selected_addons.map(addon => (
                <div key={addon.addon_id} className="p-4 border border-slate-200 rounded-lg">
                  <p className="font-semibold text-slate-900">{addon.addon_name}</p>
                  <p className="text-sm text-slate-600 mt-1">Quantità: {addon.quantity}</p>
                  <p className="text-sm font-medium text-blue-600 mt-2">
                    €{addon.total_price}/mese
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Periodo di Fatturazione */}
        {subscription && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Periodo di Fatturazione
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Dal</p>
                <p className="text-lg font-semibold text-slate-900">
                  {format(new Date(subscription.current_period_start), "d MMM yyyy", { locale: it })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Al</p>
                <p className="text-lg font-semibold text-slate-900">
                  {format(new Date(subscription.current_period_end), "d MMM yyyy", { locale: it })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Rinnovo tra</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatDistance(new Date(), new Date(subscription.current_period_end), { locale: it })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cronologia Pagamenti */}
        {paymentHistory.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Cronologia Pagamenti
              </h2>
              {loadingPayments && <Loader className="w-4 h-4 animate-spin text-slate-400" />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Data</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Importo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Stato</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Periodo</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(invoice => (
                    <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {format(new Date(invoice.created * 1000), "d MMM yyyy", { locale: it })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        €{(invoice.total / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          invoice.status === 'open' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {invoice.status === 'paid' ? 'Pagato' : invoice.status === 'open' ? 'In sospeso' : invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {format(new Date(invoice.period_start * 1000), "d MMM", { locale: it })} - {format(new Date(invoice.period_end * 1000), "d MMM yyyy", { locale: it })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}