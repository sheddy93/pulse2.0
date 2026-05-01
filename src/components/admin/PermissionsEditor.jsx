/**
 * PermissionsEditor.jsx
 * ----------------------
 * Modal per modificare i permessi di un utente su un'azienda specifica.
 * Usato per: consulenti collegati e admin aziendali interni.
 *
 * Props:
 *  - targetUser  (object): { email, full_name } — utente su cui modificare i permessi
 *  - companyId   (string): ID azienda di riferimento
 *  - grantedBy   (string): email di chi sta concedendo i permessi
 *  - onClose     (fn):     callback chiusura modal
 *  - isConsultant (bool):  se true → richiede approvazione (PermissionChangeRequest)
 *                          se false → salva direttamente su UserPermissions
 *
 * Flusso consulente (isConsultant=true):
 *  1. Admin configura i permessi desiderati
 *  2. Clicca "Richiedi modifiche" → si apre modale di conferma
 *  3. Può aggiungere una nota opzionale
 *  4. Viene creato un record PermissionChangeRequest con status "pending"
 *  5. Il titolare aziendale vede la richiesta in CompanyConsultants → PermissionRequestsPanel
 *  6. Dopo approvazione → i permessi vengono aggiornati in UserPermissions
 *
 * Flusso admin interno (isConsultant=false):
 *  1. Admin configura i permessi
 *  2. Clicca "Salva permessi" → salva direttamente su UserPermissions
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Save, X, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const PERMISSION_GROUPS = [
  {
    label: "Dipendenti",
    items: [
      { key: "view_employees", label: "Visualizza dipendenti" },
      { key: "edit_employees", label: "Modifica dipendenti" },
      { key: "invite_employees", label: "Invita dipendenti" },
      { key: "delete_employees", label: "Elimina dipendenti" },
    ]
  },
  {
    label: "Presenze",
    items: [
      { key: "view_attendance", label: "Visualizza presenze" },
      { key: "edit_attendance", label: "Modifica presenze" },
    ]
  },
  {
    label: "Ferie & Permessi",
    items: [
      { key: "view_leave_requests", label: "Visualizza richieste ferie" },
      { key: "approve_leave_requests", label: "Approva/rifiuta ferie" },
    ]
  },
  {
    label: "Straordinari",
    items: [
      { key: "view_overtime", label: "Visualizza straordinari" },
      { key: "approve_overtime", label: "Approva/rifiuta straordinari" },
    ]
  },
  {
    label: "Documenti",
    items: [
      { key: "view_documents", label: "Visualizza documenti" },
      { key: "edit_documents", label: "Carica/modifica documenti" },
    ]
  },
  {
    label: "Contratti & Buste Paga",
    items: [
      { key: "view_contracts", label: "Visualizza contratti" },
      { key: "edit_contracts", label: "Modifica contratti" },
      { key: "view_payroll", label: "Visualizza buste paga" },
      { key: "edit_payroll", label: "Carica buste paga" },
    ]
  },
  {
    label: "Turni",
    items: [
      { key: "view_shifts", label: "Visualizza turni" },
      { key: "edit_shifts", label: "Modifica turni" },
    ]
  },
  {
    label: "Risorse & Analytics",
    items: [
      { key: "view_assets", label: "Visualizza asset" },
      { key: "edit_assets", label: "Modifica asset" },
      { key: "view_analytics", label: "Visualizza analytics" },
    ]
  },
  {
    label: "Comunicazioni",
    items: [
      { key: "view_announcements", label: "Visualizza annunci" },
      { key: "edit_announcements", label: "Crea/modifica annunci" },
    ]
  },
];

const DEFAULT_PERMISSIONS = {
  view_employees: true, edit_employees: false,
  invite_employees: false, delete_employees: false,
  view_attendance: true, edit_attendance: false,
  view_leave_requests: true, approve_leave_requests: false,
  view_overtime: true, approve_overtime: false,
  view_documents: true, edit_documents: false,
  view_contracts: false, edit_contracts: false,
  view_payroll: false, edit_payroll: false,
  view_shifts: true, edit_shifts: false,
  view_assets: false, edit_assets: false,
  view_analytics: false,
  view_announcements: true, edit_announcements: false,
};

// isConsultant = true → richiede approvazione (doppio check)
// isConsultant = false → salva direttamente (per admin interni)
export default function PermissionsEditor({ targetUser, companyId, grantedBy, onClose, isConsultant = false }) {
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [pendingPermissions, setPendingPermissions] = useState(null); // permessi in attesa di approvazione
  const [existingId, setExistingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pendingRequestId, setPendingRequestId] = useState(null);

  useEffect(() => {
    // Carica permessi attuali
    base44.entities.UserPermissions.filter({ user_email: targetUser.email, company_id: companyId })
      .then(results => {
        if (results[0]) {
          setExistingId(results[0].id);
          setPermissions({ ...DEFAULT_PERMISSIONS, ...results[0].permissions });
        }
      });

    // Se consulente, carica eventuale richiesta pending
    if (isConsultant) {
      base44.entities.PermissionChangeRequest.filter({
        requester_email: targetUser.email,
        company_id: companyId,
        status: "pending"
      }).then(results => {
        if (results[0]) {
          setPendingPermissions(results[0].requested_permissions);
          setPendingRequestId(results[0].id);
        }
      });
    }
  }, [targetUser.email, companyId]);

  const toggle = (key) => setPermissions(p => ({ ...p, [key]: !p[key] }));

  // Salvataggio diretto (admin interni)
  const saveDirect = async () => {
    setSaving(true);
    const data = { user_email: targetUser.email, company_id: companyId, granted_by: grantedBy, permissions };
    if (existingId) {
      await base44.entities.UserPermissions.update(existingId, data);
    } else {
      const created = await base44.entities.UserPermissions.create(data);
      setExistingId(created.id);
    }
    toast.success("Permessi salvati");
    setSaving(false);
    onClose();
  };

  // Salvataggio con richiesta di approvazione (consulenti)
  const saveWithApproval = async () => {
    setSaving(true);
    // Annulla eventuale richiesta pending precedente
    if (pendingRequestId) {
      await base44.entities.PermissionChangeRequest.update(pendingRequestId, { status: "rejected", review_note: "Sostituita da nuova richiesta" });
    }
    await base44.entities.PermissionChangeRequest.create({
      requester_email: targetUser.email,
      requester_type: "consultant",
      company_id: companyId,
      requested_permissions: permissions,
      current_permissions: { ...DEFAULT_PERMISSIONS, ...(existingId ? permissions : {}) },
      request_note: note,
      status: "pending",
    });
    toast.success("Richiesta inviata — in attesa di approvazione aziendale");
    setSaving(false);
    setConfirmOpen(false);
    onClose();
  };

  const handleSave = () => {
    if (isConsultant) {
      setConfirmOpen(true);
    } else {
      saveDirect();
    }
  };

  // Diff delle modifiche per il consulente
  const getChanges = () => {
    const changes = [];
    PERMISSION_GROUPS.forEach(group => {
      group.items.forEach(item => {
        const currentVal = existingId ? permissions[item.key] : DEFAULT_PERMISSIONS[item.key];
        // compare with original loaded permissions (before toggling)
        // We just show all enabled ones for simplicity
      });
    });
    return changes;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800">Permessi di {targetUser.full_name || targetUser.email}</h2>
            <p className="text-xs text-slate-500">{targetUser.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Avviso richiesta pending */}
        {isConsultant && pendingPermissions && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Richiesta in attesa:</strong> esiste già una modifica permessi in attesa di approvazione dall'azienda. Salvando di nuovo, la precedente verrà annullata.
            </p>
          </div>
        )}

        {isConsultant && (
          <div className="mx-6 mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              Le modifiche ai permessi del consulente richiedono <strong>approvazione da parte dell'azienda</strong> prima di essere attive.
            </p>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {PERMISSION_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map(item => (
                  <label key={item.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${permissions[item.key] ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <input
                      type="checkbox"
                      checked={!!permissions[item.key]}
                      onChange={() => toggle(item.key)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "Salvataggio..." : isConsultant ? "Richiedi modifiche" : "Salva permessi"}
          </button>
        </div>
      </div>

      {/* Modale conferma con doppio check (solo consulenti) */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Conferma richiesta</h3>
                <p className="text-xs text-slate-500">La modifica dovrà essere approvata dall'azienda</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
              Stai inviando una richiesta di modifica permessi per <strong>{targetUser.full_name || targetUser.email}</strong>. <br />
              I permessi diventeranno attivi <strong>solo dopo l'approvazione</strong> da parte del titolare aziendale.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nota (opzionale)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Motivo della richiesta..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                Indietro
              </button>
              <button onClick={saveWithApproval} disabled={saving} className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
                {saving ? "Invio..." : "Conferma e invia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}