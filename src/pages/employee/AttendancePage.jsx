import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import GPSValidator from "@/components/attendance/GPSValidator";
import OfflineStatus from "@/components/attendance/OfflineStatus";
import { Clock, LogIn, LogOut, Coffee } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { saveTimeEntryOffline, syncOfflineTimeEntries, getPendingTimeEntries, cleanupSyncedEntries } from "@/lib/pwa-utils";

const TYPES = {
  check_in: { label: "Entrata", icon: LogIn, btnLabel: "Timbra entrata", color: "text-emerald-600 bg-emerald-50", enabledWhen: false },
  check_out: { label: "Uscita", icon: LogOut, btnLabel: "Timbra uscita", color: "text-slate-600 bg-slate-100", enabledWhen: true },
  break_start: { label: "Inizio pausa", icon: Coffee, btnLabel: "Inizio pausa", color: "text-orange-500 bg-orange-50", enabledWhen: true },
  break_end: { label: "Fine pausa", icon: Coffee, btnLabel: "Fine pausa", color: "text-blue-500 bg-blue-50", enabledWhen: false },
};

export default function AttendancePage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stamping, setStamping] = useState(null);
  const [location, setLocation] = useState(null);
  const [gpsPosition, setGpsPosition] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadEntries = async (me) => {
    const all = await base44.entities.TimeEntry.filter({ user_email: me.email });
    setEntries([...all].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  useEffect(() => {
    const init = async () => {
      base44.auth.me().then(async (me) => {
        setUser(me);
        const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
        setEmployee(emps[0] || null);
        await loadEntries(me);
        
        // Carica la sede primaria se esiste
        if (emps[0]) {
          const locs = await base44.entities.CompanyLocation.filter({
            company_id: emps[0].company_id,
            is_primary: true
          });
          setLocation(locs[0] || null);
        }

        // Carica timbrature in sospeso offline
        const pending = await getPendingTimeEntries();
        setPendingCount(pending.length);

        // Sincronizza se online
        if (navigator.onLine) {
          await syncEntries(me);
        }
      }).finally(() => setLoading(false));
    };
    init();
  }, []);

  // Ascolta cambio di connettività
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Sincronizza quando torna online
      if (user) {
        await syncEntries(user);
      }
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const syncEntries = async (me) => {
    setIsSyncing(true);
    const result = await syncOfflineTimeEntries(base44);
    if (result.synced > 0) {
      await cleanupSyncedEntries();
      await loadEntries(me);
      const pending = await getPendingTimeEntries();
      setPendingCount(pending.length);
    }
    setIsSyncing(false);
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntries = entries.filter(e => e.timestamp?.startsWith(today));
  const lastEntry = todayEntries[0];
  const isClockedIn = lastEntry?.type === "check_in" || lastEntry?.type === "break_end";

  const handleStamp = async (type) => {
    if (!employee || !user) return;
    setStamping(type);
    
    const entry = {
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      company_id: employee.company_id,
      user_email: user.email,
      timestamp: new Date().toISOString(),
      type,
      latitude: gpsPosition?.latitude,
      longitude: gpsPosition?.longitude,
      location: location?.name,
    };

    try {
       if (isOnline) {
         // Online: salva direttamente al server
         await base44.entities.TimeEntry.create(entry);
         // Piccolo delay per assicurare che il DB ha registrato
         await new Promise(r => setTimeout(r, 500));
       } else {
         // Offline: salva in IndexedDB
         await saveTimeEntryOffline(entry);
         setPendingCount(prev => prev + 1);
       }

       // Aggiungi entry alla lista locale per UI istantanea
       setEntries(prev => [entry, ...prev]);
       
       // Ricarica le timbrature dal server (solo se online)
       if (isOnline) {
         const all = await base44.entities.TimeEntry.filter({ user_email: user.email });
         setEntries([...all].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
       }
       setGpsPosition(null);
     } catch (err) {
       console.error('Errore salvataggio timbratura:', err);
       alert('Errore: Timbratura non salvata. Riprova.');
     } finally {
       setStamping(null);
     }
  };

  const grouped = entries.reduce((acc, e) => {
    const d = e.timestamp?.split("T")[0] || "?";
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <OfflineStatus isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingCount} />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-slate-800">Timbratura</h1>

        {location && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">📍 <strong>Test mode:</strong> GPS disabilitato. Clicca i bottoni per testare le timbrature.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-400 mb-4">{format(new Date(), "EEEE d MMMM yyyy", { locale: it })}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["check_in", "check_out", "break_start", "break_end"]).map((type) => {
              const cfg = TYPES[type];
               const Icon = cfg.icon;
               return (
                 <button key={type} onClick={() => handleStamp(type)} disabled={stamping === type}
                   className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                  <Icon className="w-6 h-6" />
                  {stamping === type ? "..." : cfg.label}
                </button>
              );
            })}
          </div>
          {lastEntry && (
            <p className="text-xs text-slate-400 mt-4 text-center">
              Ultima: <strong>{TYPES[lastEntry.type]?.label}</strong> alle {format(new Date(lastEntry.timestamp), "HH:mm")}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Nessuna timbratura ancora</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, dayEntries]) => (
              <div key={date} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">{format(new Date(date), "EEEE d MMMM yyyy", { locale: it })}</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {dayEntries.map(e => {
                    const cfg = TYPES[e.type] || { label: e.type, color: "text-slate-500 bg-slate-100", icon: Clock };
                    const Icon = cfg.icon;
                    return (
                      <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="flex-1 text-sm font-medium text-slate-700">{cfg.label}</p>
                        <p className="text-sm font-mono text-slate-500">{format(new Date(e.timestamp), "HH:mm")}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}