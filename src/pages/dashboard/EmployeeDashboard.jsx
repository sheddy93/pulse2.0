import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/layout/StatCard";
import { Clock, CalendarDays, FileText, LogIn, LogOut, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stamping, setStamping] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const [emps, entries, leaveReqs] = await Promise.all([
        base44.entities.EmployeeProfile.filter({ user_email: me.email }),
        base44.entities.TimeEntry.filter({ user_email: me.email }),
        base44.entities.LeaveRequest.filter({ employee_email: me.email }),
      ]);
      const emp = emps[0] || null;
      setEmployee(emp);

      const today = format(new Date(), "yyyy-MM-dd");
      const todayE = entries.filter(e => e.timestamp?.startsWith(today));
      const recent = entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
      setTodayEntries(todayE);
      setRecentEntries(recent);
      setLeaves(leaveReqs);
    }).finally(() => setLoading(false));
  }, []);

  const lastEntry = todayEntries[todayEntries.length - 1];
  const isClockedIn = lastEntry?.type === "check_in" || lastEntry?.type === "break_end";
  const firstIn = todayEntries.find(e => e.type === "check_in");

  const handleStamp = async () => {
    if (!employee || !user) return;
    setStamping(true);
    const type = isClockedIn ? "check_out" : "check_in";
    await base44.entities.TimeEntry.create({
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      company_id: employee.company_id,
      user_email: user.email,
      timestamp: new Date().toISOString(),
      type,
    });
    // Refresh
    const entries = await base44.entities.TimeEntry.filter({ user_email: user.email });
    const today = format(new Date(), "yyyy-MM-dd");
    setTodayEntries(entries.filter(e => e.timestamp?.startsWith(today)));
    setRecentEntries(entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5));
    setStamping(false);
  };

  // Calc ore oggi
  let hoursToday = "0h";
  const ins = todayEntries.filter(e => e.type === "check_in");
  const outs = todayEntries.filter(e => e.type === "check_out");
  if (ins.length && outs.length) {
    const ms = new Date(outs[outs.length - 1].timestamp) - new Date(ins[0].timestamp);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    hoursToday = `${h}h ${m}m`;
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pendingLeaves = leaves.filter(l => l.status === "pending").length;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Hero + Timbratura */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">
            Ciao, {employee?.first_name || user?.full_name?.split(" ")[0] || "👋"}
          </h1>
          <p className="text-emerald-200 text-sm mb-5">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
          </p>

          <div className="bg-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              {firstIn ? (
                <div className="flex items-center gap-2 text-emerald-200 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Entrata registrata alle {format(new Date(firstIn.timestamp), "HH:mm")}</span>
                </div>
              ) : (
                <p className="text-emerald-200 text-sm">Non hai ancora timbrato oggi.</p>
              )}
              <p className="text-xs text-emerald-300 mt-1">
                {isClockedIn ? "Attualmente in servizio" : lastEntry ? "Uscita registrata" : "Nessuna timbratura"}
              </p>
            </div>
            <button
              onClick={handleStamp}
              disabled={stamping}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${
                isClockedIn
                  ? "bg-white text-emerald-700 hover:bg-emerald-50"
                  : "bg-emerald-500 text-white hover:bg-emerald-400 border border-white/20"
              }`}
            >
              {isClockedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {stamping ? "..." : isClockedIn ? "Timbra uscita" : "Timbra entrata"}
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Ore oggi" value={hoursToday} icon={Clock} color="green" />
          <StatCard label="Timbrature oggi" value={todayEntries.length} icon={CheckCircle} color="blue" />
          <StatCard label="Ferie in attesa" value={pendingLeaves} icon={CalendarDays} color="orange" />
          <StatCard label="Documenti" value="—" icon={FileText} color="slate" />
        </div>

        {/* Recent entries */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Ultime timbrature</h2>
            <Link to="/dashboard/employee/history" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Vedi tutte →
            </Link>
          </div>
          {recentEntries.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nessuna timbratura ancora. Inizia timbrandoti oggi!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEntries.map(e => (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full ${e.type === "check_in" ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {e.type === "check_in" ? "Entrata" : e.type === "check_out" ? "Uscita" : e.type === "break_start" ? "Pausa inizio" : "Pausa fine"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(e.timestamp), "d MMM yyyy, HH:mm", { locale: it })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/dashboard/employee/leave" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors group">
            <CalendarDays className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-2 transition-colors" />
            <p className="font-medium text-slate-800">Richiedi ferie</p>
            <p className="text-xs text-slate-400 mt-0.5">Gestisci le tue richieste di assenza</p>
          </Link>
          <Link to="/dashboard/employee/documents" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors group">
            <FileText className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-2 transition-colors" />
            <p className="font-medium text-slate-800">I miei documenti</p>
            <p className="text-xs text-slate-400 mt-0.5">Visualizza buste paga e contratti</p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}