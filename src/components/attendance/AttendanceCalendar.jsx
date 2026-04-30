import { useState, useEffect } from "react";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const BADGES = {
  present: { label: "Presente", color: "bg-emerald-500", icon: "✓" },
  holiday: { label: "Ferie", color: "bg-blue-500", icon: "🏖️" },
  permission: { label: "Permesso", color: "bg-orange-500", icon: "📋" },
  sick_leave: { label: "Malattia", color: "bg-red-500", icon: "🤒" },
  absent: { label: "Assente", color: "bg-slate-400", icon: "✗" },
  weekend: { label: "Weekend", color: "bg-slate-200", icon: "" },
};

export default function AttendanceCalendar({ employeeId, companyId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [employeeId, currentDate]);

  const loadData = async () => {
    if (!employeeId || !companyId) return;
    
    setLoading(true);
    const [entries, leaves] = await Promise.all([
      base44.entities.TimeEntry.filter({ employee_id: employeeId }),
      base44.entities.LeaveRequest.filter({ 
        employee_id: employeeId,
        status: { $in: ["manager_approved", "approved"] }
      })
    ]);
    
    setTimeEntries(entries);
    setLeaveRequests(leaves);
    setLoading(false);
  };

  const getDayStatus = (day) => {
    const dateStr = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), "yyyy-MM-dd");
    const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) return "weekend";

    // Controlla leave requests
    const leave = leaveRequests.find(l => {
      const startDate = l.start_date;
      const endDate = l.end_date;
      return dateStr >= startDate && dateStr <= endDate;
    });

    if (leave) {
      if (leave.leave_type === "ferie") return "holiday";
      if (leave.leave_type === "permesso") return "permission";
      if (leave.leave_type === "malattia") return "sick_leave";
    }

    // Controlla presenze
    const dayEntries = timeEntries.filter(e => e.timestamp?.startsWith(dateStr));
    if (dayEntries.length > 0) {
      const hasCheckIn = dayEntries.some(e => e.type === "check_in");
      return hasCheckIn ? "present" : "absent";
    }

    // Nessun dato
    return "absent";
  };

  const monthStart = startOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = monthStart.getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => null);
  const calendarDays = [...emptyDays, ...days];

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      {/* Header con navigazione */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Calendario Presenze</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-sm font-semibold text-slate-800 min-w-32 text-center">
            {format(currentDate, "MMMM yyyy", { locale: it })}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-4 border-b border-slate-100">
        {Object.entries(BADGES).map(([key, badge]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${badge.color}`} />
            <span className="text-xs text-slate-600">{badge.label}</span>
          </div>
        ))}
      </div>

      {/* Griglia giorni della settimana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-slate-600">
            {day}
          </div>
        ))}
      </div>

      {/* Griglia calendario */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 auto-rows-min">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-20" />;

            const status = getDayStatus(day);
            const badge = BADGES[status];

            return (
              <div
                key={day}
                className={`h-20 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                  status === "weekend"
                    ? "bg-slate-50 border-slate-200"
                    : `${badge.color} border-transparent`
                }`}
              >
                <span className={`text-xs font-bold ${status === "weekend" ? "text-slate-600" : "text-white"}`}>
                  {day}
                </span>
                <span className="text-lg">{badge.icon}</span>
                <span className={`text-xs font-semibold ${status === "weekend" ? "text-slate-600" : "text-white"}`}>
                  {badge.label.length > 7 ? badge.label.slice(0, 7) : badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}