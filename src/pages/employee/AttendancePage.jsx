import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import { Clock, LogIn, LogOut, Coffee } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const TYPE_LABELS = {
  check_in: { label: "Entrata", icon: LogIn, color: "text-emerald-600 bg-emerald-50" },
  check_out: { label: "Uscita", icon: LogOut, color: "text-slate-600 bg-slate-100" },
  break_start: { label: "Inizio pausa", icon: Coffee, color: "text-orange-500 bg-orange-50" },
  break_end: { label: "Fine pausa", icon: Coffee, color: "text-blue-500 bg-blue-50" },
};

export default function AttendancePage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stamping, setStamping] = useState(null);

  const loadEntries = async (me) => {
    const all = await base44.entities.TimeEntry.filter({ user_email: me.email });
    setEntries(all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      setEmployee(emps[0] || null);
      await loadEntries(me);
    }).finally(() => setLoading(false));
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntries = entries.filter(e => e.timestamp?.startsWith(today));
  const lastEntry = todayEntries[0];
  const isClockedIn = lastEntry?.type === "check_in" || lastEntry?.type === "break_end";

  const handleStamp = async (type) => {
    if (!employee || !user) return;
    setStamping(type);
    await base44.entities.TimeEntry.create({
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      company_id: employee.company_id,
      user_email: user.email,
      timestamp: new Date().toISOString(),
      type,
    });
    await loadEntries(user);
    setStamping(null);
  };

  // Group by date
  const grouped = entries.reduce((acc, e) => {
    const d = e.timestamp?.split("T")[0] || "?";
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  if (loading) return (
    <AppShell user={user}><div className="flex h-64 items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div></AppShell>
  );

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-slate-800">Timbratura</h1>

        {/* Action buttons */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-4">{format(new Date(), "EEEE d MMMM yyyy", { locale: it })}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: "check_in", label: "Entrata", disabled: isClockedIn },
              { type: "check_out", label: "Uscita", disabled: !isClockedIn },
              { type: "break_start", label: "Inizio pausa", disabled: !isClockedIn },
              { type: "break_end", label: "Fine pausa", disabled: isClockedIn },
            ].map(({ type, label, disabled }) => {
              const cfg = TYPE_LABELS[type];
              const Icon = cfg.icon;
              return (
                <button
                  key={type}
                  onClick={() => handleStamp(type)}
                  disabled={disabled || stamping === type}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                    !disabled ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-slate-200 text-slate-400"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {stamping === type ? "..." : label}
                </button>
              );
            })}
          </div>
          {lastEntry && (
            <p className="text-xs text-slate-400 mt-4 text-center">
              Ultima timbratura: <strong>{TYPE_LABELS[lastEntry.type]?.label}</strong> alle {format(new Date(lastEntry.timestamp), "HH:mm")}
            </p>
          )}
        </div>

        {/* History */}
        <div className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Nessuna timbratura ancora</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, dayEntries]) => (
              <div key={date} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">
                    {format(new Date(date), "EEEE d MMMM yyyy", { locale: it })}
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {dayEntries.map(e => {
                    const cfg = TYPE_LABELS[e.type] || { label: e.type, color: "text-slate-600 bg-slate-100", icon: Clock };
                    const Icon = cfg.icon;
                    return (
                      <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{cfg.label}</p>
                          {e.notes && <p className="text-xs text-slate-400">{e.notes}</p>}
                        </div>
                        <p className="text-sm font-mono text-slate-600">{format(new Date(e.timestamp), "HH:mm")}</p>
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