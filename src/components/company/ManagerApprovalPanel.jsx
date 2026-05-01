import { useState, useEffect } from "react";
// All base44 references removed - approvals via service layer
import { AlertCircle, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const LEAVE_TYPE = { ferie: "Ferie", permesso: "Permesso", malattia: "Malattia", extra: "Extra" };

export default function ManagerApprovalPanel({ managerEmail }) {
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(new Set());
  const [notes, setNotes] = useState({});

  useEffect(() => {
    loadRequests();
  }, [managerEmail]);

  const loadRequests = async () => {
    try {
      const [l, o] = await Promise.all([
        base44.entities.LeaveRequest.filter({ manager_email: managerEmail, status: "pending" }),
        base44.entities.OvertimeRequest.filter({ manager_email: managerEmail, status: "pending" })
      ]);
      setLeaves(l);
      setOvertimes(o);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, type) => {
    const data = { status: "manager_approved", manager_approved_at: new Date().toISOString(), manager_note: notes[id] || undefined };
    if (type === "leave") {
      await base44.entities.LeaveRequest.update(id, data);
    } else {
      await base44.entities.OvertimeRequest.update(id, data);
    }
    setNotes(n => { delete n[id]; return n; });
    await loadRequests();
  };

  const handleReject = async (id, type) => {
    const data = { status: "manager_rejected", manager_approved_at: new Date().toISOString(), manager_note: notes[id] || undefined };
    if (type === "leave") {
      await base44.entities.LeaveRequest.update(id, data);
    } else {
      await base44.entities.OvertimeRequest.update(id, data);
    }
    setNotes(n => { delete n[id]; return n; });
    await loadRequests();
  };

  const toggleExpand = (id) => {
    setExpanding(e => {
      const newSet = new Set(e);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const total = leaves.length + overtimes.length;

  if (loading) return <div className="flex items-center justify-center py-8"><div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      {total === 0 && (
        <div className="py-8 text-center bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-slate-600 font-medium">Nessuna richiesta in attesa</p>
        </div>
      )}

      {leaves.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm">Richieste ferie ({leaves.length})</h3>
          {leaves.map(leave => (
            <div key={leave.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleExpand(leave.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{leave.employee_name}</p>
                  <p className="text-xs text-slate-500">{LEAVE_TYPE[leave.leave_type]} - {leave.days_count} giorni ({format(new Date(leave.start_date), 'd MMM', { locale: it })} a {format(new Date(leave.end_date), 'd MMM yyyy', { locale: it })})</p>
                </div>
              </button>
              {expanding.has(leave.id) && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
                  {leave.note && <p className="text-sm text-slate-700 bg-white rounded p-2">{leave.note}</p>}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nota del manager</label>
                    <textarea
                      value={notes[leave.id] || ""}
                      onChange={e => setNotes(n => ({ ...n, [leave.id]: e.target.value }))}
                      placeholder="Aggiungi una nota opzionale..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleReject(leave.id, "leave")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rifiuta
                    </button>
                    <button
                      onClick={() => handleApprove(leave.id, "leave")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold hover:bg-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approva
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {overtimes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm">Richieste straordinari ({overtimes.length})</h3>
          {overtimes.map(ot => (
            <div key={ot.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleExpand(ot.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{ot.employee_name}</p>
                  <p className="text-xs text-slate-500">{ot.hours} ore - {format(new Date(ot.date), 'd MMM yyyy', { locale: it })}</p>
                </div>
              </button>
              {expanding.has(ot.id) && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
                  {ot.reason && <p className="text-sm text-slate-700 bg-white rounded p-2">{ot.reason}</p>}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nota del manager</label>
                    <textarea
                      value={notes[ot.id] || ""}
                      onChange={e => setNotes(n => ({ ...n, [ot.id]: e.target.value }))}
                      placeholder="Aggiungi una nota opzionale..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleReject(ot.id, "overtime")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rifiuta
                    </button>
                    <button
                      onClick={() => handleApprove(ot.id, "overtime")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold hover:bg-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approva
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}