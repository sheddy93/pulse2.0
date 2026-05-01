import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Settings, Plus, Edit2, Trash2, ChevronDown, Save } from "lucide-react";
import { toast } from "sonner";

const REQUEST_TYPES = [
  { value: "leave_request", label: "Richiesta Ferie/Permessi" },
  { value: "expense_reimbursement", label: "Rimborso Spese" },
  { value: "salary_variation", label: "Variazione Salariale" },
  { value: "document_approval", label: "Approvazione Documenti" },
  { value: "overtime", label: "Straordinari" },
];

const APPROVER_ROLES = [
  { value: "manager", label: "Manager Diretto" },
  { value: "hr_admin", label: "Admin HR" },
  { value: "company_owner", label: "Proprietario Azienda" },
  { value: "department_head", label: "Head Dipartimento" },
];

export default function WorkflowConfiguration() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    request_type: "leave_request",
    description: "",
    is_active: true,
    approval_steps: [
      { step_number: 1, approver_role: "manager", allow_rejection: true, allow_comments: true }
    ],
    auto_approve_after_days: null,
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const result = await base44.entities.WorkflowDefinition.filter({
          company_id: me.company_id
        });
        setWorkflows(result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleAddStep = () => {
    const newStep = {
      step_number: Math.max(...formData.approval_steps.map(s => s.step_number), 0) + 1,
      approver_role: "hr_admin",
      allow_rejection: true,
      allow_comments: true
    };
    setFormData({
      ...formData,
      approval_steps: [...formData.approval_steps, newStep]
    });
  };

  const handleRemoveStep = (stepNum) => {
    setFormData({
      ...formData,
      approval_steps: formData.approval_steps.filter(s => s.step_number !== stepNum)
    });
  };

  const handleUpdateStep = (stepNum, field, value) => {
    setFormData({
      ...formData,
      approval_steps: formData.approval_steps.map(s =>
        s.step_number === stepNum ? { ...s, [field]: value } : s
      )
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.request_type) {
      toast.error("Nome e tipo di richiesta sono obbligatori");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.WorkflowDefinition.update(editingId, {
          ...formData,
          company_id: user.company_id
        });
        toast.success("Workflow aggiornato");
      } else {
        await base44.entities.WorkflowDefinition.create({
          ...formData,
          company_id: user.company_id
        });
        toast.success("Workflow creato");
      }

      setEditingId(null);
      setFormData({
        name: "",
        request_type: "leave_request",
        description: "",
        is_active: true,
        approval_steps: [
          { step_number: 1, approver_role: "manager", allow_rejection: true, allow_comments: true }
        ],
        auto_approve_after_days: null,
      });

      const result = await base44.entities.WorkflowDefinition.filter({
        company_id: user.company_id
      });
      setWorkflows(result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo workflow?")) return;
    
    try {
      await base44.entities.WorkflowDefinition.delete(id);
      toast.success("Workflow eliminato");
      const result = await base44.entities.WorkflowDefinition.filter({
        company_id: user.company_id
      });
      setWorkflows(result);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleEdit = (workflow) => {
    setEditingId(workflow.id);
    setFormData(workflow);
    setExpandedId(workflow.id);
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurazione Workflow</h1>
          <p className="text-slate-600">Personalizza le gerarchie di approvazione per le richieste</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? "Modifica Workflow" : "Nuovo Workflow"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Workflow</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="es. Approvazione Ferie"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo di Richiesta</label>
              <select
                value={formData.request_type}
                onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {REQUEST_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Descrizione</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrivi il processo di approvazione..."
            />
          </div>

          {/* Approval Steps */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Step di Approvazione</h3>
              <button
                onClick={handleAddStep}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm font-medium hover:bg-blue-200"
              >
                <Plus className="w-4 h-4" /> Step
              </button>
            </div>

            <div className="space-y-3">
              {formData.approval_steps.map(step => (
                <div key={step.step_number} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">Step {step.step_number}</p>
                    <button
                      onClick={() => handleRemoveStep(step.step_number)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Ruolo Approvatore</label>
                      <select
                        value={step.approver_role}
                        onChange={(e) => handleUpdateStep(step.step_number, 'approver_role', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {APPROVER_ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Email (opzionale)</label>
                      <input
                        type="email"
                        value={step.approver_email || ""}
                        onChange={(e) => handleUpdateStep(step.step_number, 'approver_email', e.target.value)}
                        placeholder="Se specifico"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={step.allow_rejection}
                        onChange={(e) => handleUpdateStep(step.step_number, 'allow_rejection', e.target.checked)}
                        className="w-4 h-4"
                      />
                      Consenti rifiuto
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={step.allow_comments}
                        onChange={(e) => handleUpdateStep(step.step_number, 'allow_comments', e.target.checked)}
                        className="w-4 h-4"
                      />
                      Consenti commenti
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Auto-approva dopo (giorni)</label>
              <input
                type="number"
                min="0"
                value={formData.auto_approve_after_days || ""}
                onChange={(e) => setFormData({ ...formData, auto_approve_after_days: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Es. 5"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">Workflow Attivo</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Salva
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: "",
                    request_type: "leave_request",
                    description: "",
                    is_active: true,
                    approval_steps: [
                      { step_number: 1, approver_role: "manager", allow_rejection: true, allow_comments: true }
                    ],
                    auto_approve_after_days: null,
                  });
                }}
                className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
              >
                Annulla
              </button>
            )}
          </div>
        </div>

        {/* Workflows List */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Workflow Configurati</h2>
          {workflows.length === 0 ? (
            <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500">
              Nessun workflow configurato. Crea il primo workflow sopra.
            </div>
          ) : (
            workflows.map(wf => (
              <div key={wf.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === wf.id ? null : wf.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{wf.name}</p>
                    <p className="text-xs text-slate-500">{REQUEST_TYPES.find(t => t.value === wf.request_type)?.label}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {wf.is_active && <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Attivo</span>}
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === wf.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expandedId === wf.id && (
                  <div className="border-t p-4 bg-slate-50 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">STEP DI APPROVAZIONE</p>
                      <div className="space-y-2">
                        {wf.approval_steps.map((step, idx) => (
                          <div key={idx} className="text-sm text-slate-700">
                            Step {step.step_number}: <strong>{APPROVER_ROLES.find(r => r.value === step.approver_role)?.label}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => handleEdit(wf)}
                        className="flex items-center gap-1 px-4 py-2 border border-blue-300 text-blue-600 rounded text-sm font-medium hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" /> Modifica
                      </button>
                      <button
                        onClick={() => handleDelete(wf.id)}
                        className="flex items-center gap-1 px-4 py-2 border border-red-300 text-red-600 rounded text-sm font-medium hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" /> Elimina
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}