import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Copy, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

const INTEGRATION_TYPES = {
  quickbooks: { label: "Quickbooks", icon: "📊", color: "bg-blue-50 border-blue-200" },
  zucchetti: { label: "Zucchetti", icon: "📱", color: "bg-purple-50 border-purple-200" },
  slack: { label: "Slack", icon: "💬", color: "bg-indigo-50 border-indigo-200" },
  teams: { label: "Microsoft Teams", icon: "👥", color: "bg-cyan-50 border-cyan-200" },
  custom: { label: "Custom", icon: "⚙️", color: "bg-slate-50 border-slate-200" }
};

const EVENTS = [
  { id: "employee_created", label: "Dipendente creato" },
  { id: "employee_updated", label: "Dipendente aggiornato" },
  { id: "employee_deleted", label: "Dipendente eliminato" },
  { id: "time_entry_created", label: "Timbratura registrata" },
  { id: "leave_request_approved", label: "Ferie approvate" },
  { id: "overtime_approved", label: "Straordinario approvato" }
];

import { authService } from '@/services/authService';

export default function IntegrationSettings() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    integration_type: "custom",
    webhook_url: "",
    events: ["time_entry_created"]
  });
  const [apiKeyForm, setApiKeyForm] = useState({
    name: "",
    permissions: ["read:employees", "read:time_entries"]
  });

  useEffect(() => {
    const init = async () => {
      try {
        const me = await authService.me();
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, webhooks, apiKeys] = await Promise.all([
        // TODO: Replace with service.Company.filter({ id: me.company_id }),
        // TODO: Replace with service.WebhookIntegration.filter({ company_id: me.company_id }),
        // TODO: Replace with service.APIKey.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setWebhooks(webhooks);
      setApiKeys(apiKeys);
      setLoading(false);
      } catch (err) {
        console.error('Error loading integration settings:', err);
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAddWebhook = async (e) => {
    e.preventDefault();
    // TODO: Replace with service.WebhookIntegration.create() call
    // TODO: Replace with service.WebhookIntegration.filter() call
    setWebhooks([]);
    setShowWebhookForm(false);
    setWebhookForm({ name: "", integration_type: "custom", webhook_url: "", events: [] });
  };

  const handleDeleteWebhook = async (id) => {
    if (confirm("Elimina questo webhook?")) {
      // TODO: Replace with service.WebhookIntegration.delete(id);
      setWebhooks(webhooks.filter(w => w.id !== id));
    }
  };

  const handleGenerateApiKey = async (e) => {
    e.preventDefault();
    // In produzione, la chiave sarebbe generata nel backend
    const key = `pk_live_${Math.random().toString(36).substring(2, 15)}`;
    setGeneratedKey(key);
    
    // TODO: Replace with service.APIKey.create() call
    // TODO: Replace with service.APIKey.filter() call
    setApiKeys([]);
    setApiKeyForm({ name: "", permissions: [] });
  };

  const handleDeleteApiKey = async (id) => {
    if (confirm("Elimina questa chiave API?")) {
      // TODO: Replace with service.APIKey.delete(id);
      setApiKeys(apiKeys.filter(k => k.id !== id));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Integrazioni REST API</h1>
          <p className="text-sm text-slate-500">{company?.name}</p>
        </div>

        {/* Documentazione API */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-3">📖 Documentazione API</h2>
          <div className="space-y-2 text-sm text-amber-900">
            <p><strong>Base URL:</strong> <code className="bg-amber-100 px-2 py-1 rounded">{window.location.origin}/api/v1</code></p>
            <p><strong>Autenticazione:</strong> Header <code className="bg-amber-100 px-2 py-1 rounded">Authorization: Bearer YOUR_API_KEY</code></p>
            <p><strong>Identificazione azienda:</strong> Header <code className="bg-amber-100 px-2 py-1 rounded">X-Company-ID: {company?.id}</code></p>
            <div className="mt-3 space-y-1">
              <p><strong>Endpoint disponibili:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>🔍 <code className="bg-amber-100 px-2 py-1 rounded">GET /employees</code> - Lista dipendenti</li>
                <li>🔍 <code className="bg-amber-100 px-2 py-1 rounded">GET /time-entries</code> - Timbrature</li>
                <li>🔍 <code className="bg-amber-100 px-2 py-1 rounded">GET /leave-requests</code> - Richieste ferie</li>
                <li>📝 <code className="bg-amber-100 px-2 py-1 rounded">POST /webhooks</code> - Registra webhook</li>
                <li>🏥 <code className="bg-amber-100 px-2 py-1 rounded">GET /health</code> - Health check (no auth)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chiavi API */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Chiavi API</h2>
              <p className="text-xs text-slate-500">Per autenticare le richieste REST</p>
            </div>
            <button
              onClick={() => setShowApiKeyForm(!showApiKeyForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Nuova Chiave
            </button>
          </div>

          {showApiKeyForm && (
            <form onSubmit={handleGenerateApiKey} className="bg-slate-50 p-4 rounded-lg mb-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome chiave</label>
                <input
                  type="text"
                  required
                  value={apiKeyForm.name}
                  onChange={e => setApiKeyForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Es. Quickbooks Sync"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Permessi</label>
                <div className="space-y-2">
                  {[
                    { id: "read:employees", label: "Leggi dipendenti" },
                    { id: "read:time_entries", label: "Leggi timbrature" },
                    { id: "read:leave_requests", label: "Leggi richieste ferie" },
                    { id: "read:payroll", label: "Leggi buste paga" },
                    { id: "write:webhooks", label: "Scrivi webhook" }
                  ].map(perm => (
                    <label key={perm.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={apiKeyForm.permissions.includes(perm.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setApiKeyForm(f => ({ ...f, permissions: [...f.permissions, perm.id] }));
                          } else {
                            setApiKeyForm(f => ({ ...f, permissions: f.permissions.filter(p => p !== perm.id) }));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-600">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowApiKeyForm(false)}
                  className="flex-1 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Genera Chiave
                </button>
              </div>
            </form>
          )}

          {generatedKey && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald-900 font-semibold mb-2">Chiave generata (salvala subito!):</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-emerald-300 px-3 py-2 rounded text-sm font-mono text-slate-800">{generatedKey}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedKey)}
                  className="p-2 hover:bg-emerald-100 rounded-lg"
                >
                  <Copy className="w-4 h-4 text-emerald-700" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{key.name}</p>
                  <p className="text-xs text-slate-500">{key.prefix}***</p>
                </div>
                <button
                  onClick={() => handleDeleteApiKey(key.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {apiKeys.length === 0 && <p className="text-sm text-slate-400 py-4">Nessuna chiave API ancora</p>}
          </div>
        </div>

        {/* Webhook */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Webhook</h2>
              <p className="text-xs text-slate-500">Ricevi notifiche in tempo reale</p>
            </div>
            <button
              onClick={() => setShowWebhookForm(!showWebhookForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Nuovo Webhook
            </button>
          </div>

          {showWebhookForm && (
            <form onSubmit={handleAddWebhook} className="bg-slate-50 p-4 rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={webhookForm.name}
                    onChange={e => setWebhookForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo integrazione</label>
                  <select
                    value={webhookForm.integration_type}
                    onChange={e => setWebhookForm(f => ({ ...f, integration_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    {Object.entries(INTEGRATION_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL Webhook</label>
                <input
                  type="url"
                  required
                  value={webhookForm.webhook_url}
                  onChange={e => setWebhookForm(f => ({ ...f, webhook_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Eventi</label>
                <div className="space-y-2">
                  {EVENTS.map(event => (
                    <label key={event.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhookForm.events.includes(event.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setWebhookForm(f => ({ ...f, events: [...f.events, event.id] }));
                          } else {
                            setWebhookForm(f => ({ ...f, events: f.events.filter(ev => ev !== event.id) }));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-600">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowWebhookForm(false)} className="flex-1 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">Annulla</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Crea Webhook</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {webhooks.map(webhook => (
              <div key={webhook.id} className={`p-4 rounded-lg border-2 ${INTEGRATION_TYPES[webhook.integration_type]?.color}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{INTEGRATION_TYPES[webhook.integration_type]?.icon}</span>
                      <h3 className="font-semibold text-slate-800">{webhook.name}</h3>
                      {webhook.is_active ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="w-3 h-3" />Attivo</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-700"><AlertCircle className="w-3 h-3" />Inattivo</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{webhook.webhook_url}</p>
                    <div className="text-xs text-slate-500">
                      <p className="font-medium">Eventi: {webhook.events?.join(", ")}</p>
                      {webhook.last_triggered_at && <p>Ultimo trigger: {new Date(webhook.last_triggered_at).toLocaleString("it-IT")}</p>}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteWebhook(webhook.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {webhooks.length === 0 && <p className="text-sm text-slate-400 py-4">Nessun webhook configurato</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}