import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Download, BarChart3, Calendar, Users, Loader, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ReportGenerator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [generating, setGenerating] = useState(false);

  const [filters, setFilters] = useState({
    reportType: "payroll", // payroll, activities, both
    format: "pdf", // pdf, excel
    startDate: "",
    endDate: "",
    employees: "all", // all, single
    selectedEmployee: "",
    includeAttendance: true,
    includeOvertime: true,
    includeLeave: true,
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const [comp, emps] = await Promise.all([
          base44.entities.Company.filter({ id: me.company_id }),
          base44.entities.EmployeeProfile.filter({ company_id: me.company_id, is_deleted: false })
        ]);
        if (comp[0]) setCompany(comp[0]);
        setEmployees(emps);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleGenerateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error("Seleziona periodo inizio e fine");
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      toast.error("Data inizio deve essere prima di data fine");
      return;
    }

    setGenerating(true);
    try {
      const functionName = filters.format === "pdf" ? "generateReportPDF" : "generateReportExcel";
      const response = await base44.functions.invoke(functionName, {
        company_id: company.id,
        start_date: filters.startDate,
        end_date: filters.endDate,
        report_type: filters.reportType,
        employee_id: filters.employees === "single" ? filters.selectedEmployee : null,
        include_attendance: filters.includeAttendance,
        include_overtime: filters.includeOvertime,
        include_leave: filters.includeLeave,
      });

      if (response.data.file_url || response.data.data) {
        const link = document.createElement("a");
        link.href = response.data.file_url || response.data.data;
        link.download = `report_${filters.reportType}_${new Date().getTime()}.${filters.format === "pdf" ? "pdf" : "xlsx"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Report ${filters.format.toUpperCase()} generato e scaricato`);
      }
    } catch (error) {
      toast.error(error.message || "Errore durante la generazione del report");
      console.error("Report error:", error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Generatore Report</h1>
          <p className="text-slate-600">Genera report in PDF o Excel con dati payroll e attività dipendenti</p>
        </div>

        {/* Configurazione Report */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Configurazione Report</h2>

          {/* Tipo Report */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Tipo di Report</label>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { value: "payroll", label: "Solo Payroll", desc: "Dati stipendiali e buste paga" },
                { value: "activities", label: "Solo Attività", desc: "Presenze, straordinari, ferie" },
                { value: "both", label: "Completo", desc: "Payroll + Attività" }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters({ ...filters, reportType: option.value })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    filters.reportType === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-600 mt-1">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Formato di Export</label>
            <div className="flex gap-4">
              {[
                { value: "pdf", label: "📄 PDF" },
                { value: "excel", label: "📊 Excel" }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters({ ...filters, format: option.value })}
                  className={`px-6 py-3 rounded-lg border-2 font-semibold transition-all ${
                    filters.format === option.value
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Periodo */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data Inizio</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data Fine</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Dipendenti */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Dipendenti</label>
            <div className="flex gap-4 mb-4">
              {[
                { value: "all", label: "Tutti i dipendenti" },
                { value: "single", label: "Dipendente singolo" }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters({ ...filters, employees: option.value })}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    filters.employees === option.value
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filters.employees === "single" && (
              <select
                value={filters.selectedEmployee}
                onChange={(e) => setFilters({ ...filters, selectedEmployee: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona dipendente...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Opzioni Aggiuntive */}
          {filters.reportType !== "payroll" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Dati da Includere</label>
              <div className="space-y-3">
                {[
                  { key: "includeAttendance", label: "Presenze" },
                  { key: "includeOvertime", label: "Straordinari" },
                  { key: "includeLeave", label: "Ferie e Permessi" }
                ].map(option => (
                  <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters[option.key]}
                      onChange={(e) => setFilters({ ...filters, [option.key]: e.target.checked })}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Pulsante Download */}
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Genera e Scarica Report {filters.format.toUpperCase()}
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <p className="text-sm text-blue-900 font-semibold">📋 Informazioni Report:</p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4">
            <li>• I report PDF sono ottimali per stampa e condivisione</li>
            <li>• I report Excel permettono analisi e modifiche successive</li>
            <li>• I dati sono filtrati in base al periodo e ai dipendenti selezionati</li>
            <li>• Puoi generare report combinati con payroll e attività</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}