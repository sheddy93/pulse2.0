import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Clock, MapPin, CheckCircle2, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function GeofenceAlertPanel({ companyId, onAlertReviewed }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [companyId]);

  const loadAlerts = async () => {
    const data = await base44.entities.OutOfGeofenceAlert.filter({
      company_id: companyId,
      status: 'pending'
    });
    setAlerts(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    setLoading(false);
  };

  const handleApprove = async (alertId) => {
    setReviewing(true);
    const user = await base44.auth.me();
    
    await base44.entities.OutOfGeofenceAlert.update(alertId, {
      status: 'approved',
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      notes: reviewNotes
    });

    setReviewNotes('');
    setSelectedAlert(null);
    await loadAlerts();
    setReviewing(false);
    onAlertReviewed?.();
  };

  const handleReject = async (alertId) => {
    setReviewing(true);
    const user = await base44.auth.me();
    
    await base44.entities.OutOfGeofenceAlert.update(alertId, {
      status: 'rejected',
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      notes: reviewNotes
    });

    setReviewNotes('');
    setSelectedAlert(null);
    await loadAlerts();
    setReviewing(false);
    onAlertReviewed?.();
  };

  if (loading) return <div className="p-4 text-slate-400">Caricamento...</div>;

  const severityColors = {
    high: 'bg-red-50 border-red-200 text-red-700',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    low: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  const severityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <AlertCircle className="w-4 h-4 text-orange-500" />
        Alert Geofence in Sospeso ({alerts.length})
      </div>

      {alerts.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700">
          ✅ Nessun alert geofence
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${severityColors[alert.severity] || severityColors.medium}`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    {severityEmojis[alert.severity]} {alert.employee_name}
                  </h3>
                  <div className="space-y-1 mt-2 text-sm opacity-80">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> {alert.location_name} ({alert.distance_from_geofence_meters}m)
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {format(new Date(alert.timestamp), 'HH:mm', { locale: it })}
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1 bg-white/60 hover:bg-white rounded text-sm font-medium">
                  Rivedi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Revisione */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Revisione Alert</h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <div><strong>Dipendente:</strong> {selectedAlert.employee_name}</div>
              <div><strong>Sede:</strong> {selectedAlert.location_name}</div>
              <div><strong>Distanza:</strong> {selectedAlert.distance_from_geofence_meters}m</div>
              <div><strong>Severità:</strong> {selectedAlert.severity.toUpperCase()}</div>
              <div><strong>Ora:</strong> {format(new Date(selectedAlert.timestamp), 'dd MMM HH:mm', { locale: it })}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Note di revisione</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Aggiungi note sulla revisione..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReject(selectedAlert.id)}
                disabled={reviewing}
                className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 inline mr-2" /> Rifiuta
              </button>
              <button
                onClick={() => handleApprove(selectedAlert.id)}
                disabled={reviewing}
                className="flex-1 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 inline mr-2" /> Approva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}