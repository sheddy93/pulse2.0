/**
 * EmailTemplateEditor.jsx
 * -----------------------
 * Editor dei template email nel Super Admin.
 * Consente di personalizzare tutte le email automatiche.
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_TEMPLATES = {
  trial_welcome: {
    label: 'Benvenuto Trial',
    subject: '✅ Benvenuto in PulseHR! Il tuo trial gratuito è attivo',
    preview_text: 'Hai 14 giorni gratis per testare tutto',
    body: `Ciao {{contact_name}},\n\nBenvenuto in PulseHR! 🎉\n\nIl tuo trial gratuito per {{company_name}} è attivo e scadrà il {{trial_end}}.\n\nNei prossimi 14 giorni puoi:\n✅ Gestire dipendenti illimitati\n✅ Accedere a tutti i moduli\n✅ Invitare il tuo team\n✅ Contattare il nostro supporto 24/7\n\nAccedi qui: https://app.pulsehr.io\n\nBuona fortuna!\nIl team di PulseHR`
  },
  trial_reminder_3days: {
    label: 'Reminder - 3 giorni al termine',
    subject: '⏰ Il tuo trial PulseHR scade tra {{days_left}} giorni',
    preview_text: 'Non perdere l\'accesso ai dati della tua azienda',
    body: `Ciao {{contact_name}},\n\nIl tuo trial gratuito per {{company_name}} scade tra {{days_left}} giorni ({{trial_end}}).\n\nQuello che abbiamo preposto per te:\n📊 Piano {{plan_name}} - €{{price}}/mese\n📦 {{addons_count}} moduli aggiuntivi\n\nPrima che scada, assicurati di:\n1. Invitare il tuo team per testare\n2. Importare i dati dei dipendenti\n3. Configurare le integrazioni\n\nAl termine del trial, potrai passare al piano a pagamento senza perdere nessun dato.\n\nAccedi: https://app.pulsehr.io\n\nDomande? Rispondi a questa email.\nIl team di PulseHR`
  },
  trial_reminder_1day: {
    label: 'Reminder - Ultimo giorno',
    subject: '🚨 Ultimi 24 ore per il tuo trial PulseHR',
    preview_text: 'Ultimi 24 ore per testare gratis',
    body: `Ciao {{contact_name}},\n\nÈ l'ultimo giorno del tuo trial gratuito! 🚨\n\nIl 1° giorno del mese prossimo, attiveremo automaticamente il tuo abbonamento al piano {{plan_name}} (€{{price}}/mese).\n\nSe non desideri proseguire, contattaci entro oggi.\n\nAccedi: https://app.pulsehr.io\n\nIl team di PulseHR`
  },
  trial_expired: {
    label: 'Trial scaduto - Attivazione piano',
    subject: '✅ Il tuo abbonamento PulseHR è ora attivo!',
    preview_text: 'Piano {{plan_name}} confermato',
    body: `Ciao {{contact_name}},\n\nIl tuo trial gratuito è terminato e il piano {{plan_name}} è ora attivo per {{company_name}}.\n\n💰 Abbonamento confermato:\n- Piano: {{plan_name}}\n- Prezzo: €{{price}}/mese\n- Prossima fatturazione: primo giorno del mese\n\nAccedi: https://app.pulsehr.io\n\nGrazie per aver scelto PulseHR!\nIl team`
  },
  payment_invoice: {
    label: 'Fattura pagamento',
    subject: '📄 Fattura PulseHR - {{plan_name}}',
    preview_text: 'La tua fattura per il mese è pronta',
    body: `Ciao {{contact_name}},\n\nAllega è la tua fattura per {{company_name}}.\n\n💳 Dettagli pagamento:\n- Piano: {{plan_name}}\n- Importo: €{{price}}\n- Data: {{invoice_date}}\n- Riferimento: {{invoice_number}}\n\nScarica la fattura: {{invoice_url}}\n\nIl team di PulseHR`
  },
  payment_receipt: {
    label: 'Ricevuta pagamento',
    subject: '✅ Ricevuta pagamento - {{plan_name}}',
    preview_text: 'Il tuo pagamento è stato confermato',
    body: `Ciao {{contact_name}},\n\nIl pagamento per {{company_name}} è stato processato con successo.\n\n✅ Dettagli:\n- Piano: {{plan_name}}\n- Importo: €{{price}}\n- Data: {{payment_date}}\n- Metodo: {{payment_method}}\n\nAccedi: https://app.pulsehr.io\n\nGrazie!\nIl team di PulseHR`
  },
  plan_change: {
    label: 'Cambio piano',
    subject: '🔄 Il tuo piano PulseHR è stato aggiornato',
    preview_text: 'Piano aggiornato a {{plan_name}}',
    body: `Ciao {{contact_name}},\n\nIl tuo abbonamento è stato aggiornato a {{plan_name}}.\n\n📊 Nuovo piano:\n- Piano: {{plan_name}}\n- Prezzo: €{{price}}/mese\n- Effettivo da: {{change_date}}\n\nAccedi: https://app.pulsehr.io\n\nDomande? Contattaci.\nIl team di PulseHR`
  },
  addon_change: {
    label: 'Cambio add-ons',
    subject: '📦 I tuoi moduli aggiuntivi sono stati aggiornati',
    preview_text: 'Moduli aggiornati per {{company_name}}',
    body: `Ciao {{contact_name}},\n\nGli add-ons per {{company_name}} sono stati aggiornati.\n\n📦 Modulo: {{addon_name}}\n- Quantità: {{addon_quantity}}\n- Costo aggiuntivo: €{{addon_price}}/mese\n- Effettivo da: {{change_date}}\n\nAccedi: https://app.pulsehr.io\n\nIl team di PulseHR`
  }
};

export default function EmailTemplateEditor() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await base44.entities.EmailTemplate.list();
      if (data.length === 0) {
        // Crea template di default
        await Promise.all(
          Object.entries(DEFAULT_TEMPLATES).map(([type, template]) =>
            base44.entities.EmailTemplate.create({
              template_type: type,
              ...template,
              send_to: 'contact_email'
            })
          )
        );
        loadTemplates();
      } else {
        setTemplates(data);
        setSelectedTemplate(data[0]);
      }
    } catch (e) {
      toast.error('Errore: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      await base44.entities.EmailTemplate.update(selectedTemplate.id, {
        subject: selectedTemplate.subject,
        preview_text: selectedTemplate.preview_text,
        body: selectedTemplate.body,
        is_enabled: selectedTemplate.is_enabled,
        send_to: selectedTemplate.send_to
      });
      toast.success('Template salvato');
    } catch (e) {
      toast.error('Errore: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-600">Caricamento...</div>;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Lista template */}
      <div className="col-span-1 space-y-2">
        <h3 className="font-bold text-slate-900 mb-4">Template email</h3>
        <div className="space-y-2">
          {templates.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                selectedTemplate?.id === tpl.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{tpl.label}</span>
                {tpl.is_enabled ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Attivo</span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">Disattivo</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{tpl.preview_text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      {selectedTemplate && (
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{selectedTemplate.label}</h2>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Nascondi' : 'Anteprima'}
            </button>
          </div>

          {!showPreview ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Oggetto email</label>
                <input
                  type="text"
                  value={selectedTemplate.subject}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Testo di anteprima</label>
                <input
                  type="text"
                  value={selectedTemplate.preview_text}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, preview_text: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Snippet mostrato nell'anteprima email</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contenuto email</label>
                <textarea
                  value={selectedTemplate.body}
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
                    value={selectedTemplate.send_to}
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
                      checked={selectedTemplate.is_enabled}
                      onChange={(e) =>
                        setSelectedTemplate({ ...selectedTemplate, is_enabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Abilita questo template</span>
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
              </div>
            </>
          ) : (
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}