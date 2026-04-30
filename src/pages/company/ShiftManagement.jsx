import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from "lucide-react";
import { startOfWeek, addDays, format } from "date-fns";
import { it } from "date-fns/locale";

const SHIFT_PRESETS = {
  mattina: { label: "Mattina", start: "06:00", end: "14:00", color: "bg-amber-100 text-amber-700" },
  pomeriggio: { label: "Pomeriggio", start: "14:00", end: "22:00", color: "bg-blue-100 text-blue-700" },
  notte: { label: "Notte", start: "22:00", end: "06:00", color: "bg-slate-100 text-slate-700" },
  full_day: { label: "Giornata intera", start: "08:00", end: "17:00", color: "bg-green-100 text-green-700" }
};

export default function ShiftManagement() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: "", shiftType: "full_day", startTime: "", endTime: "", notes: "" });

  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, emps, s] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id, status: "active" }),
        base44.entities.Shift.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setEmployees(emps);
      setShifts(s);
    }).finally(() => setLoading(false));
  }, []);

  const loadShifts = async () => {
    if (!company?.id) return;
    const s = await base44.entities.Shift.filter({ company_id: company.id });
    setShifts(s);
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !formData.date) return;
    
    const emp = employees.find(e => e.id === selectedEmployee);
    const startTime = formData.startTime || SHIFT_PRESETS[formData.shiftType].start;
    const endTime = formData.endTime || SHIFT_PRESETS[formData.shiftType].end;

    await base44.entities.Shift.create({
      company_id: company.id,
      employee_id: selectedEmployee,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      date: formData.date,
      start_time: startTime,
      end_time: endTime,
      shift_type: formData.shiftType,
      notes: formData.notes || undefined
    });

    setFormData({ date: "", shiftType: "full_day", startTime: "", endTime: "", notes: "" });
    setShowForm(false);
    await loadShifts();
  };

  const handleDeleteShift = async (shiftId) => {
    if (!confirm("Eliminare il turno?")) return;
    await base44.entities.Shift.delete(shiftId);
    await loadShifts();
  };

  const getShiftsForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return shifts.filter(s => s.date === dateStr);
  };

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-slate-800">Gestione Turni Settimanali</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Assegna turno
          </button>
        </div>

        {/* Form aggiungi turno */}
        {showForm && (
          <form onSubmit={handleAddShift} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Nuovo turno</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dipendente *</label>
                <select required value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleziona dipendente</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data *</label>
                <input type="date" required value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo turno</label>
                <select value={formData.shiftType} onChange={e => setFormData(f => ({ ...f, shiftType: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(SHIFT_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Orario inizio</label>
                <input type="time" value={formData.startTime} onChange={e => setFormData(f => ({ ...f, startTime: e.target.value }))}
                  placeholder={SHIFT_PRESETS[formData.shiftType].start}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Orario fine</label>
                <input type="time" value={formData.endTime} onChange={e => setFormData(f => ({ ...f, endTime: e.target.value }))}
                  placeholder={SHIFT_PRESETS[formData.shiftType].end}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                <input value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Es. Copertura emergenza"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                Assegna turno
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
                Annulla
              </button>
            </div>
          </form>
        )}

        {/* Navigazione settimana */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="font-semibold text-slate-800">
            {format(weekStart, "d MMM", { locale: it })} - {format(addDays(weekStart, 5), "d MMM yyyy", { locale: it })}
          </h2>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Calendario settimanale */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-0 border-collapse">
            {weekDays.map(day => {
              const dayShifts = getShiftsForDay(day);
              return (
                <div key={day.toISOString()} className="border-r border-b border-slate-200 last:border-r-0 p-4 min-h-96">
                  <h3 className="font-semibold text-slate-800 text-sm mb-3">
                    {format(day, "EEE", { locale: it })} {format(day, "d MMM")}
                  </h3>
                  <div className="space-y-2">
                    {dayShifts.length === 0 ? (
                      <p className="text-xs text-slate-400">Nessun turno</p>
                    ) : (
                      dayShifts.map(shift => {
                        const preset = SHIFT_PRESETS[shift.shift_type];
                        return (
                          <div key={shift.id} className={`p-2 rounded-lg text-xs ${preset.color} space-y-1`}>
                            <p className="font-semibold truncate">{shift.employee_name}</p>
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3" />
                              {shift.start_time?.substring(0, 5)} - {shift.end_time?.substring(0, 5)}
                            </div>
                            {shift.notes && <p className="text-xs opacity-75">{shift.notes}</p>}
                            <button
                              onClick={() => handleDeleteShift(shift.id)}
                              className="mt-2 p-1 hover:opacity-70 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}