import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Clock, LogIn, LogOut, Coffee, CalendarDays, FileText, Award, MapPin, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import GPSValidator from "@/components/attendance/GPSValidator";

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayEntries, setTodayEntries] = useState([]);
  const [stamping, setStamping] = useState(null);
  const [gpsPosition, setGpsPosition] = useState(null);
  const [location, setLocation] = useState(null);

  const loadTodayEntries = async (me) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const entries = await base44.entities.TimeEntry.filter({ user_email: me.email });
    setTodayEntries(entries.filter(e => e.timestamp?.startsWith(today)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      setEmployee(emps[0] || null);
      await loadTodayEntries(me);

      // Carica location primaria se esiste
      if (emps[0]) {
        const locs = await base44.entities.CompanyLocation.filter({
          company_id: emps[0].company_id,
          is_primary: true
        });
        setLocation(locs[0] || null);
      }
    }).finally(() => setLoading(false));
  }, []);

  const lastEntry = todayEntries[0];
  const isClockedIn = lastEntry?.type === "check_in" || lastEntry?.type === "break_end";
  const isOnBreak = lastEntry?.type === "break_start";

  const handleStamp = async (type) => {
    if (!employee || !user) return;
    setStamping(type);
    try {
      await base44.entities.TimeEntry.create({
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        company_id: employee.company_id,
        user_email: user.email,
        timestamp: new Date().toISOString(),
        type,
        latitude: gpsPosition?.latitude,
        longitude: gpsPosition?.longitude,
        location: location?.name,
      });
      await loadTodayEntries(user);
      setGpsPosition(null);
    } finally {
      setStamping(null);
    }
  };

  if (loading) return <PageLoader color="green" />;

  const STAMP_BTNS = [
    { type: "check_in", label: "Entra", icon: LogIn, color: "bg-emerald-600 hover:bg-emerald-700 text-white", enabled: !isClockedIn && !isOnBreak },
    { type: "check_out", label: "Esci", icon: LogOut, color: "bg-slate-700 hover:bg-slate-800 text-white", enabled: isClockedIn },
    { type: "break_start", label: "Pausa", icon: Coffee, color: "bg-orange-500 hover:bg-orange-600 text-white", enabled: isClockedIn },
    { type: "break_end", label: "Fine pausa", icon: Clock, color: "bg-blue-500 hover:bg-blue-600 text-white", enabled: isOnBreak },
  ];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ciao, {employee?.first_name || user?.full_name || "Dipendente"} 👋</h1>
          <p className="text-sm text-slate-500">{format(new Date(), "EEEE d MMMM yyyy", { locale: it })}</p>
        </div>

        {/* GPS Validator se location esiste */}
        {location && (
          <GPSValidator 
            location={location}
            onValidated={setGpsPosition}
            disabled={stamping !== null}
          />
        )}

        {/* Timbratura hero con stato GPS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-3 h-3 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : isOnBreak ? "bg-orange-400 animate-pulse" : "bg-slate-300"}`} />
            <p className="font-semibold text-slate-700">
              {isClockedIn ? "Sei in servizio" : isOnBreak ? "Sei in pausa" : "Non ancora timbrato oggi"}
            </p>
            {lastEntry && (
              <span className="ml-auto text-xs text-slate-400">
                Ultima: {format(new Date(lastEntry.timestamp), "HH:mm")}
              </span>
            )}
          </div>

          {/* GPS Status */}
          {location && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              gpsPosition 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                : "bg-orange-50 border border-orange-200 text-orange-700"
            }`}>
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {gpsPosition 
                ? `✓ Posizione verificata a ${location.name}` 
                : `⚠ Verifica la tua posizione prima di timbrare`
              }
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STAMP_BTNS.map(({ type, label, icon: Icon, color, enabled }) => {
              const needsGps = location && (type === "check_in" || type === "check_out");
              const canStamp = !needsGps || gpsPosition;
              return (
                <button
                  key={type}
                  onClick={() => handleStamp(type)}
                  disabled={!enabled || stamping === type || !canStamp}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${color}`}
                >
                  <Icon className="w-6 h-6" />
                  {stamping === type ? "..." : label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resoconto Timbrature Oggi */}
        <AttendanceSummary entries={todayEntries} />

        {/* Quick links */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Link to="/dashboard/employee/leave" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><CalendarDays className="w-5 h-5 text-blue-600" /></div>
            <div><p className="font-semibold text-slate-800">Ferie</p><p className="text-xs text-slate-500">Richiedi</p></div>
          </Link>
          <Link to="/dashboard/employee/calendar" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-purple-600" /></div>
            <div><p className="font-semibold text-slate-800">Calendario</p><p className="text-xs text-slate-500">Presenze</p></div>
          </Link>
          <Link to="/dashboard/employee/documents" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="font-semibold text-slate-800">Documenti</p><p className="text-xs text-slate-500">Firma</p></div>
          </Link>
          <Link to="/dashboard/employee/skills" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-violet-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center"><Award className="w-5 h-5 text-violet-600" /></div>
            <div><p className="font-semibold text-slate-800">Competenze</p><p className="text-xs text-slate-500">Skills</p></div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}