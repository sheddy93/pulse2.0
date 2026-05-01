/**
 * PermissionRequestsPanel.jsx
 * ----------------------------
 * Panel modale per il titolare aziendale per gestire le richieste
 * di modifica permessi inviate dai consulenti.
 *
 * Props:
 *  - companyId (string): ID azienda — filtra le richieste pending
 *  - onClose   (fn):     callback chiusura panel
 *
 * Comportamento:
 *  - Carica tutte le PermissionChangeRequest con status "pending" per l'azienda
 *  - Mostra per ogni richiesta: permessi aggiunti (verde) e rimossi (rosso)
 *  - Approvazione → aggiorna/crea UserPermissions + imposta request status "approved"
 *  - Rifiuto → imposta request status "rejected" con nota opzionale
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Check, X, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

const PERMISSION_LABELS = {
  view_employees: "Visualizza dipendenti",
  edit_employees: "Modifica dipendenti",
  invite_employees: "Invita dipendenti",
  delete_employees: "Elimina dipendenti",
  view_attendance: "Visualizza presenze",
  edit_attendance: "Modifica presenze",
  view_leave_requests: "Visualizza ferie",
  approve_leave_requests: "Approva ferie",
  view_overtime: "Visualizza straordinari",
  approve_overtime: "Approva straordinari",
  view_documents: "Visualizza documenti",
  edit_documents: "Modifica documenti",
  view_contracts: "Visualizza contratti",
  edit_contracts: "Modifica contratti",
  view_payroll: "Visualizza buste paga",
  edit_payroll: "Carica buste paga",
  view_shifts: "Visualizza turni",
  edit_shifts: "Modifica turni",
  view_assets: "Visualizza asset",
  edit_assets: "Modifica asset",
  view_analytics: "Visualizza analytics",
  view_announcements: "Visualizza annunci",
  edit_announcements: "Crea annunci",
};

function RequestCard({ request, companyId, onReviewed }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState("");

  const current = request.current_permissions || {};
  const requested = request.requested_permissions || {};

  const changes = Object.keys(PERMISSION_LABELS).filter(k => current[k] !== requested[k]);
  const added = changes.filter(k => requested[k] && !current[k]);
  const removed = changes.filter(k => !requested[k] && current[k]);

  const handleDecision = async (decision) => {
    setReviewing(true);
    const reviewer = await base44.auth.me();

    if (decision === "approved") {
      // Applica i permessi
      const existing = await base44.entities.UserPermissions.filter({
        user_email: request.requester_email,
        company_id: companyId,
      });
      const data = {
        user_email: request.requester_email,
        company_id: companyId,
        granted_by: reviewer.email,
        permissions: request.requested_permissions,
      };
      if (existing[0]) {
        await base44.entities.UserPermissions.update(existing[0].id, data);
      } else {
        await base44.entities.UserPermissions.create(data);
      }
    }

    await base44.entities.PermissionChangeRequest.update(request.id, {
      status: decision,
      reviewed_by: reviewer.email,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
    });

    toast.success(decision === "approved" ? "Permessi approvati e applicati" : "Richiesta rifiutata");
    setReviewing(false);
    onReviewed();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 bg-white">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{request.requester_email}</p>
          <p className="text-xs text-slate-400">
            {changes.length} modifica{changes.length !== 1 ? "he" : ""} richiesta{changes.length !== 1 ? "e" : ""} •{" "}
            {request.created_date ? formatDistanceToNow(new Date(request.created_date), { addSuffix: true, locale: it }) : ""}
          </p>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
          {/* Diff */}
          <div className="space-y-2">
            {added.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1">Permessi richiesti (aggiunti)</p>
                <div className="flex flex-wrap gap-1.5">
                  {added.map(k => (
                    <span key={k} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">+ {PERMISSION_LABELS[k]}</span>
                  ))}
                </div>
              </div>
            )}
            {removed.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-1">Permessi rimossi</p>
                <div className="flex flex-wrap gap-1.5">
                  {removed.map(k => (
                    <span key={k} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">− {PERMISSION_LABELS[k]}</span>
                  ))}
                </div>
              </div>
            )}
            {changes.length === 0 && (
              <p className="text-xs text-slate-400">Nessuna modifica rilevata.</p>
            )}
          </div>

          {request.request_note && (
            <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
              <p className="text-xs text-slate-500 font-semibold mb-0.5">Nota del richiedente</p>
              <p className="text-sm text-slate-700">{request.request_note}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nota (opzionale)</label>
            <input
              type="text"
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="Motivo approvazione/rifiuto..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDecision("rejected")}
              disabled={reviewing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Rifiuta
            </button>
            <button
              onClick={() => handleDecision("approved")}
              disabled={reviewing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {reviewing ? "..." : "Approva e applica"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PermissionRequestsPanel({ companyId, onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await base44.entities.PermissionChangeRequest.filter({ company_id: companyId, status: "pending" });
    setRequests(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, [companyId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800">Richieste modifica permessi</h2>
            <p className="text-xs text-slate-500">{requests.length} in attesa di approvazione</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center">
              <Check className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessuna richiesta in attesa</p>
            </div>
          ) : (
            requests.map(r => (
              <RequestCard key={r.id} request={r} companyId={companyId} onReviewed={load} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}