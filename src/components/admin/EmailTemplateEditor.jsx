import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Save, Copy, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const TEMPLATE_TYPES = [
  { value: "trial_welcome", label: "Benvenuto Trial" },
  { value: "trial_reminder_3days", label: "Reminder Trial - 3 giorni" },
  { value: "trial_reminder_1day", label: "Reminder Trial - 1 giorno" },
  { value: "trial_expired", label: "Trial Scaduto" },
  { value: "payment_invoice", label: "Fattura Pagamento" },
  { value: "payment_receipt", label: "Ricevuta Pagamento" },
  { value: "plan_change", label: "Cambio Piano" },
  { value: "addon_change", label: "Cambio Add-on" },
  { value: "subscription_cancelled", label: "Abbonamento Cancellato" },
  { value: "payment_failed", label: "Pagamento Fallito" },
];

export default function EmailTemplateEditor() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const result = await base44.entities.EmailTemplate.filter({});
    setTemplates(result);
    if (result.length > 0) setSelectedTemplate(result[0]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedTemplate.subject || !selectedTemplate.body) {
      toast.error("Oggetto e corpo email sono obbligatori");
      return;
    }

    setSaving(true);
    try {
      if (selectedTemplate.id) {
        await base44.entities.EmailTemplate.update(selectedTemplate.id, selectedTemplate);
        toast.success("Template aggiornato");
      } else {
        await base44.entities.EmailTemplate.create(selectedTemplate);
        toast.success("Template creato");
      }
      setEditMode(false);
      await loadTemplates();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiato negli appunti");
  };

  if (loading) return <div className="text-center py-8 text-slate-500">Caricamento...</div>;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Lista Templates */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-600 mb-3">Template disponibili</p>
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTemplate(t);
              setEditMode(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
              selectedTemplate?.id === t.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{t.label}</p>
                <p className="text-xs text-slate-500 mt-1">{t.subject}</p>
              </div>
              {t.is_enabled && (
                <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded">Attivo</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Editor Template */}
      {selectedTemplate ? (
        editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Oggetto</label>
              <input
                type="text"
                value={selectedTemplate.subject || ""}
                onChange={e => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Testo di anteprima</label>
              <input
                type="text"
                value={selectedTemplate.preview_text || ""}
                onChange={e => setSelectedTemplate({ ...selectedTemplate, preview_text: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Corpo Email (HTML)</label>
              <textarea
                value={selectedTemplate.body || ""}
                onChange={(e) =>
                  setSelectedTemplate({ ...selectedTemplate, body: e.target.value })
                }
                rows="12"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                Variabili disponibili: {'{{company_name}}'}, {'{{contact_name}}'}, {'{{trial_end}}'}, {'{{plan_name}}'}, {'{{price}}'}, etc
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Invia a</label>
                <select
                  value={selectedTemplate.send_to || 'contact_email'}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, send_to: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="contact_email">Email contatto</option>
                  <option value="company_email">Email azienda</option>
                  <option value="both">Entrambe</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTemplate.is_enabled !== false}
                    onChange={(e) =>
                      setSelectedTemplate({ ...selectedTemplate, is_enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Abilita template</span>
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
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-2 px-6 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
              >
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-4">
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">OGGETTO</p>
                <p className="font-semibold text-slate-900">{selectedTemplate.subject}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-slate-500 font-semibold mb-1">ANTEPRIMA</p>
                <p className="text-sm text-slate-600">{selectedTemplate.preview_text}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-slate-500 font-semibold mb-2">CONTENUTO</p>
                <div className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded border border-slate-200 max-h-96 overflow-auto">
                  {selectedTemplate.body}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Modifica
              </button>
              <button
                onClick={() => copyToClipboard(selectedTemplate.body)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-lg text-slate-500">
          Seleziona un template per modificarlo
        </div>
      )}
    </div>
  );
}