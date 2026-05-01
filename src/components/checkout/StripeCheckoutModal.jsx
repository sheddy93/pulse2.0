/**
 * StripeCheckoutModal.jsx
 * ======================
 * Modulo checkout Stripe inline nella SubscriptionPage
 * 
 * Features:
 * - Selezione piano + addons
 * - Preview prezzo finale
 * - Checkout con session tracking
 * - iframe detection per sicurezza
 * - Loading state e error handling
 */

import { useState } from 'react';
import { billingService } from '@/services/billingService';
import { X, CreditCard, Loader, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeCheckoutModal({ 
  plan, 
  isOpen, 
  onClose, 
  billingInterval = 'monthly',
  user 
}) {
  const [processing, setProcessing] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [allAddons, setAllAddons] = useState([]);
  const [showAddons, setShowAddons] = useState(false);

  if (!isOpen || !plan) return null;

  // Calcoli prezzo
  const basePrice = billingInterval === 'yearly' 
    ? (plan.price_yearly || plan.price_monthly * 12 * 0.8)
    : (plan.price_monthly || 0);
  
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + (addon.total_price || 0), 0);
  const totalPrice = basePrice + addonsTotal;
  const monthlyEquivalent = billingInterval === 'yearly' ? (totalPrice / 12).toFixed(2) : totalPrice;

  // Gestione addon
  const toggleAddon = (addon, quantity) => {
    if (quantity === 0) {
      setSelectedAddons(selectedAddons.filter(a => a.addon_id !== addon.id));
    } else {
      const addonTotal = quantity * addon.base_price;
      const existing = selectedAddons.find(a => a.addon_id === addon.id);
      
      if (existing) {
        setSelectedAddons(selectedAddons.map(a =>
          a.addon_id === addon.id
            ? { ...a, quantity, total_price: addonTotal }
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
            total_price: addonTotal,
          },
        ]);
      }
    }
  };

  // Checkout handler
  const handleCheckout = async () => {
    // Verifica iframe (sicurezza Stripe)
    if (window.self !== window.top) {
      toast.error('Il checkout è disponibile solo dall\'app pubblicata');
      return;
    }

    if (!plan.stripe_price_id) {
      toast.error('Piano non configurato correttamente in Stripe');
      return;
    }

    setProcessing(true);
    try {
      const sessionId = await billingService.createCheckoutSession(
        plan.id,
        selectedAddons,
        billingInterval,
        user
      );

      if (sessionId) {
        // Salva session_id in metadata per tracking
        localStorage.setItem('stripe_session_id', sessionId);
        localStorage.setItem('stripe_checkout_time', new Date().toISOString());
        
        console.log('[Stripe] Session created:', sessionId);
        
        // Redirect a Stripe Checkout via API
        const checkoutUrl = await billingService.getCheckoutUrl(sessionId);
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        }
      } else {
        toast.error('Errore nella creazione della sessione di checkout');
      }
    } catch (error) {
      console.error('[Stripe] Checkout error:', error);
      toast.error('Errore durante il checkout');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{plan.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Piano Base */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Piano Base</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-slate-900">€{basePrice}</span>
              <span className="text-slate-600">
                /{billingInterval === 'yearly' ? 'anno' : 'mese'}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Max {plan.max_employees} dipendenti
            </p>
            {billingInterval === 'yearly' && (
              <p className="text-xs text-emerald-600 font-medium mt-2">
                ≈ €{monthlyEquivalent}/mese
              </p>
            )}

            {/* Features */}
            <div className="mt-4 space-y-2">
              {(plan.features || []).slice(0, 4).map((feature, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  {feature}
                </div>
              ))}
              {(plan.features || []).length > 4 && (
                <p className="text-xs text-slate-500 ml-6">
                  +{(plan.features || []).length - 4} altre feature
                </p>
              )}
            </div>
          </div>

          {/* Aggiunte (Expandable) */}
          {plan.available_addons && plan.available_addons.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4">
              <button
                onClick={() => setShowAddons(!showAddons)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-900">
                    Personalizza il tuo piano
                  </span>
                </div>
                <span className="text-slate-400">
                  {showAddons ? '−' : '+'}
                </span>
              </button>

              {showAddons && (
                <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                  {plan.available_addons.map(addon => {
                    const selected = selectedAddons.find(a => a.addon_id === addon.id);
                    const qty = selected?.quantity || 0;

                    return (
                      <div key={addon.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{addon.name}</p>
                          <p className="text-xs text-slate-500">€{addon.base_price} {addon.unit_label}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAddon(addon, Math.max(0, qty - 1))}
                            className="px-2 py-1 border border-slate-300 rounded hover:bg-white"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={addon.max_quantity || 999}
                            value={qty}
                            onChange={(e) => toggleAddon(addon, parseInt(e.target.value) || 0)}
                            className="w-12 px-2 py-1 border border-slate-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => toggleAddon(addon, qty + 1)}
                            className="px-2 py-1 border border-slate-300 rounded hover:bg-white"
                          >
                            +
                          </button>
                          {qty > 0 && (
                            <span className="ml-3 text-sm font-semibold text-slate-900 min-w-12 text-right">
                              €{selected.total_price}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Riepilogo Prezzo */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-3">
            <div className="space-y-2">
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

            <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
              <span className="font-semibold text-slate-900">Totale</span>
              <div className="text-right">
                <span className="text-3xl font-bold text-slate-900">€{totalPrice}</span>
                <span className="text-sm text-slate-600">
                  /{billingInterval === 'yearly' ? 'anno' : 'mese'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Sicurezza */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Pagamento sicuro</p>
              <p className="text-xs mt-1">
                Elaborato da Stripe. La tua sessione di pagamento sarà tracciata per scopi di audit e compliance.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCheckout}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Elaborazione...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Procedi al pagamento
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Potrai modificare o cancellare l'abbonamento in qualsiasi momento
          </p>
        </div>
      </div>
    </div>
  );
}