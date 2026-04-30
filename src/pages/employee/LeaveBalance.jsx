import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const LEAVE_COLORS = {
  ferie: "bg-blue-200",
  permesso: "bg-yellow-200",
  malattia: "bg-red-200",
  extra: "bg-green-200"
};

const TYPE_LABELS = {
  ferie: "Ferie",
  permesso: "Permesso",
  malattia: "Malattia",
  extra: "Straordinario"
};

export default function LeaveBalance() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const ANNUAL_LEAVE_DAYS = 20;

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0];
      setEmployee(emp);

      if (emp) {
        const allLeaves = await base44.entities.LeaveRequest.filter({
          employee_id: emp.id,
          status: { $in: ["manager_approved", "approved"] }
        });
        setLeaves(allLeaves);
      }
    }).finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const approvedLeaveDays = leaves
    .filter(l => ["manager_approved", "approved"].includes(l.status))
    .reduce((sum, l) => sum + (l.days_count || 0), 0);

  const usedDays = approvedLeaveDays;
  const remainingDays = ANNUAL_LEAVE_DAYS - usedDays;
  const usagePercentage = (usedDays / ANNUAL_LEAVE_DAYS) * 100;

  const isLeaveDay = (day) => {
    return leaves.some(leave => {
      const startDate = parseISO(leave.start_date);
      const endDate = parseISO(leave.end_date);
      return day >= startDate && day <= endDate && ["manager_approved", "approved"].includes(leave.status);
    });
  };

  const getLeaveType = (day) => {
    const leave = leaves.find(leave => {
      const startDate = parseISO(leave.start_date);
      const endDate = parseISO(leave.end_date);
      return day >= startDate && day <= endDate && ["manager_approved", "approved"].includes(leave.status);
    });
    return leave?.leave_type;
  };

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Saldo Ferie</h1>
          <p className="text-sm text-slate-500">Visualizza i tuoi giorni di ferie e le date approvate</p>
        </div>

        {/* Saldo Annuale */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Saldo Annuale 2026</h2>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Giorni Utilizzati</span>
                <span className="text-sm font-bold text-slate-800">{usedDays} / {ANNUAL_LEAVE_DAYS}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{usagePercentage.toFixed(0)}% utilizzato</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Giorni Residui</p>
                <p className="text-3xl font-bold text-emerald-600">{remainingDays}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Giorni Utilizzati</p>
                <p className="text-3xl font-bold text-blue-600">{usedDays}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-800">Calendario {format(currentMonth, "MMMM yyyy", { locale: it })}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Oggi
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Giorni Settimana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Griglia Giorni */}
          <div className="grid grid-cols-7 gap-2">
            {/* Giorni vuoti inizio mese */}
            {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Giorni del mese */}
            {daysInMonth.map(day => {
              const isLeave = isLeaveDay(day);
              const leaveType = getLeaveType(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium border-2 ${
                    isLeave
                      ? `${LEAVE_COLORS[leaveType]} border-slate-300`
                      : isToday
                      ? "bg-slate-100 border-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                  title={isLeave ? TYPE_LABELS[leaveType] : ""}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-100">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${LEAVE_COLORS[key]}`} />
                <span className="text-xs font-medium text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dettagli Approvate */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Giorni Approvati</h2>

          {leaves.length === 0 ? (
            <p className="text-sm text-slate-400">Nessun giorno di ferie approvato</p>
          ) : (
            <div className="space-y-2">
              {leaves
                .filter(l => ["manager_approved", "approved"].includes(l.status))
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                .map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {format(new Date(leave.start_date), "d MMM", { locale: it })} → {format(new Date(leave.end_date), "d MMM yyyy", { locale: it })}
                      </p>
                      <p className="text-xs text-slate-600">{TYPE_LABELS[leave.leave_type]} • {leave.days_count} giorni</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                      ✓ Approvato
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}