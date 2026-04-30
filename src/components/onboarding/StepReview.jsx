import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function StepReview({ employee, onboarding, onComplete }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleComplete = () => {
    if (confirmed) {
      onComplete({
        step_4_review_completed: true
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 4: Revisione Finale</h2>
        <p className="text-slate-600">Verifica che tutto sia completato prima di inviare</p>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {[
          { done: onboarding?.step_1_profile_completed, label: "Profilo completato" },
          { done: onboarding?.step_2_contract_signed, label: "Contratto firmato" },
          { done: onboarding?.step_3_documents_uploaded, label: "Documenti caricati" }
        ].map((item, idx) => (
          <div key={idx} className={`flex items-center gap-3 p-4 rounded-lg border ${item.done ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${item.done ? "text-emerald-600" : "text-slate-400"}`} />
            <span className={item.done ? "text-emerald-700 font-semibold" : "text-slate-600"}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Alert */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Pronto per inviare</p>
          <p className="text-sm text-blue-800 mt-1">Dopo l'invio, i tuoi dati saranno sottoposti a revisione dall'ufficio HR</p>
        </div>
      </div>

      {/* Riepilogo */}
      <div className="bg-slate-50 rounded-lg p-6 space-y-3 border border-slate-200">
        <h3 className="font-semibold text-slate-900">Riepilogo Dati</h3>
        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex justify-between"><span>Nome:</span> <span className="font-semibold">{employee?.first_name} {employee?.last_name}</span></div>
          <div className="flex justify-between"><span>Email:</span> <span className="font-semibold">{employee?.email}</span></div>
          <div className="flex justify-between"><span>Posizione:</span> <span className="font-semibold">{employee?.job_title || "N/A"}</span></div>
          <div className="flex justify-between"><span>Data Inizio:</span> <span className="font-semibold">{new Date().toLocaleDateString("it-IT")}</span></div>
        </div>
      </div>

      <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          className="w-5 h-5 text-blue-600 rounded mt-0.5 cursor-pointer"
        />
        <span className="text-sm text-slate-700">
          Confermo che tutti i dati sono corretti e sono pronto ad inviare per la revisione HR
        </span>
      </label>

      <button
        onClick={handleComplete}
        disabled={!confirmed}
        className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ✓ Invia per Revisione HR
      </button>
    </div>
  );
}