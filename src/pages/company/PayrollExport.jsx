import { useState, useEffect } from "react";
import { authService } from '@/services/authService';
import companyService from '@/services/companies.service';
import employeeService from '@/services/employees.service';
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Download, FileText, Calendar, Users, Loader } from "lucide-react";
import { toast } from "sonner";

export default function PayrollExport() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrollFiles, setPayrollFiles] = useState([]);
  
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    employee: "all",
  });
  
  const [format, setFormat] = useState("csv"); // csv or pdf
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const init = async () => {
      const me = await authService.me();
      setUser(me);
      if (me?.company_id) {
        const comp = await companyService.filter({ id: me.company_id });
        const emps = await employeeService.filter({ company_id: me.company_id });
        // TODO: Replace with payroll service
        if (comp[0]) setCompany(comp[0]);
        setEmployees(emps);
        setPayrollFiles([]);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleExport = async () => {
    // TODO: Replace with service or API endpoint
    setGenerating(false);
  };

  if (loading) return <PageLoader />;

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  const filteredPayrolls = payrollFiles.filter(p => {
    const match = (filters.month === 0 || p.month === filters.month) &&
                  (filters.year === 0 || p.year === filters.year) &&
                  (filters.employee === "all" || p.employee_id === filters.employee);
    return match;
  });

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Esportazione Payroll</h1>
          <p className="text-slate-600">Genera riepiloghi payroll in CSV/PDF per il consulente del lavoro</p>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Filtri</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mese */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mese</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Anno */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Anno</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Dipendente */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Dipendente</label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti i dipendenti</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Formato */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Formato</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={generating}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Esporta {format.toUpperCase()}
              </>
            )}
          </button>
        </div>

        {/* File Payroll Disponibili */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">File Payroll Disponibili</h2>
          
          {filteredPayrolls.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nessun file payroll disponibile per i filtri selezionati</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Dipendente</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Periodo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">File</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Caricato</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayrolls.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{p.employee_email}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {monthNames[p.month - 1]} {p.year}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.file_name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(p.uploaded_at).toLocaleDateString("it-IT")}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={p.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Scarica
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Puoi generare riepiloghi payroll consolidati filtrando per mese e dipendente. 
            I file CSV sono ideali per l'importazione in software contabili, mentre i PDF sono pronti per la stampa e la firma.
          </p>
        </div>
      </div>
    </AppShell>
  );
}