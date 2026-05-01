import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, AlertCircle } from 'lucide-react';

export default function PricingConfigManager() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    price_per_employee: 4,
    plan_startup: 99,
    plan_professional: 299,
    plan_enterprise: 999,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const settings = await base44.entities.PlatformSettings.filter({ key: 'pricing_config' });
      if (settings?.length > 0) {
        setConfig(settings[0].value || config);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const existing = await base44.entities.PlatformSettings.filter({ key: 'pricing_config' });
      if (existing?.length > 0) {
        await base44.entities.PlatformSettings.update(existing[0].id, { value: config });
      } else {
        await base44.entities.PlatformSettings.create({
          key: 'pricing_config',
          value: config,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  if (loading) return <div className="text-center py-8">Caricamento...</div>;

  return (
    <div className="space-y-6">
      {/* Per-Seat Pricing */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Prezzo per Dipendente</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prezzo per dipendente/mese (€)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.price_per_employee}
                  onChange={(e) => setConfig(c => ({ ...c, price_per_employee: parseFloat(e.target.value) }))}
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Ogni dipendente aggiuntivo costerà questo importo mensile oltre al prezzo del piano
            </p>
          </div>

          {/* Esempi */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Esempi di calcolo:</p>
            <div className="space-y-1 text-xs text-slate-600">
              <p>• Piano Startup (10 dipendenti inclusi) + 5 dipendenti extra = €99 + (5 × €{config.price_per_employee}) = €{(99 + 5 * config.price_per_employee).toFixed(2)}</p>
              <p>• Piano Professional (50 dipendenti inclusi) + 20 dipendenti extra = €299 + (20 × €{config.price_per_employee}) = €{(299 + 20 * config.price_per_employee).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Base Plan Prices */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Prezzi Piani</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Piano Startup</label>
            <div className="flex items-center">
              <span className="text-slate-500">€</span>
              <input
                type="number"
                min="0"
                step="1"
                value={config.plan_startup}
                onChange={(e) => setConfig(c => ({ ...c, plan_startup: parseInt(e.target.value) }))}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-500 ml-2">/mese</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Piano Professional</label>
            <div className="flex items-center">
              <span className="text-slate-500">€</span>
              <input
                type="number"
                min="0"
                step="1"
                value={config.plan_professional}
                onChange={(e) => setConfig(c => ({ ...c, plan_professional: parseInt(e.target.value) }))}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-500 ml-2">/mese</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Piano Enterprise</label>
            <div className="flex items-center">
              <span className="text-slate-500">€</span>
              <input
                type="number"
                min="0"
                step="1"
                value={config.plan_enterprise}
                onChange={(e) => setConfig(c => ({ ...c, plan_enterprise: parseInt(e.target.value) }))}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-500 ml-2">/mese</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">Nota importante</p>
          <p className="text-xs text-amber-800 mt-1">Le modifiche ai prezzi saranno applicate ai nuovi checkout. Le subscription attive manterranno i prezzi attuali fino al rinnovo.</p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        <Save className="w-4 h-4" />
        Salva configurazione
      </button>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
          ✓ Configurazione salvata con successo
        </div>
      )}
    </div>
  );
}