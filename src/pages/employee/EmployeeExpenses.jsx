import { useState, useEffect } from "react";
// Migration: removed base44 dependency
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, X, FileImage, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const EXPENSE_TYPES = {
  travel: "Trasporto/Viaggio",
  meals: "Pasti",
  accommodation: "Alloggio",
  supplies: "Materiali/Forniture",
  other: "Altro"
};

const STATUS_BADGE = {
  draft: { label: "Bozza", cls: "bg-slate-100 text-slate-700" },
  submitted: { label: "Inviato", cls: "bg-blue-100 text-blue-700" },
  manager_approved: { label: "Manager: Approvato", cls: "bg-emerald-100 text-emerald-700" },
  manager_rejected: { label: "Manager: Rifiutato", cls: "bg-red-100 text-red-700" },
  approved: { label: "Approvato", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rifiutato", cls: "bg-red-100 text-red-700" },
  paid: { label: "Pagato", cls: "bg-emerald-50 text-emerald-800" }
};

export default function EmployeeExpenses() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [form, setForm] = useState({
    expense_date: "",
    expense_type: "other",
    description: "",
    amount: "",
    receipt_url: null,
    receipt_notes: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
    const me = await authService.me();
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0];
      setEmployee(emp);

      if (emp) {
        const exps = await base44.entities.ExpenseReimbursement.filter({ employee_id: emp.id });
        setExpenses(exps.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        setReceiptPreview(reader.result);
        const mockUrl = `data:${file.type};base64,mock_receipt_${Date.now()}`;
        setForm(f => ({ ...f, receipt_url: mockUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee || !form.receipt_url) return;

    setSaving(true);
    const newExpense = {
      company_id: employee.company_id,
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      employee_email: user.email,
      manager_email: employee.manager,
      ...form,
      amount: parseFloat(form.amount),
      status: "draft"
    };

    await base44.entities.ExpenseReimbursement.create(newExpense);
    const updated = await base44.entities.ExpenseReimbursement.filter({ employee_id: employee.id });
    setExpenses(updated.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));

    setShowForm(false);
    setForm({ expense_date: "", expense_type: "other", description: "", amount: "", receipt_url: null, receipt_notes: "" });
    setReceiptPreview(null);
    setSaving(false);
  };

  const handleSubmitExpense = async (id) => {
    await base44.entities.ExpenseReimbursement.update(id, { status: "submitted" });
    const updated = await base44.entities.ExpenseReimbursement.filter({ employee_id: employee.id });
    setExpenses(updated.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  };

  const handleDelete = async (id) => {
    if (confirm("Elimina questa richiesta?")) {
      await base44.entities.ExpenseReimbursement.delete(id);
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  if (loading) return <PageLoader color="green" />;

  const totalPending = expenses
    .filter(e => ["draft", "submitted", "manager_approved"].includes(e.status))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Le Mie Spese</h1>
            <p className="text-sm text-slate-500">Gestisci richieste di rimborso</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> Nuova Spesa
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">In Sospeso</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">€ {totalPending.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Richieste</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{expenses.length}</p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Nuova Richiesta di Rimborso</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data Spesa *</label>
                <input
                  type="date"
                  required
                  value={form.expense_date}
                  onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria *</label>
                <select
                  value={form.expense_type}
                  onChange={e => setForm(f => ({ ...f, expense_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(EXPENSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrizione *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Es. Cena riunione clienti..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Importo (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Scontrino *</label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-emerald-300 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                  <FileImage className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-600">Upload foto</span>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                </label>
              </div>

              {receiptPreview && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Anteprima Scontrino</p>
                  <img src={receiptPreview} alt="Scontrino" className="max-h-32 rounded-lg border border-slate-200" />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note (opzionale)</label>
                <textarea
                  value={form.receipt_notes}
                  onChange={e => setForm(f => ({ ...f, receipt_notes: e.target.value }))}
                  rows={1}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Note aggiuntive..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Salvataggio..." : "Salva Bozza"}
              </button>
            </div>
          </form>
        )}

        {/* Lista Spese */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Le Tue Richieste</h2>
          </div>

          {expenses.length === 0 ? (
            <div className="py-12 text-center">
              <FileImage className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessuna richiesta di rimborso</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expenses.map(exp => {
                const badge = STATUS_BADGE[exp.status];
                return (
                  <div key={exp.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-800">{EXPENSE_TYPES[exp.expense_type]}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{exp.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(exp.expense_date), "d MMM yyyy", { locale: it })}
                        </p>
                        {exp.manager_note && <p className="text-xs text-blue-600 mt-1 font-medium">💬 {exp.manager_note}</p>}
                        {exp.admin_note && <p className="text-xs text-emerald-600 mt-1 font-medium">✓ {exp.admin_note}</p>}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-slate-800">€ {exp.amount.toFixed(2)}</p>
                        {exp.receipt_url && (
                          <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 mt-2 block font-medium">
                            📎 Scontrino
                          </a>
                        )}
                      </div>
                    </div>

                    {exp.status === "draft" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleSubmitExpense(exp.id)}
                          className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors"
                        >
                          Invia per Approvazione
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}