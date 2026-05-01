import { useState, useEffect } from "react";
import { authService } from '@/services/authService';
import companyService from '@/services/companies.service';
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import ExpenseApprovalPanel from "@/components/company/ExpenseApprovalPanel";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const EXPENSE_TYPES = {
  travel: "Trasporto/Viaggio",
  meals: "Pasti",
  accommodation: "Alloggio",
  supplies: "Materiali/Forniture",
  other: "Altro"
};

export default function ExpenseManagement() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }

      const [companies, allExpenses] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.ExpenseReimbursement.filter({ company_id: me.company_id })
      ]);

      setCompany(companies[0]);
      setExpenses(allExpenses);
    }).finally(() => setLoading(false));
  }, []);

  const filterByMonth = (month) => {
    return expenses.filter(exp => exp.created_date?.startsWith(month));
  };

  const monthExpenses = filterByMonth(selectedMonth);
  const totalAmount = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const approvedAmount = monthExpenses
    .filter(e => ["approved", "paid"].includes(e.status))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleExportReport = () => {
    const csv = [
      ["Data", "Dipendente", "Email", "Categoria", "Descrizione", "Importo (€)", "Stato"],
      ...monthExpenses.map(e => [
        format(new Date(e.expense_date), "dd/MM/yyyy", { locale: it }),
        e.employee_name,
        e.employee_email,
        EXPENSE_TYPES[e.expense_type] || e.expense_type,
        e.description,
        e.amount.toFixed(2),
        e.status
      ])
    ];

    const csvContent = csv.map(row => row.map(col => `"${col}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rimborsi_spese_${selectedMonth}.csv`;
    link.click();
  };

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestione Rimborsi Spese</h1>
            <p className="text-sm text-slate-500">{company?.name}</p>
          </div>
        </div>

        {/* Filtro Mese */}
        <div className="flex items-center gap-4">
          <label className="block text-sm font-semibold text-slate-700">Mese:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Richieste Mese</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{monthExpenses.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Importo Totale</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">€ {totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Approvato</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">€ {approvedAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Pannelli Approvazione */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <ExpenseApprovalPanel
              companyId={company?.id}
              userRole={user.role}
              userEmail={user.email}
            />
          </div>

          {/* Report Mensile */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Report {selectedMonth}</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {monthExpenses.length === 0 ? (
                <p className="text-slate-400 text-sm">Nessuna spesa per questo mese</p>
              ) : (
                monthExpenses.map(exp => (
                  <div key={exp.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{exp.employee_name}</p>
                        <p className="text-xs text-slate-600">{EXPENSE_TYPES[exp.expense_type]}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-800">€ {exp.amount.toFixed(2)}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                          exp.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          exp.status === "submitted" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {exp.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}