import { useState } from "react";
import { FileText, CheckCircle2 } from "lucide-react";

export default function StepContract({ employee, onboarding, onComplete }) {
  const [signed, setSigned] = useState(onboarding?.step_2_contract_signed || false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const handleSign = () => {
    if (agreedTerms) {
      onComplete({
        step_2_contract_signed: true,
        step_2_contract_url: `contracts/${employee.id}_${Date.now()}.pdf`,
        step_2_signed_at: new Date().toISOString()
      });
      setSigned(true);
    }
  };

  if (signed) {
    return (
      <div className="space-y-6 text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Contratto Firmato ✓</h2>
          <p className="text-slate-600">Il tuo contratto è stato firmato con successo</p>
        </div>
        <button
          onClick={() => {
            setSigned(false);
            onComplete({});
          }}
          className="mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continua al Prossimo Step →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 2: Firma Contratto</h2>
        <p className="text-slate-600">Leggi e firma il tuo contratto di lavoro</p>
      </div>

      {/* Anteprima Contratto */}
      <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-8 space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-slate-700">Contratto di Lavoro</span>
        </div>

        <div className="max-h-48 overflow-y-auto bg-white p-6 rounded border border-slate-200 text-sm text-slate-600 space-y-3">
          <p>
            <strong>CONTRATTO DI ASSUNZIONE</strong><br/>
            Dipendente: {employee?.first_name} {employee?.last_name}<br/>
            Posizione: {employee?.job_title || "N/A"}<br/>
            Data Inizio: {new Date().toLocaleDateString("it-IT")}<br/>
          </p>
          <p>
            Questo contratto di lavoro è stipulato tra la Società e il sopra nominato dipendente.
            Il dipendente accetta le seguenti condizioni di lavoro come specificato nel presente contratto.
          </p>
          <p>
            Il dipendente si impegna a svolgere le mansioni assegnate con diligenza e professionalità,
            rispettando le politiche aziendali e le norme vigenti.
          </p>
          <p className="font-semibold">
            Per la versione completa del contratto, contattare l'ufficio risorse umane.
          </p>
        </div>

        <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={e => setAgreedTerms(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded mt-0.5 cursor-pointer"
          />
          <span className="text-sm text-slate-700">
            Confermo di aver letto il contratto e accetto i termini e le condizioni di lavoro
          </span>
        </label>
      </div>

      <button
        onClick={handleSign}
        disabled={!agreedTerms}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ✓ Firma Contratto Digitalmente
      </button>
    </div>
  );
}