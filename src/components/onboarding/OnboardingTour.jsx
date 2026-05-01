import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronRight, ChevronLeft, Clock, CalendarDays, FileText, Bell, CheckCircle2 } from "lucide-react";

const TOUR_KEY = "pulsehr_employee_tour_done";

const STEPS = [
  {
    icon: "👋",
    title: "Benvenuto in PulseHR!",
    description: "Questo breve tour ti guiderà nelle funzionalità principali della piattaforma. Ci vorranno meno di 2 minuti.",
    action: null,
  },
  {
    icon: <Clock className="w-8 h-8 text-emerald-500" />,
    title: "Prima timbratura",
    description: "Per registrare la tua presenza, vai su \"Timbratura\" nella barra laterale. Premi il pulsante \"Entrata\" per iniziare la giornata lavorativa e \"Uscita\" quando termini.",
    highlight: "attendance",
    action: { label: "Vai alla timbratura", path: "/dashboard/employee/attendance" },
  },
  {
    icon: <CalendarDays className="w-8 h-8 text-blue-500" />,
    title: "Ferie & Permessi",
    description: "Hai bisogno di richiedere un giorno di ferie? Vai su \"Ferie & Permessi\" per inviare una richiesta. Potrai seguire lo stato di approvazione in tempo reale.",
    action: { label: "Richiedi ferie", path: "/dashboard/employee/leave" },
  },
  {
    icon: <FileText className="w-8 h-8 text-violet-500" />,
    title: "I tuoi documenti",
    description: "Nella sezione \"Miei Documenti\" trovi buste paga, contratti e altri file condivisi dall'azienda. Puoi visualizzarli e scaricarli in qualsiasi momento.",
    action: { label: "Vedi documenti", path: "/dashboard/employee/documents" },
  },
  {
    icon: <Bell className="w-8 h-8 text-orange-500" />,
    title: "Notifiche",
    description: "Usa la campanella in alto a destra per vedere le notifiche in tempo reale. Puoi personalizzare quali notifiche ricevere nelle \"Preferenze Notifiche\".",
    action: { label: "Preferenze notifiche", path: "/dashboard/employee/notification-settings" },
  },
  {
    icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
    title: "Tutto pronto!",
    description: "Hai completato il tour. Ora sei pronto per usare PulseHR al massimo. Puoi rivedere questo tour in qualsiasi momento dal tuo profilo.",
    action: null,
  },
];

export default function OnboardingTour({ onClose }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleClose = () => {
    localStorage.setItem(TOUR_KEY, "true");
    onClose?.();
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleNavigate = () => {
    if (current.action?.path) {
      handleClose();
      navigate(current.action.path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Passo {step + 1} di {STEPS.length}
          </span>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-slate-50 rounded-2xl text-4xl">
            {typeof current.icon === "string" ? current.icon : current.icon}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{current.title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed">{current.description}</p>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 py-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${
                  i === step ? "w-5 h-2 bg-emerald-500" : "w-2 h-2 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            {current.action && (
              <button
                onClick={handleNavigate}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                {current.action.label} →
              </button>
            )}

            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Indietro
                </button>
              )}
              <button
                onClick={handleNext}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  isFirst || !current.action
                    ? "flex-1 bg-slate-800 hover:bg-slate-700 text-white"
                    : "flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                {isLast ? "Fine" : "Avanti"} {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {!isLast && (
              <button
                onClick={handleClose}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                Salta il tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to check if tour should be shown
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("pulsehr_employee_tour_done");
    if (!done) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetTour = () => {
    localStorage.removeItem("pulsehr_employee_tour_done");
    setShowTour(true);
  };

  return { showTour, setShowTour, resetTour };
}