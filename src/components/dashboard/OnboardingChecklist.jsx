import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react";

export default function OnboardingChecklist({ stats, onDismiss }) {
  const steps = [
    {
      id: "employees",
      label: "Aggiungi il primo lavoratore",
      done: stats.employees > 0,
      link: "/dashboard/company/employees/new",
      desc: "Crea il profilo del tuo primo dipendente",
    },
    {
      id: "admin",
      label: "Crea un admin aziendale",
      done: stats.hasAdmin,
      link: "/dashboard/company/admins/new",
      desc: "Delega la gestione ad un HR manager o admin",
    },
    {
      id: "consultant",
      label: "Collega un consulente",
      done: stats.hasConsultant,
      link: "/dashboard/company/consultants",
      desc: "Associa il tuo consulente del lavoro",
    },
    {
      id: "documents",
      label: "Carica i primi documenti",
      done: stats.documents > 0,
      link: "/dashboard/company/documents",
      desc: "Contratti, buste paga e certificati",
    },
    {
      id: "settings",
      label: "Completa le impostazioni azienda",
      done: stats.settingsComplete,
      link: "/dashboard/company/settings",
      desc: "Partita IVA, indirizzo, telefono",
    },
  ];

  const completed = steps.filter(s => s.done).length;
  const allDone = completed === steps.length;

  if (allDone) return null;

  return (
    <div className="bg-white rounded-xl border border-blue-200 p-5 relative">
      <button onClick={onDismiss} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center justify-between mb-4 pr-6">
        <div>
          <h2 className="font-bold text-slate-800">Inizia con PulseHR</h2>
          <p className="text-sm text-slate-500">{completed} di {steps.length} completati</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} />
          </div>
          <span className="text-xs font-bold text-blue-700">{Math.round((completed / steps.length) * 100)}%</span>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map(step => (
          <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${step.done ? "bg-emerald-50" : "bg-slate-50 hover:bg-blue-50"}`}>
            {step.done
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              : <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
            }
            <div className="flex-1">
              <p className={`text-sm font-semibold ${step.done ? "text-emerald-700 line-through" : "text-slate-800"}`}>{step.label}</p>
              {!step.done && <p className="text-xs text-slate-500">{step.desc}</p>}
            </div>
            {!step.done && (
              <Link to={step.link} className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline flex-shrink-0">
                Vai <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}