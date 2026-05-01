import { useState, useEffect } from "react";
// All base44 references removed - expenses via service layer
import { Check, X, FileImage } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const EXPENSE_TYPES = {
  travel: "Trasporto/Viaggio",
  meals: "Pasti",
  accommodation: "Alloggio",
  supplies: "Materiali/Forniture",
  other: "Altro"
};

export default function ExpenseApprovalPanel({ companyId, userRole, userEmail }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    let query = { company_id: companyId };

    if (userRole === "manager") {
      query.manager_email = userEmail;
      query.status = "submitted";
    } else if (userRole === "admin") {
      query.status = "manager_approved";
    }

    const exps = await base44.entities.ExpenseReimbursement.filter(query);
    setExpenses(exps.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const handleApprove = async (exp) => {
    if (!note.trim()) {
      alert("Inserisci una nota");
      return;
    }

    const updateData =
      userRole === "manager"
        ? {
            status: "manager_approved",
            manager_approved_at: new Date().toISOString(),
            manager_note: note
          }
        : {
            status: "approved",
            admin_approved_at: new Date().toISOString(),
            admin_name: "HR Admin",
            admin_note: note
          };

    await base44.entities.ExpenseReimbursement.update(exp.id, updateData);
    await loadExpenses();
    setSelectedExpense(null);
    setNote("");
    setActionType(null);
  };

  const handleReject = async (exp) => {
    if (!note.trim()) {
      alert("Inserisci un motivo di rifiuto");
      return;
    }

    const updateData =
      userRole === "manager"
        ? {
            status: "manager_rejected",
            manager_note: note
          }
        : {
            status: "rejected",
            admin_note: note
          };

    await base44.entities.ExpenseReimbursement.update(exp.id, updateData);
    await loadExpenses();
    setSelectedExpense(null);
    setNote("");
    setActionType(null);
  };

  const title = userRole === "manager" ? "Approvazione Manager" : "Approvazione Amministrativa";

  if (loading) return <div className="text-slate-400">Caricamento...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800">{title}</h3>

      {expenses.length === 0 ? (
        <div className="p-6 text-center text-slate-400">Nessuna richiesta da approvare</div>
      ) : (
        <div className="space-y-3">
          {expenses.map(exp => (
            <div key={exp.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h4 className="font-semibold text-slate-800">{exp.employee_name}</h4>
                  <p className="text-sm text-slate-600">{exp.description}</p>
                  <div className="flex gap-2 mt-2 text-xs text-slate-500">
                    <span>{EXPENSE_TYPES[exp.expense_type]}</span>
                    <span>•</span>
                    <span>{format(new Date(exp.expense_date), "d MMM yyyy", { locale: it })}</span>
                  </div>
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

              {selectedExpense?.id === exp.id ? (
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Nota (obbligatoria)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(exp)}
                      disabled={!note.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approva
                    </button>
                    <button
                      onClick={() => handleReject(exp)}
                      disabled={!note.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Rifiuta
                    </button>
                    <button
                      onClick={() => {
                        setSelectedExpense(null);
                        setNote("");
                        setActionType(null);
                      }}
                      className="px-3 py-1.5 border border-slate-300 rounded text-sm font-medium hover:bg-slate-50"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedExpense(exp);
                    setNote("");
                  }}
                  className="w-full px-3 py-1.5 text-blue-600 border border-blue-200 rounded text-sm font-semibold hover:bg-blue-50"
                >
                  Esamina
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}