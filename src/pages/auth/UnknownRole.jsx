import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";

export default function UnknownRole() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-orange-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Ruolo non riconosciuto</h1>
        <p className="text-slate-500 text-sm mb-6">
          Il tuo account non ha un ruolo valido. Contatta l'amministratore della piattaforma per ricevere accesso.
        </p>
        <button
          onClick={() => base44.auth.logout("/")}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Torna al login
        </button>
      </div>
    </div>
  );
}