import { useState, useEffect } from "react";
// All base44 references removed - overtime approvals via service layer
import { Clock, Check, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_BADGE = {
  pending: { label: "In attesa", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approvato", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rifiutato", cls: "bg-red-100 text-red-700" },
};

export default function OvertimeApprovalPanel({ companyId, employees }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [noteForm, setNoteForm] = useState({ id: null, notes: "" });

  useEffect(() => {
    if (!companyId) return;
    loadRequests();
  }, [companyId]);

  const loadRequests = async () => {
    const reqs = await base44.entities.OvertimeRequest.filter({ company_id: companyId });
    setRequests([...reqs].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setLoading(false);
  };

  const handleApprove = async (req) => {
    await base44.entities.OvertimeRequest.update(req.id, {
      status: "approved",
      reviewed_by: (await base44.auth.me()).email,
      reviewed_at: new Date().toISOString(),
      admin_notes: noteForm.id === req.id ? noteForm.notes : undefined,
    });
    setNoteForm({ id: null, notes: "" });
    setExpandedId(null);
    await loadRequests();
  };

  const handleReject = async (req) => {
    await base44.entities.OvertimeRequest.update(req.id, {
      status: "rejected",
      reviewed_by: (await base44.auth.me()).email,
      reviewed_at: new Date().toISOString(),
      admin_notes: noteForm.id === req.id ? noteForm.notes : undefined,
    });
    setNoteForm({ id: null, notes: "" });
    setExpandedId(null);
    await loadRequests();
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pending = requests.filter(r => r.status === "pending").length;
  const approved = requests.filter(r => r.status === "approved").length;
  const approvedHours = requests.filter(r => r.status === "approved").reduce((sum, r) => sum + (r.hours || 0), 0);

  if (loading) return <div className="p-4 text-center text-slate-400">Caricamento...</div>;

  return (
    <div className="space-y-4">
      {/* Statistiche */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
          <p className="text-xs text-amber-700 mt-1">In attesa</p>
        </div>
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{approved}</p>
          <p className="text-xs text-emerald-700 mt-1">Approvate</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{approvedHours}</p>
          <p className="text-xs text-blue-700 mt-1">Ore approvate</p>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex gap-2 flex-wrap">
        {[["all", "Tutte"], ["pending", "In attesa"], ["approved", "Approvate"], ["rejected", "Rifiutate"]].map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === k ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Lista richieste */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nessuna richiesta per questo filtro</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(req => {
              const emp = employees.find(e => e.id === req.employee_id);
              const isExpanded = expandedId === req.id;
              const isEditing = noteForm.id === req.id;
              return (
                <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <button onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-slate-800">{emp ? `${emp.first_name} ${emp.last_name}` : "Dipendente sconosciuto"}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[req.status]?.cls}`}>{STATUS_BADGE[req.status]?.label}</span>
                        </div>
                        <p className="text-sm text-slate-600">{format(new Date(req.date), "d MMMM yyyy", { locale: it })} • <strong>{req.hours}h</strong></p>
                        {req.reason && <p className="text-xs text-slate-500 mt-1 truncate">{req.reason}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {req.status === "pending" && (
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleApprove(req); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReject(req); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Email dipendente</p>
                        <p className="text-sm text-slate-700">{req.employee_email}</p>
                      </div>
                      {req.reason && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Motivo</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{req.reason}</p>
                        </div>
                      )}
                      {req.reviewed_at && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Revisione</p>
                          <p className="text-sm text-slate-700">{format(new Date(req.reviewed_at), "d MMM yyyy HH:mm", { locale: it })} da {req.reviewed_by}</p>
                        </div>
                      )}
                      {req.admin_notes && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Note</p>
                          <p className="text-sm text-slate-700">{req.admin_notes}</p>
                        </div>
                      )}
                      {req.status === "pending" && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Aggiungi note</p>
                          {!isEditing ? (
                            <button onClick={() => setNoteForm({ id: req.id, notes: "" })} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                              Aggiungi nota
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <textarea value={noteForm.notes} onChange={e => setNoteForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                placeholder="Nota per il dipendente..."
                                className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                              <div className="flex gap-2">
                                <button onClick={() => setNoteForm({ id: null, notes: "" })} className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded">
                                  Annulla
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}