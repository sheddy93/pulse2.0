import { useState, useEffect } from 'react';
// Migration: removed base44 dependency
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import OfflineStatus from "@/components/attendance/OfflineStatus";
import QuickAttendanceButton from "@/components/attendance/QuickAttendanceButton";
import AttendanceSummaryMobile from "@/components/attendance/AttendanceSummaryMobile";
import BiometricButton from "@/components/attendance/BiometricButton";
import { toast } from 'sonner';
import { Clock, LogIn, LogOut, Coffee } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { saveTimeEntryOffline, syncOfflineTimeEntries, getPendingTimeEntries, cleanupSyncedEntries } from "@/lib/pwa-utils";
import { registerDeviceToken, setupOfflineSyncHandler } from "@/lib/firebaseMessaging";

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
    // TODO: Replace with service.TimeEntry.filter({ user_email: me.email })
    setEntries([]);
  };

  useEffect(() => {
    const init = async () => {
      try {
        // TODO: Replace with authService.me() and service calls for employee/location
        const me = { email: 'user@example.com' }; // Placeholder
        
        // Carica timbrature in sospeso offline
        const pending = await getPendingTimeEntries();
        setPendingCount(pending.length);

        // Registra device token Firebase
        await registerDeviceToken(me.email);

        // Setup offline sync handler
        setupOfflineSyncHandler();

        // Sincronizza se online
        if (navigator.onLine) {
          await syncEntries(me);
        }
      } finally {
        setLoading(false);
      }
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
    // TODO: Replace with service call to sync offline entries
    const result = { synced: 0 };
    if (result.synced > 0) {
      await cleanupSyncedEntries();
      await loadEntries(me);
      const pending = await getPendingTimeEntries();
      setPendingCount(pending.length);
    }
    setIsSyncing(false);
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntries = entries.filter(e => e.timestamp?.startsWith(today)).sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
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
          // TODO: Replace with service.TimeEntry.create()
       } else {
           // Offline: salva in IndexedDB
           await saveTimeEntryOffline(entry);
           setPendingCount(prev => prev + 1);
        }

        // Aggiungi entry alla lista locale per UI istantanea
        setEntries(prev => [entry, ...prev]);
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
      <div className="p-3 md:p-6 max-w-3xl mx-auto space-y-4 pb-20">
        <h1 className="text-2xl font-bold text-slate-800">Timbratura</h1>

        {/* Mobile Summary Card */}
        <AttendanceSummaryMobile 
          todayEntries={todayEntries} 
          lastEntry={lastEntry} 
          pendingCount={pendingCount} 
        />

        {/* Biometric Button - Top Priority */}
        <BiometricButton
          onSuccess={async (biometricData) => {
            try {
              // TODO: Replace with service call to verifyBiometric
              // await biometricService.verify(biometricData, 'check_in');
              await handleStamp('check_in');
              toast.success('Timbrato con successo! ✅');
            } catch (error) {
              toast.error('Errore timbratura: ' + error.message);
            }
          }}
          onError={(error) => {
            toast.error('Biometric error: ' + error);
          }}
          disabled={stamping !== null}
        />

        {/* Quick Action Buttons - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          <QuickAttendanceButton 
            type="check_in" 
            onClick={() => handleStamp("check_in")}
            loading={stamping === "check_in"}
            disabled={stamping !== null}
          />
          <QuickAttendanceButton 
            type="check_out" 
            onClick={() => handleStamp("check_out")}
            loading={stamping === "check_out"}
            disabled={stamping !== null}
          />
          <QuickAttendanceButton 
            type="break_start" 
            onClick={() => handleStamp("break_start")}
            loading={stamping === "break_start"}
            disabled={stamping !== null}
          />
          <QuickAttendanceButton 
            type="break_end" 
            onClick={() => handleStamp("break_end")}
            loading={stamping === "break_end"}
            disabled={stamping !== null}
          />
        </div>

        {/* History */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">Storico</h2>
          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-8 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Nessuna timbratura ancora</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, dayEntries]) => (
              <div key={date} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">{format(new Date(date), "dd MMM", { locale: it })}</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {dayEntries.map(e => {
                    const cfg = TYPES[e.type] || { label: e.type, color: "text-slate-500 bg-slate-100", icon: Clock };
                    const Icon = cfg.icon;
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-3 py-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <p className="flex-1 text-sm font-medium text-slate-700">{cfg.label}</p>
                        <p className="text-sm font-mono font-bold text-slate-800">{format(new Date(e.timestamp), "HH:mm")}</p>
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