/**
 * StripeCheckoutSuccess.jsx
 * =========================
 * Componente di fallback per gestire il return da Stripe Checkout
 * 
 * Visualizzato quando Stripe reindirizza dopo pagamento
 * Mostra:
 * - Status del pagamento (success/cancelled)
 * - Session ID per tracking
 * - Opzioni prossimi step (back, download invoice, ecc)
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StripeCheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');
  const statusParam = searchParams.get('status');

  useEffect(() => {
    const verifyCheckout = async () => {
      try {
        // Verifica lo stato della sessione di checkout
        if (statusParam === 'success' && sessionId) {
          console.log('[Checkout] Verifying success:', { sessionId, statusParam });
          
          // Recupera la sottoscrizione appena creata
          const user = await base44.auth.me();
          if (user?.company_id) {
            const subs = await base44.entities.CompanySubscription.filter({
              company_id: user.company_id,
              status: 'active',
            });
            
            if (subs.length > 0) {
              setSubscription(subs[0]);
              
              // Salva session_id per audit
              localStorage.setItem('last_successful_session_id', sessionId);
              localStorage.setItem('last_checkout_time', new Date().toISOString());
              
              setStatus('success');
            }
          }
        } else if (statusParam === 'cancelled') {
          console.log('[Checkout] Cancelled by user');
          setStatus('cancelled');
        }
      } catch (err) {
        console.error('[Checkout] Verification error:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    verifyCheckout();
  }, [sessionId, statusParam]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
          <p className="text-slate-600 font-medium">Verifica del pagamento in corso...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Pagamento Effettuato</h1>
            <p className="text-slate-600">
              {subscription?.plan_name && (
                <>Benvenuto nel piano <strong>{subscription.plan_name}</strong></>
              )}
            </p>
          </div>

          {sessionId && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Session ID</p>
              <p className="text-xs font-mono text-slate-700 break-all">{sessionId}</p>
              <p className="text-xs text-slate-500">
                (Salvato nel registro di audit per il tracking)
              </p>
            </div>
          )}

          {subscription && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">Dettagli Abbonamento</p>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Piano: <strong>{subscription.plan_name}</strong></p>
                {subscription.current_period_end && (
                  <p>
                    Rinnovo: <strong>
                      {new Date(subscription.current_period_end).toLocaleDateString('it-IT')}
                    </strong>
                  </p>
                )}
                {subscription.amount && (
                  <p>
                    Importo: <strong>€{subscription.amount}/{subscription.billing_interval}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <button
              onClick={() => navigate('/dashboard/company')}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Vai al Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard/company/subscription')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Gestisci Abbonamento
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Riceverai una conferma via email. I tuoi dati sono stati salvati in sicurezza.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Pagamento Annullato</h1>
            <p className="text-slate-600">Non è stato effettuato alcun addebito</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Puoi riprovare il checkout in qualsiasi momento o contattare il nostro supporto se hai domande.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => navigate('/dashboard/company/subscription')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Torna ai Piani
            </button>
            <button
              onClick={() => navigate('/dashboard/company')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Errore di Verifica</h1>
            <p className="text-slate-600">{error || 'Impossibile verificare lo stato del pagamento'}</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Se il pagamento è stato effettuato, contatta il supporto e fornisci l'ID della sessione: <strong>{sessionId}</strong>
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard/company/subscription')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Torna ai Piani
          </button>
        </div>
      </div>
    );
  }

  return null;
}