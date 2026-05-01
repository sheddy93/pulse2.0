import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Save, X } from "lucide-react";
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

export default function PermissionsEditor({ targetUser, companyId, grantedBy, onClose }) {
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [existingId, setExistingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.UserPermissions.filter({ user_email: targetUser.email, company_id: companyId })
      .then(results => {
        if (results[0]) {
          setExistingId(results[0].id);
          setPermissions({ ...DEFAULT_PERMISSIONS, ...results[0].permissions });
        }
      });
  }, [targetUser.email, companyId]);

  const toggle = (key) => setPermissions(p => ({ ...p, [key]: !p[key] }));

  const save = async () => {
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
          <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "Salvataggio..." : "Salva permessi"}
          </button>
        </div>
      </div>
    </div>
  );
}