import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/layout/StatCard";
import PageLoader from "@/components/layout/PageLoader";
import { Clock, CalendarDays, FileText, LogIn, LogOut, CheckCircle2 } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import UpcomingShifts from "@/components/employee/UpcomingShifts";

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [monthEntries, setMonthEntries] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stamping, setStamping] = useState(false);

  const loadAll = async (me) => {
    const [emps, entries, leaveReqs] = await Promise.all([
      base44.entities.EmployeeProfile.filter({ user_email: me.email }),
      base44.entities.TimeEntry.filter({ user_email: me.email }),
      base44.entities.LeaveRequest.filter({ employee_email: me.email }),
    ]);
    const emp = emps[0] || null;
    setEmployee(emp);
    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    setTodayEntries(entries.filter(e => e.timestamp?.startsWith(today)));
    setMonthEntries(entries.filter(e => e.timestamp >= monthStart));
    setRecentEntries([...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5));
    setLeaves(leaveReqs);
  };

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      await loadAll(me);
    }).finally(() => setLoading(false));
  }, []);

  const lastEntry = todayEntries[todayEntries.length - 1];
  const isClockedIn = lastEntry?.type === "check_in" || lastEntry?.type === "break_end";
  const firstIn = todayEntries.find(e => e.type === "check_in");

  const handleStamp = async () => {
    if (!employee || !user || stamping) return;
    setStamping(true);
    await base44.entities.TimeEntry.create({
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      company_id: employee.company_id,
      user_email: user.email,
      timestamp: new Date().toISOString(),
      type: isClockedIn ? "check_out" : "check_in",
    });
    await loadAll(user);
    setStamping(false);
  };

  // Calculate hours today
  const ins = todayEntries.filter(e => e.type === "check_in");
  const outs = todayEntries.filter(e => e.type === "check_out");
  let hoursToday = "0h";
  if (ins.length && outs.length) {
    const ms = new Date(outs[outs.length - 1].timestamp) - new Date(ins[0].timestamp);
    hoursToday = `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  // Days present this month (days with at least one check_in)
  const daysPresent = new Set(monthEntries.filter(e => e.type === "check_in").map(e => e.timestamp?.split("T")[0])).size;

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-0.5">
            Ciao, {employee?.first_name || user?.full_name?.split(" ")[0] || "👋"}
          </h1>
          <p className="text-emerald-200 text-sm mb-5">{format(new Date(), "EEEE d MMMM yyyy", { locale: it })}</p>

          <div className="bg-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              {firstIn ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Entrata registrata alle <strong>{format(new Date(firstIn.timestamp), "HH:mm")}</strong></span>
                </div>
              ) : (
                <p className="text-sm text-emerald-200">Non hai ancora timbrato oggi.</p>
              )}
              <p className="text-xs text-emerald-300 mt-1">
                {isClockedIn ? "● In servizio" : lastEntry ? "Uscita registrata" : "Nessuna timbratura oggi"}
              </p>
            </div>
            <button
              onClick={handleStamp}
              disabled={stamping}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex-shrink-0 ${
                isClockedIn ? "bg-white text-emerald-700 hover:bg-emerald-50" : "bg-emerald-500 hover:bg-emerald-400 border border-white/20"
              }`}
            >
              {isClockedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {stamping ? "Attendere..." : isClockedIn ? "Timbra uscita" : "Timbra entrata"}
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Ore oggi" value={hoursToday} icon={Clock} color="green" />
          <StatCard label="Giorni presenti" value={daysPresent} icon={CheckCircle2} color="blue" sub="Questo mese" />
          <StatCard label="Ferie in attesa" value={leaves.filter(l => l.status === "pending").length} icon={CalendarDays} color="orange" />
          <StatCard label="Documenti" value="—" icon={FileText} color="slate" />
        </div>

        {/* Recent timbrature */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Ultime timbrature</h2>
            <Link to="/dashboard/employee/attendance" className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Vai alla timbratura →</Link>
          </div>
          {recentEntries.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nessuna timbratura ancora. Inizia timbrandoti oggi!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEntries.map(e => {
                const typeMap = { check_in: { l: "Entrata", c: "bg-emerald-500" }, check_out: { l: "Uscita", c: "bg-slate-400" }, break_start: { l: "Pausa", c: "bg-orange-400" }, break_end: { l: "Fine pausa", c: "bg-blue-400" } };
                const t = typeMap[e.type] || { l: e.type, c: "bg-slate-400" };
                return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                    <div className={`w-2 h-2 rounded-full ${t.c}`} />
                    <p className="text-sm font-medium text-slate-700 flex-1">{t.l}</p>
                    <p className="text-xs text-slate-400">{format(new Date(e.timestamp), "d MMM, HH:mm", { locale: it })}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming shifts */}
        {employee && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">I tuoi turni settimanali</h2>
            </div>
            <div className="p-5">
              <UpcomingShifts employeeId={employee.id} companyId={employee.company_id} />
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/dashboard/employee/leave" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors group">
            <CalendarDays className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-2 transition-colors" />
            <p className="font-medium text-slate-800 text-sm">Richiedi ferie</p>
            <p className="text-xs text-slate-400 mt-0.5">Gestisci le tue richieste</p>
          </Link>
          <Link to="/dashboard/employee/documents" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors group">
            <FileText className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-2 transition-colors" />
            <p className="font-medium text-slate-800 text-sm">I miei documenti</p>
            <p className="text-xs text-slate-400 mt-0.5">Buste paga e contratti</p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}