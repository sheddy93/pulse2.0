import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { it } from "date-fns/locale";

const TYPE_LABELS = {
  ferie: "Ferie",
  permesso: "Permesso",
  malattia: "Malattia",
  extra: "Straordinario"
};

export default function ManagerLeaveApprovalPanel({ managerEmail, companyId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const reqs = await base44.entities.LeaveRequest.filter({
      company_id: companyId,
      manager_email: managerEmail,
      status: "pending"
    });
    setRequests(reqs.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)));
    setLoading(false);
  };

  const handleApprove = async (req) => {
    await base44.entities.LeaveRequest.update(req.id, {
      status: "manager_approved",
      manager_approved_at: new Date().toISOString(),
      manager_note: note
    });
    await loadRequests();
    setSelectedRequest(null);
    setNote("");
  };

  const handleReject = async (req) => {
    await base44.entities.LeaveRequest.update(req.id, {
      status: "manager_rejected",
      manager_note: note
    });
    await loadRequests();
    setSelectedRequest(null);
    setNote("");
  };

  if (loading) return <div className="text-slate-400 text-sm">Caricamento...</div>;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800">Richieste Ferie in Sospeso ({requests.length})</h3>

      {requests.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-sm bg-slate-50 rounded-lg">
          Nessuna richiesta in attesa
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {requests.map(req => (
            <div key={req.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{req.employee_name}</p>
                  <p className="text-xs text-slate-600">
                    {format(new Date(req.start_date), "d MMM", { locale: it })} → {format(new Date(req.end_date), "d MMM yyyy", { locale: it })}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold">{TYPE_LABELS[req.leave_type]}</span> • {req.days_count} giorni
                  </p>
                </div>
              </div>

              {selectedRequest?.id === req.id ? (
                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Nota approvazione..."
                    rows={2}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                    >
                      <Check className="w-3 h-3" /> Approva
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                    >
                      <X className="w-3 h-3" /> Rifiuta
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setNote("");
                      }}
                      className="px-2 py-1 border border-slate-300 rounded text-xs font-medium hover:bg-slate-100"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedRequest(req);
                    setNote("");
                  }}
                  className="w-full px-2 py-1 text-blue-600 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-50"
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