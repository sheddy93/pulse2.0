import { useState, useEffect } from "react";
import { authService } from '@/services/authService';
import { employeesService } from '@/services/employees.service';
import { attendanceService } from '@/services/attendance.service';
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Clock, LogIn, LogOut, Users, Calendar, Download } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";

const TYPE_LABELS = {
  check_in: { label: "Entrata", color: "bg-emerald-100 text-emerald-700", icon: LogIn },
  check_out: { label: "Uscita", color: "bg-slate-100 text-slate-600", icon: LogOut },
  break_start: { label: "Inizio pausa", color: "bg-orange-100 text-orange-600", icon: Clock },
  break_end: { label: "Fine pausa", color: "bg-blue-100 text-blue-600", icon: Clock },
};

export default function CompanyAttendancePage() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    const init = async () => {
      const me = await authService.me();
      setUser(me);
      if (me?.company_id) {
        const [emps, allEntries] = await Promise.all([
          employeeService.filter({ company_id: me.company_id }),
          attendanceService.filter({ company_id: me.company_id }),
        ]);
        setEmployees(emps);
        setEntries(allEntries);
      }
      setLoading(false);
    };
    init();
  }, []);

  const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
  const monthEnd = endOfMonth(new Date(selectedMonth + "-01"));

  const filtered = entries.filter(e => {
    const d = new Date(e.timestamp);
    const inMonth = d >= monthStart && d <= monthEnd;
    const inEmployee = selectedEmployee === "all" || e.employee_id === selectedEmployee;
    return inMonth && inEmployee;
  });

  // Group by employee + day
  const grouped = filtered.reduce((acc, e) => {
    const key = `${e.employee_id}_${e.timestamp?.split("T")[0]}`;
    if (!acc[key]) acc[key] = { employee_id: e.employee_id, employee_name: e.employee_name, date: e.timestamp?.split("T")[0], entries: [] };
    acc[key].entries.push(e);
    return acc;
  }, {});

  const rows = Object.values(grouped).sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (a.employee_name || "").localeCompare(b.employee_name || "");
  });

  // Stats
  const uniqueDays = new Set(filtered.map(e => e.timestamp?.split("T")[0])).size;
  const uniqueEmployees = new Set(filtered.map(e => e.employee_id)).size;

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Presenze Aziendali</h1>
            <p className="text-sm text-slate-500">Monitora le timbrature di tutti i dipendenti</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Dipendenti attivi", value: employees.length, icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "Timbrature mese", value: filtered.length, icon: Clock, color: "text-violet-600 bg-violet-50" },
            { label: "Giorni con presenze", value: uniqueDays, icon: Calendar, color: "text-emerald-600 bg-emerald-50" },
            { label: "Dipendenti presenti", value: uniqueEmployees, icon: LogIn, color: "text-orange-600 bg-orange-50" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Mese</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Dipendente</label>
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti i dipendenti</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Registro Presenze ({rows.length} giorni)</h2>
          </div>
          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessuna timbratura trovata</p>
              <p className="text-sm text-slate-400 mt-1">Cambia i filtri per vedere altri risultati</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Data</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Dipendente</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Entrata</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Uscita</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Timbrature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(row => {
                    const checkIn = row.entries.find(e => e.type === "check_in");
                    const checkOut = row.entries.find(e => e.type === "check_out");
                    return (
                      <tr key={`${row.employee_id}_${row.date}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {format(parseISO(row.date), "EEE d MMM", { locale: it })}
                        </td>
                        <td className="px-5 py-3 text-slate-700">{row.employee_name || "—"}</td>
                        <td className="px-5 py-3">
                          {checkIn ? (
                            <span className="text-emerald-700 font-mono font-semibold">
                              {format(new Date(checkIn.timestamp), "HH:mm")}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          {checkOut ? (
                            <span className="text-slate-700 font-mono font-semibold">
                              {format(new Date(checkOut.timestamp), "HH:mm")}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {row.entries.map((e, i) => {
                              const cfg = TYPE_LABELS[e.type] || { label: e.type, color: "bg-slate-100 text-slate-600" };
                              return (
                                <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                                  {cfg.label} {format(new Date(e.timestamp), "HH:mm")}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}