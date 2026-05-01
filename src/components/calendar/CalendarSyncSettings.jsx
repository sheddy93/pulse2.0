/**
 * CalendarSyncSettings.jsx
 * =======================
 * Pannello di controllo per sincronizzazione Google Calendar
 * 
 * Permette a dipendenti di:
 * - Connettere/disconnettere Google Calendar
 * - Sincronizzare manualmente
 * - Visualizzare stato sincronizzazione
 * - Vedere eventi sincronizzati
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Check, AlertCircle, Loader, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CalendarSyncSettings({ employeeId, employeeEmail }) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncRecord, setSyncRecord] = useState(null);
  const [stats, setStats] = useState({
    leaves: 0,
    shifts: 0,
    documents: 0,
  });

  // Carica stato sincronizzazione
  useEffect(() => {
    const loadSync = async () => {
      try {
        const result = await base44.entities.GoogleCalendarSync.filter({
          employee_id: employeeId,
        });

        if (result.length > 0) {
          const record = result[0];
          setSyncRecord(record);
          
          // Calcola statistiche
          setStats({
            leaves: record.synced_events?.leave_requests?.length || 0,
            shifts: record.synced_events?.shifts?.length || 0,
            documents: record.synced_events?.documents?.length || 0,
          });
        }
      } catch (err) {
        console.error('Error loading sync state:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSync();
  }, [employeeId]);

  // Sincronizzazione manuale
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncCalendarWithGoogle', {
        employee_id: employeeId,
      });

      if (response.data?.success) {
        toast.success(
          `Sincronizzazione completata: ${response.data.synced.leaves} ferie, ` +
          `${response.data.synced.shifts} turni, ${response.data.synced.documents} scadenze`
        );
        
        // Ricarica stato
        const result = await base44.entities.GoogleCalendarSync.filter({
          employee_id: employeeId,
        });
        if (result.length > 0) {
          setSyncRecord(result[0]);
        }
      } else {
        toast.error(response.data?.error || 'Errore nella sincronizzazione');
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Errore: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Disconnetti Google Calendar
  const handleDisconnect = async () => {
    if (!confirm('Sei sicuro? Questo non eliminerà gli eventi da Google Calendar.')) {
      return;
    }

    try {
      setLoading(true);
      if (syncRecord?.id) {
        await base44.entities.GoogleCalendarSync.update(syncRecord.id, {
          is_active: false,
        });
        setSyncRecord({ ...syncRecord, is_active: false });
        toast.success('Sincronizzazione disattivata');
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast.error('Errore nella disconnessione');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Loader className="w-4 h-4 animate-spin" />
          Caricamento...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      {syncRecord?.is_active ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900">Sincronizzazione Attiva</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Ferie, turni e scadenze vengono sincronizzati automaticamente con Google Calendar
              </p>
              {syncRecord?.last_sync && (
                <p className="text-xs text-emerald-600 mt-2">
                  Ultima sincronizzazione: {new Date(syncRecord.last_sync).toLocaleDateString('it-IT')}
                </p>
              )}
            </div>
          </div>

          {/* Statistiche */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-600">{stats.leaves}</p>
              <p className="text-xs text-slate-600">Ferie</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-2xl font-bold text-blue-600">{stats.shifts}</p>
              <p className="text-xs text-slate-600">Turni</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-2xl font-bold text-red-600">{stats.documents}</p>
              <p className="text-xs text-slate-600">Scadenze</p>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex gap-3 pt-3 border-t border-emerald-200">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sincronizzazione...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Sincronizza ora
                </>
              )}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={syncing}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Info */}
          <div className="bg-white rounded-lg p-3 border border-emerald-100 space-y-2">
            <p className="text-xs font-semibold text-slate-700">ℹ️ Come funziona</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <strong>Ferie approvate</strong> → Evento tutto il giorno in Google Calendar</li>
              <li>• <strong>Turni</strong> → Evento con orari specifici (mattina, pomeriggio, ecc)</li>
              <li>• <strong>Scadenze</strong> → Documenti in scadenza entro 30 giorni con promemoria</li>
              <li>• <strong>Aggiornamenti automatici</strong> → Sincronizzazione ogni ora</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings2 className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Sincronizzazione Non Attiva</h3>
              <p className="text-sm text-slate-600 mt-1">
                Connetti Google Calendar per visualizzare ferie, turni e scadenze direttamente nel tuo calendario
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {syncing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Connessione in corso...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Attiva sincronizzazione
              </>
            )}
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Assicurati di avere l'accesso a Google Calendar e che il tuo account sia configurato
            </p>
          </div>
        </div>
      )}

      {/* Errori sincronizzazione */}
      {syncRecord?.sync_errors && syncRecord.sync_errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="font-semibold text-red-900 text-sm">Errori nella sincronizzazione</p>
          </div>
          <ul className="text-xs text-red-700 space-y-1">
            {syncRecord.sync_errors.slice(-3).map((err, i) => (
              <li key={i}>
                • {new Date(err.timestamp).toLocaleTimeString('it-IT')} - {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}