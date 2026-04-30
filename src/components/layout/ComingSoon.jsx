import { Link } from "react-router-dom";
import { Clock, ArrowLeft } from "lucide-react";

export default function ComingSoon({ title = "Funzionalità in arrivo", dashboardPath = "/" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-blue-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 mb-6 max-w-sm">
        Questa sezione è in fase di sviluppo. Sarà disponibile a breve.
      </p>
      <Link
        to={dashboardPath}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Torna alla dashboard
      </Link>
    </div>
  );
}