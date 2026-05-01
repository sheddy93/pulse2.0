import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Check, X, Loader2, Unlink } from "lucide-react";

export default function CalendarSyncSettings({ employeeId, userEmail }) {
  const [syncs, setSyncs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    const loadSyncs = async () => {
      const data = await base44.entities.CalendarSync.filter({
        employee_id: employeeId
      });
      setSyncs(data);
      setLoading(false);
    };
    loadSyncs();
  }, [employeeId]);

  const handleConnect = async (provider) => {
    setConnecting(provider);
    try {
      // Get OAuth URL from connector
      let connectUrl;
      if (provider === 'google') {
        connectUrl = await base44.connectors.getAppUserConnectorURL('google_calendar_sync');
      } else if (provider === 'outlook') {
        connectUrl = await base44.connectors.getAppUserConnectorURL('outlook_calendar_sync');
      }

      // Open OAuth flow in popup
      const popup = window.open(connectUrl, '_blank', 'width=500,height=600');
      
      // Poll for completion
      const timer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          // Reload syncs after OAuth completes
          const data = await base44.entities.CalendarSync.filter({
            employee_id: employeeId
          });
          setSyncs(data);
          setConnecting(null);
        }
      }, 500);
    } catch (error) {
      console.error('Connection failed:', error);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (syncId) => {
    await base44.entities.CalendarSync.update(syncId, { is_active: false });
    setSyncs(syncs.filter(s => s.id !== syncId));
  };

  const handleToggleSyncType = async (syncId, syncType) => {
    const sync = syncs.find(s => s.id === syncId);
    const types = sync.sync_types || [];
    const updated = types.includes(syncType)
      ? types.filter(t => t !== syncType)
      : [...types, syncType];
    
    await base44.entities.CalendarSync.update(syncId, {
      sync_types: updated
    });

    setSyncs(syncs.map(s => 
      s.id === syncId ? { ...s, sync_types: updated } : s
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600 mb-4">
        Sincronizza turni, ferie e scadenze con Google Calendar o Outlook.
      </div>

      {syncs.length === 0 ? (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 text-center space-y-4">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <p className="font-medium text-slate-700 mb-4">Nessun calendario sincronizzato</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleConnect('google')}
                disabled={connecting === 'google'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {connecting === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Google Calendar
              </button>
              <button
                onClick={() => handleConnect('outlook')}
                disabled={connecting === 'outlook'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {connecting === 'outlook' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Outlook Calendar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {syncs.map(sync => (
            <div key={sync.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-slate-800">{sync.calendar_name || sync.calendar_id}</h3>
                  <p className="text-xs text-slate-500">{sync.calendar_provider === 'google' ? 'Google Calendar' : 'Outlook'}</p>
                </div>
                <button
                  onClick={() => handleDisconnect(sync.id)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold flex items-center gap-1"
                >
                  <Unlink className="w-4 h-4" />
                  Disconnetti
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Sincronizza:</label>
                <div className="space-y-2">
                  {['shifts', 'leaves', 'deadlines'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(sync.sync_types || []).includes(type)}
                        onChange={() => handleToggleSyncType(sync.id, type)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">
                        {type === 'shifts' ? 'Turni' : type === 'leaves' ? 'Ferie e permessi' : 'Scadenze documenti'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {sync.last_sync && (
                <p className="text-xs text-slate-500 mt-3">
                  Ultima sincronizzazione: {new Date(sync.last_sync).toLocaleDateString('it-IT', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          ))}

          {syncs.length > 0 && (
            <button
              onClick={() => handleConnect('google')}
              disabled={connecting !== null}
              className="w-full px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              + Aggiungi altro calendario
            </button>
          )}
        </div>
      )}
    </div>
  );
}