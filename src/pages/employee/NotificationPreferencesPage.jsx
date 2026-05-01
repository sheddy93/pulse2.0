/**
 * Notification Preferences
 * Gestisci preferenze notifiche push e email
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Bell, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user?.email]);

  const loadPreferences = async () => {
    try {
      if (!user?.email) return;
      const existing = await base44.entities.NotificationPreference.filter({
        user_email: user.email
      });

      if (existing[0]) {
        setPrefs(existing[0]);
      } else {
        // Create default preferences
        const newPrefs = await base44.entities.NotificationPreference.create({
          user_email: user.email,
          company_id: user.company_id,
          push_enabled: true,
          email_enabled: true,
          notification_types: {
            leave_request: true,
            approval_pending: true,
            document_signature: true,
            attendance_alert: true,
            payroll_available: true,
            message: true,
            announcement: true,
            overtime_approval: true
          }
        });
        setPrefs(newPrefs);
      }
    } catch (error) {
      toast.error('Error loading preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!prefs?.id) return;
    setSaving(true);
    try {
      await base44.entities.NotificationPreference.update(prefs.id, prefs);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prefs) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Notification Preferences</h1>

        {/* Push Notifications */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Push Notifications</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-700">Enable push notifications</span>
            <Switch
              checked={prefs.push_enabled}
              onChange={(checked) => setPrefs({...prefs, push_enabled: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-700">Email digest</span>
            <select
              value={prefs.email_digest || 'instant'}
              onChange={(e) => setPrefs({...prefs, email_digest: e.target.value})}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <h2 className="font-semibold text-slate-900">Notification Types</h2>
          <div className="space-y-3">
            {Object.entries(prefs.notification_types || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                <Switch
                  checked={value}
                  onChange={(checked) => setPrefs({
                    ...prefs,
                    notification_types: {...prefs.notification_types, [key]: checked}
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h2 className="font-semibold text-slate-900">Quiet Hours</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-700">Enable quiet hours</span>
            <Switch
              checked={prefs.quiet_hours?.enabled || false}
              onChange={(checked) => setPrefs({
                ...prefs,
                quiet_hours: {...prefs.quiet_hours, enabled: checked}
              })}
            />
          </div>
          {prefs.quiet_hours?.enabled && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600">Start time</label>
                <Input
                  type="time"
                  value={prefs.quiet_hours?.start_time || '22:00'}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    quiet_hours: {...prefs.quiet_hours, start_time: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">End time</label>
                <Input
                  type="time"
                  value={prefs.quiet_hours?.end_time || '08:00'}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    quiet_hours: {...prefs.quiet_hours, end_time: e.target.value}
                  })}
                />
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-blue-600">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </AppShell>
  );
}