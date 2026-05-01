import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Loader2, BarChart3, User, Building2, X } from "lucide-react";

const REPORT_TYPES = [
  {
    id: "company_hr",
    label: "Report HR Aziendale",
    desc: "Dipendenti, presenze, ferie, straordinari e grafici riassuntivi",
    icon: Building2,
    color: "blue",
    role: "company",
  },
  {
    id: "employee_personal",
    label: "Report Personale",
    desc: "Storico presenze, ferie, straordinari e attività del dipendente",
    icon: User,
    color: "green",
    role: "employee",
  },
];

export default function ReportGenerator({ companyId, employeeId, userRole = "employee", onClose }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableReports = REPORT_TYPES.filter(r =>
    userRole === "company" || userRole === "super_admin" || r.role === "employee"
  );

  const handleGenerate = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const payload = {
        report_type: selected,
        company_id: companyId,
        employee_id: employeeId,
      };

      const response = await fetch(`/api/functions/generateReport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore durante la generazione");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PulseHR_Report_${selected}_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Genera Report PDF
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Seleziona il tipo di report da esportare
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Report type selection */}
      <div className="space-y-3 mb-6">
        {availableReports.map((report) => {
          const Icon = report.icon;
          const isSelected = selected === report.id;
          return (
            <button
              key={report.id}
              onClick={() => setSelected(report.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? report.color === "blue"
                    ? "border-blue-500 bg-blue-50"
                    : "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? report.color === "blue" ? "bg-blue-100" : "bg-emerald-100"
                    : "bg-slate-100"
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isSelected
                      ? report.color === "blue" ? "text-blue-600" : "text-emerald-600"
                      : "text-slate-400"
                  }`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${isSelected ? "text-slate-800" : "text-slate-700"}`}>
                    {report.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{report.desc}</p>
                </div>
                {isSelected && (
                  <div className={`ml-auto w-5 h-5 rounded-full flex items-center justify-center ${
                    report.color === "blue" ? "bg-blue-500" : "bg-emerald-500"
                  }`}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Report includes */}
      {selected && (
        <div className="bg-slate-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-slate-600 mb-2">Il report includerà:</p>
          <ul className="space-y-1">
            {selected === "company_hr" ? [
              "KPI principali (dipendenti, ferie, straordinari)",
              "Grafico dipendenti per reparto",
              "Distribuzione tipologie ferie",
              "Elenco completo dipendenti",
            ] : [
              "Scheda personale completa",
              "KPI attività (ferie, presenze, straordinari)",
              "Grafico presenze mensili ultimi 6 mesi",
              "Storico ferie e straordinari",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!selected || loading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generazione in corso...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Scarica PDF
          </>
        )}
      </button>
    </div>
  );
}