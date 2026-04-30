import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Clock, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_BADGE = {
  pending: { label: "In attesa", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approvato", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rifiutato", cls: "bg-red-100 text-red-700" },
};

export default function OvertimeRequestPage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: "", hours: "", reason: "" });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.employee_id) { setLoading(false); return; }
      const [emps, reqs] = await Promise.all([
        base44.entities.EmployeeProfile.filter({ id: me.employee_id }),
        base44.entities.OvertimeRequest.filter({ employee_id: me.employee_id }),
      ]);
      if (emps.length > 0) setEmployee(emps[0]);
      setRequests([...reqs].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !employee || !form.date || !form.hours) return;
    setSubmitting(true);
    await base44.entities.OvertimeRequest.create({
      employee_id: user.employee_id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      employee_email: user.email,
      company_id: employee.company_id,
      date: form.date,
      hours: parseFloat(form.hours),
      reason: form.reason || undefined,
      status: "pending",
    });
    setForm({ date: "", hours: "", reason: "" });
    setShowForm(false);
    const reqs = await base44.entities.OvertimeRequest.filter({ employee_id: user.employee_id });
    setRequests([...reqs].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setSubmitting(false);
  };

  if (loading) return <PageLoader color="green" />;

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const totalHours = requests.filter(r => r.status === "approved").reduce((sum, r) => sum + (r.hours || 0), 0);

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Richieste di straordinario</h1>
            <p className="text-sm text-slate-500">{requests.length} richieste · {approvedCount} approvate</p>
          </div>
          <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Annulla" : "Nuova richiesta"}
          </button>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
            <p className="text-xs text-slate-500 mt-1">In attesa</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Approvate</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{totalHours}</p>
            <p className="text-xs text-slate-500 mt-1">Ore approvate</p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Richiedi straordinario</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data *</label>
                <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ore *</label>
                <input type="number" step="0.5" min="0.5" required value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                  placeholder="Es. 2.5"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Motivo</label>
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                placeholder="Es. Completamento urgente del progetto"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>
            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? "Invio in corso..." : "Invia richiesta"}
            </button>
          </form>
        )}

        {/* Lista richieste */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {requests.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessuna richiesta ancora</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map(req => (
                <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{format(new Date(req.date), "d MMMM yyyy", { locale: it })}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[req.status]?.cls}`}>{STATUS_BADGE[req.status]?.label}</span>
                      </div>
                      <p className="text-sm text-slate-600"><strong>{req.hours}</strong> ore richieste</p>
                      {req.reason && <p className="text-sm text-slate-500 mt-1">{req.reason}</p>}
                    </div>
                  </div>
                  {req.admin_notes && (
                    <div className="mt-2 p-2 bg-slate-50 border-l-2 border-slate-300 rounded text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">Note admin:</p>
                      <p>{req.admin_notes}</p>
                    </div>
                  )}
                  {req.reviewed_at && (
                    <p className="text-xs text-slate-400 mt-2">Revisione: {format(new Date(req.reviewed_at), "d MMM yyyy HH:mm", { locale: it })}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}