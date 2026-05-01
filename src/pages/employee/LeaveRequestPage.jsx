import { useState, useEffect } from "react";
// Migration: removed base44 dependency
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { CalendarDays, Plus, X } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { it } from "date-fns/locale";

const STATUS = {
  pending: { label: "In attesa approvazione manager", cls: "bg-orange-100 text-orange-700" },
  manager_approved: { label: "Approvata dal manager", cls: "bg-blue-100 text-blue-700" },
  manager_rejected: { label: "Rifiutata dal manager", cls: "bg-red-100 text-red-600" },
  approved: { label: "Approvata definitivamente", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rifiutata", cls: "bg-red-100 text-red-600" },
};
const TYPE_LABELS = { ferie: "Ferie", permesso: "Permesso", malattia: "Malattia", extra: "Straordinario" };

export default function LeaveRequestPage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: "ferie", start_date: "", end_date: "", note: "" });
  const [saving, setSaving] = useState(false);

  const loadLeaves = async (emp) => {
    const l = await base44.entities.LeaveRequest.filter({ employee_id: emp.id });
    setLeaves([...l].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  };

  useEffect(() => {
    const init = async () => {
    const me = await authService.me();
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0] || null;
      setEmployee(emp);
      if (emp) await loadLeaves(emp);
      setLoading(false);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;
    setSaving(true);
    const days = differenceInCalendarDays(new Date(form.end_date), new Date(form.start_date)) + 1;
    await base44.entities.LeaveRequest.create({
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      employee_email: user.email,
      company_id: employee.company_id,
      manager_email: employee.manager,
      manager_name: undefined,
      ...form,
      days_count: days,
      status: "pending",
    });
    setShowForm(false);
    setForm({ leave_type: "ferie", start_date: "", end_date: "", note: "" });
    await loadLeaves(employee);
    setSaving(false);
  };

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Ferie & Permessi</h1>
            <p className="text-sm text-slate-500">Le tue richieste di assenza</p>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Annulla" : "Nuova richiesta"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Nuova richiesta di assenza</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo assenza</label>
                <select value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data inizio *</label>
                <input type="date" required value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data fine *</label>
                <input type="date" required value={form.end_date} min={form.start_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note (opzionale)</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {saving ? "Invio in corso..." : "Invia richiesta"}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Le tue richieste</h2>
          </div>
          {leaves.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessuna richiesta ancora</p>
              <p className="text-sm text-slate-400 mt-1">Clicca "Nuova richiesta" per iniziare</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaves.map(l => {
                const badge = STATUS[l.status] || STATUS.pending;
                return (
                  <div key={l.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">{TYPE_LABELS[l.leave_type] || l.leave_type}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {format(new Date(l.start_date), "d MMM", { locale: it })} → {format(new Date(l.end_date), "d MMM yyyy", { locale: it })}
                          {l.days_count ? <span className="ml-2 text-slate-400">({l.days_count} giorni)</span> : null}
                        </p>
                        {l.note && <p className="text-xs text-slate-400 mt-1">{l.note}</p>}
                        {l.manager_note && <p className="text-xs text-blue-600 mt-1 font-medium">Nota manager: {l.manager_note}</p>}
                        {l.admin_note && <p className="text-xs text-emerald-600 mt-1 font-medium">Nota HR: {l.admin_note}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}