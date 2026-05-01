import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Save, RotateCcw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = {
  general: 'Generale',
  api: 'API & Integrations',
  security: 'Sicurezza',
  email: 'Email',
  integrations: 'Integrazioni',
  features: 'Features',
  billing: 'Billing',
  database: 'Database'
};

const DEFAULT_SETTINGS = [
  {
    setting_key: 'app_name',
    setting_category: 'general',
    display_name: 'Nome Applicazione',
    description: 'Nome ufficiale dell\'app',
    setting_type: 'string',
    value: 'PulseHR',
    default_value: 'PulseHR'
  },
  {
    setting_key: 'app_description',
    setting_category: 'general',
    display_name: 'Descrizione App',
    description: 'Descrizione breve della piattaforma',
    setting_type: 'text_area',
    value: 'Gestione HR completa per PMI',
    default_value: 'Gestione HR completa per PMI'
  },
  {
    setting_key: 'support_email',
    setting_category: 'general',
    display_name: 'Email di Supporto',
    setting_type: 'string',
    value: 'support@pulsehr.it',
    default_value: 'support@pulsehr.it'
  },
  {
    setting_key: 'api_rate_limit',
    setting_category: 'api',
    display_name: 'Rate Limit API (req/min)',
    setting_type: 'number',
    value: 100,
    default_value: 100,
    min_value: 10,
    max_value: 10000
  },
  {
    setting_key: 'api_timeout_seconds',
    setting_category: 'api',
    display_name: 'Timeout API (secondi)',
    setting_type: 'number',
    value: 30,
    default_value: 30,
    min_value: 5,
    max_value: 300
  },
  {
    setting_key: 'enable_2fa',
    setting_category: 'security',
    display_name: 'Abilita 2FA',
    setting_type: 'boolean',
    value: true,
    default_value: true
  },
  {
    setting_key: 'password_min_length',
    setting_category: 'security',
    display_name: 'Lunghezza minima password',
    setting_type: 'number',
    value: 12,
    default_value: 12,
    min_value: 8,
    max_value: 32
  },
  {
    setting_key: 'smtp_server',
    setting_category: 'email',
    display_name: 'Server SMTP',
    setting_type: 'string',
    value: 'smtp.gmail.com',
    is_encrypted: false
  },
  {
    setting_key: 'smtp_port',
    setting_category: 'email',
    display_name: 'Porta SMTP',
    setting_type: 'number',
    value: 587,
    min_value: 1,
    max_value: 65535
  },
  {
    setting_key: 'max_upload_mb',
    setting_category: 'features',
    display_name: 'Max Upload (MB)',
    setting_type: 'number',
    value: 50,
    min_value: 1,
    max_value: 1000
  },
  {
    setting_key: 'enable_slack_integration',
    setting_category: 'integrations',
    display_name: 'Abilita Slack',
    setting_type: 'boolean',
    value: true
  },
  {
    setting_key: 'enable_google_calendar',
    setting_category: 'integrations',
    display_name: 'Abilita Google Calendar',
    setting_type: 'boolean',
    value: true
  }
];

export default function SuperAdminPlatformSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [activeCategory, setActiveCategory] = useState('general');

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      
      // Carica settings dal database
      try {
        const dbSettings = await base44.entities.PlatformSettings.filter({});
        if (dbSettings.length === 0) {
          // Prima volta: carica defaults
          setSettings(DEFAULT_SETTINGS);
        } else {
          setSettings(dbSettings);
        }
      } catch (e) {
        console.warn('PlatformSettings not initialized, using defaults');
        setSettings(DEFAULT_SETTINGS);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleChange = (setting, newValue) => {
    setEdited({
      ...edited,
      [setting.setting_key]: newValue
    });
  };

  const getDisplayValue = (setting) => {
    return edited[setting.setting_key] !== undefined 
      ? edited[setting.setting_key] 
      : setting.value;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(edited).map(([key, value]) => {
        const setting = settings.find(s => s.setting_key === key);
        return {
          ...setting,
          value,
          modified_by: user.email,
          modified_at: new Date().toISOString()
        };
      });

      // Salva o crea settings
      for (const setting of updates) {
        const existing = settings.find(s => s.setting_key === setting.setting_key);
        if (existing) {
          await base44.entities.PlatformSettings.update(existing.id, setting);
        } else {
          await base44.entities.PlatformSettings.create(setting);
        }
      }

      setSettings(prev => prev.map(s => 
        edited[s.setting_key] !== undefined 
          ? { ...s, value: edited[s.setting_key] }
          : s
      ));
      setEdited({});
      toast.success('Configurazioni salvate');

      // Log audit
      await base44.entities.AuditLog.create({
        action: 'platform_settings_updated',
        actor_email: user.email,
        entity_name: 'PlatformSettings',
        details: {
          updated_keys: Object.keys(edited),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      toast.error('Errore salvataggio: ' + error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (setting) => {
    const newEdited = { ...edited };
    delete newEdited[setting.setting_key];
    setEdited(newEdited);
  };

  const handleResetAll = () => {
    if (confirm('Ripristinare tutti i valori di default?')) {
      setEdited({});
    }
  };

  const filteredSettings = settings.filter(s => s.setting_category === activeCategory);
  const hasChanges = Object.keys(edited).length > 0;

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">⚙️ Configurazioni Piattaforma</h1>
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <button
                  onClick={handleResetAll}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" />
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={cn(
                'px-4 py-2 font-medium whitespace-nowrap transition-colors',
                activeCategory === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSettings.map(setting => {
            const value = getDisplayValue(setting);
            const hasChanged = edited[setting.setting_key] !== undefined;

            return (
              <div
                key={setting.setting_key}
                className={cn(
                  'p-4 border rounded-lg transition-colors',
                  hasChanged
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <label className="font-semibold text-slate-900 block">
                      {setting.display_name}
                      {setting.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <p className="text-sm text-slate-500 mt-1">{setting.description}</p>
                  </div>
                  {hasChanged && (
                    <button
                      onClick={() => handleReset(setting)}
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                      title="Ripristina"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                    </button>
                  )}
                </div>

                {/* Input based on type */}
                {setting.setting_type === 'boolean' && (
                  <div className="flex items-center gap-3 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => handleChange(setting, e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-slate-600">
                        {value ? 'Abilitato' : 'Disabilitato'}
                      </span>
                    </label>
                  </div>
                )}

                {setting.setting_type === 'number' && (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(setting, Number(e.target.value))}
                    min={setting.min_value}
                    max={setting.max_value}
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {setting.setting_type === 'select' && (
                  <select
                    value={value}
                    onChange={(e) => handleChange(setting, e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {setting.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {setting.setting_type === 'text_area' && (
                  <textarea
                    value={value}
                    onChange={(e) => handleChange(setting, e.target.value)}
                    rows="3"
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {(setting.setting_type === 'string' && !setting.is_encrypted) && (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(setting, e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {(setting.setting_type === 'string' && setting.is_encrypted) && (
                  <div className="relative mt-2">
                    <input
                      type={showSecrets[setting.setting_key] ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => handleChange(setting, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setShowSecrets(prev => ({
                        ...prev,
                        [setting.setting_key]: !prev[setting.setting_key]
                      }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                    >
                      {showSecrets[setting.setting_key] ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                )}

                {setting.restart_required && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded flex gap-2 text-xs text-amber-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Richiede restart dell'applicazione</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredSettings.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Nessuna configurazione in questa categoria
          </div>
        )}
      </div>
    </AppShell>
  );
}