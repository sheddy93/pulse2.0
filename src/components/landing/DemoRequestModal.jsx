/**
 * DemoRequestModal.jsx
 * --------------------
 * Modal per richiedere una demo o avviare il trial.
 * Crea un record TrialSubscription e invia email di conferma.
 */
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DemoRequestModal({ onClose }) {
  const [step, setStep] = useState('form'); // form, loading, success
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    employees_count: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('loading');

    try {
      // Crea trial record
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const trial = await base44.entities.TrialSubscription.create({
        ...formData,
        trial_start: new Date().toISOString(),
        trial_end: trialEnd.toISOString(),
        status: 'active',
        signup_source: 'demo_request'
      });

      // Invia email di conferma
      await base44.integrations.Core.SendEmail({
        to: formData.contact_email,
        subject: '✅ Trial PulseHR attivato - 14 giorni gratuiti',
        body: `Ciao ${formData.contact_name},\n\nAbbiamo attivato il tuo trial! 🚀\n\nAccedi qui: https://app.pulsehr.io\nEmail: ${formData.contact_email}\n\nIl tuo trial scade il ${trialEnd.toLocaleDateString('it-IT')}.\n\nDomande? Contattaci: support@pulsehr.io`
      });

      setStep('success');
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      toast.error('Errore: ' + err.message);
      setStep('form');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {step === 'form' && (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Avvia il tuo trial gratuito</h2>
            <p className="text-slate-600 mb-6">14 giorni gratis. Nessuna carta di credito richiesta.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Azienda</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Acme SRL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="mario@acme.it"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+39 333 1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dipendenti</label>
                <input
                  type="number"
                  value={formData.employees_count}
                  onChange={(e) => setFormData({ ...formData, employees_count: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. 50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Attiva trial gratuito
              </button>

              <p className="text-xs text-slate-500 text-center">
                Non ti faremo pagare nulla nei prossimi 14 giorni.
              </p>
            </form>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600">Sto attivando il tuo trial...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Trial attivato! 🎉</h3>
            <p className="text-slate-600 text-center mb-4">
              Controlla la tua email per accedere all'app.
            </p>
            <p className="text-sm text-slate-500 text-center">
              Chiuderò questa finestra tra pochi secondi...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}