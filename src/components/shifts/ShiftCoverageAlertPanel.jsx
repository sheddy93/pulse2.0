import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Check, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ShiftCoverageAlertPanel({ companyId, onAlertResolved }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [notes, setNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [companyId]);

  const loadAlerts = async () => {
    const data = await base44.entities.ShiftCoverageAlert.filter({
      company_id: companyId,
      status: 'pending'
    });
    setAlerts(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setLoading(false);
  };

  const handleResolve = async (alertId) => {
    setResolving(true);
    const user = await base44.auth.me();
    
    await base44.entities.ShiftCoverageAlert.update(alertId, {
      status: 'resolved',
      resolution_notes: notes,
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString()
    });

    setNotes('');
    setSelectedAlert(null);
    await loadAlerts();
    setResolving(false);
    onAlertResolved?.();
  };

  if (loading) {
    return <div className="p-4 text-slate-400">Caricamento...</div>;
  }

  const severityIcons = { high: '🔴', medium: '🟡', low: '🟢' };
  const alertTypeLabels = {
    overlap: 'Sovrapposizione Turni',
    uncovered: 'Turno Scoperto',
    low_coverage: 'Copertura Insufficiente'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <AlertCircle className="w-4 h-4 text-orange-500" />
        Alert Turni in Sospeso ({alerts.length})
      </div>

      {alerts.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700">
          ✅ Tutti i turni sono coperti
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                alert.severity === 'high'
                  ? 'bg-red-50 border-red-200'
                  : alert.severity === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {severityIcons[alert.severity]} {alertTypeLabels[alert.alert_type]}
                  </h3>
                  <div className="space-y-1 mt-2 text-sm opacity-80">
                    <div>📅 {format(new Date(alert.alert_date), 'dd MMM yyyy', { locale: it })}</div>
                    <div>⏰ {alert.start_time} - {alert.end_time}</div>
                    {alert.alert_type === 'low_coverage' && (
                      <div>👥 Copertura: {alert.current_coverage}/{alert.required_coverage}</div>
                    )}
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
              <h2 className="text-lg font-bold text-slate-800">Risolvi Alert</h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <div>
                <strong>Tipo:</strong> {alertTypeLabels[selectedAlert.alert_type]}
              </div>
              <div>
                <strong>Data:</strong> {format(new Date(selectedAlert.alert_date), 'dd MMM yyyy', { locale: it })}
              </div>
              <div>
                <strong>Orario:</strong> {selectedAlert.start_time} - {selectedAlert.end_time}
              </div>
              <div>
                <strong>Sede:</strong> {selectedAlert.location_name}
              </div>
              {selectedAlert.alert_type === 'low_coverage' && (
                <div>
                  <strong>Copertura:</strong> {selectedAlert.current_coverage}/{selectedAlert.required_coverage}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Note di Risoluzione</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Come hai risolto questo alert?"
              />
            </div>

            <button
              onClick={() => handleResolve(selectedAlert.id)}
              disabled={resolving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {resolving ? 'Risoluzione in corso...' : 'Segna come Risolto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}