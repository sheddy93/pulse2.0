import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function GeofenceAlertSettings({ companyId }) {
  const [enabled, setEnabled] = useState(true);
  const [notifyRoles, setNotifyRoles] = useState(['company_admin', 'hr_manager']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [companyId]);

  const loadSettings = async () => {
    const settings = await base44.entities.CompanySettings.filter({
      company_id: companyId
    });
    
    if (settings[0]) {
      setEnabled(settings[0].geofence_alerts_enabled !== false);
      setNotifyRoles(settings[0].geofence_alert_notify_roles || ['company_admin', 'hr_manager']);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = await base44.entities.CompanySettings.filter({
        company_id: companyId
      });

      if (settings[0]) {
        await base44.entities.CompanySettings.update(settings[0].id, {
          geofence_alerts_enabled: enabled,
          geofence_alert_notify_roles: notifyRoles
        });
      } else {
        await base44.entities.CompanySettings.create({
          company_id: companyId,
          geofence_alerts_enabled: enabled,
          geofence_alert_notify_roles: notifyRoles
        });
      }

      toast.success('Impostazioni salvate');
    } catch (err) {
      toast.error('Errore: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Alert Geofence
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Configura notifiche per clock-in fuori dal perimetro aziendale
        </p>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Abilita alert geofence
          </label>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
              enabled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notifica a questi ruoli
            </label>
            <div className="space-y-2">
              {['company_admin', 'hr_manager'].map(role => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={notifyRoles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNotifyRoles([...notifyRoles, role]);
                      } else {
                        setNotifyRoles(notifyRoles.filter(r => r !== role));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-slate-700">
                    {role === 'company_admin' ? 'Admin Aziendali' : 'HR Manager'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
      </button>
    </div>
  );
}