import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { User, Download, Calendar, FileText, Plus, AlertCircle, Check } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [payrollFiles, setPayrollFiles] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leave_type: "ferie",
    start_date: "",
    end_date: "",
    note: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: Replace with authService.me()
        const me = { email: 'user@example.com' };
        setUser(me);
        // TODO: Replace with service calls to fetch employee profile, payroll, balance, leave requests
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmitLeaveRequest = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date) {
      toast.error("Seleziona date inizio e fine");
      return;
    }

    if (new Date(leaveForm.start_date) > new Date(leaveForm.end_date)) {
      toast.error("La data inizio deve essere prima della data fine");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Replace with service.LeaveRequest.create() and refresh
      toast.success("Richiesta di ferie inoltrata");
      setLeaveForm({ leave_type: "ferie", start_date: "", end_date: "", note: "" });
      setShowLeaveForm(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: "bg-amber-100 text-amber-700",
      manager_approved: "bg-blue-100 text-blue-700",
      manager_rejected: "bg-red-100 text-red-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-600";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "In sospeso",
      manager_approved: "Approvato da manager",
      manager_rejected: "Rifiutato da manager",
      approved: "Approvato",
      rejected: "Rifiutato",
    };
    return labels[status] || status;
  };

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Il Mio Profilo</h1>
          <p className="text-slate-600">Visualizza i tuoi dati, documenti e richieste ferie</p>
        </div>

        {/* Dati Personali */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Dati Personali</h2>
          </div>

          {employee ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Nome</p>
                <p className="text-lg font-semibold text-slate-900">{employee.first_name} {employee.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</p>
                <p className="text-lg font-semibold text-slate-900">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Numero dipendente</p>
                <p className="text-lg font-semibold text-slate-900">{employee.employee_code || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Qualifica</p>
                <p className="text-lg font-semibold text-slate-900">{employee.job_title || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Dipartimento</p>
                <p className="text-lg font-semibold text-slate-900">{employee.department || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Ubicazione</p>
                <p className="text-lg font-semibold text-slate-900">{employee.location || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Data assunzione</p>
                <p className="text-lg font-semibold text-slate-900">
                  {employee.hire_date ? format(new Date(employee.hire_date), "d MMMM yyyy", { locale: it }) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Manager</p>
                <p className="text-lg font-semibold text-slate-900">{employee.manager || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-600">Profilo dipendente non trovato</p>
          )}
        </div>

        {/* Saldo Ferie */}
        {leaveBalance && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Saldo Ferie</h2>
              </div>
              <button
                onClick={() => setShowLeaveForm(!showLeaveForm)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Richiedi Ferie
              </button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Ferie Disponibili</p>
                <p className="text-3xl font-bold text-emerald-600">{leaveBalance.available_leave || 0}</p>
                <p className="text-xs text-slate-500 mt-1">giorni</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Utilizzate</p>
                <p className="text-3xl font-bold text-orange-600">{leaveBalance.used_leave || 0}</p>
                <p className="text-xs text-slate-500 mt-1">giorni</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Permessi</p>
                <p className="text-3xl font-bold text-blue-600">{leaveBalance.available_permissions || 0}</p>
                <p className="text-xs text-slate-500 mt-1">giorni</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">In Sospeso</p>
                <p className="text-3xl font-bold text-amber-600">
                  {leaveRequests.filter(r => r.status === "pending").length}
                </p>
                <p className="text-xs text-slate-500 mt-1">richieste</p>
              </div>
            </div>

            {/* Form Richiesta Ferie */}
            {showLeaveForm && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                <h3 className="font-semibold text-slate-900">Nuova Richiesta di Ferie</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
                    <select
                      value={leaveForm.leave_type}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ferie">Ferie</option>
                      <option value="permesso">Permesso</option>
                      <option value="malattia">Malattia</option>
                      <option value="extra">Extra</option>
                    </select>
                  </div>

                  <div></div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data inizio</label>
                    <input
                      type="date"
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data fine</label>
                    <input
                      type="date"
                      value={leaveForm.end_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Note</label>
                  <textarea
                    value={leaveForm.note}
                    onChange={(e) => setLeaveForm({ ...leaveForm, note: e.target.value })}
                    placeholder="Motivo o note aggiuntive..."
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitLeaveRequest}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Invio..." : "Invia Richiesta"}
                  </button>
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cronologia Richieste Ferie */}
        {leaveRequests.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Richieste Ferie</h2>
            <div className="space-y-3">
              {leaveRequests.map(req => (
                <div key={req.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-slate-900 capitalize">{req.leave_type}</p>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(req.status)}`}>
                          {getStatusLabel(req.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {format(new Date(req.start_date), "d MMM yyyy", { locale: it })} - {format(new Date(req.end_date), "d MMM yyyy", { locale: it })} ({req.days_count} giorni)
                      </p>
                      {req.note && <p className="text-sm text-slate-500 mt-1">Nota: {req.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buste Paga */}
        {payrollFiles.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Buste Paga</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Periodo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">File</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Caricato il</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollFiles.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {p.month}/{p.year}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.file_name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {format(new Date(p.uploaded_at), "d MMM yyyy", { locale: it })}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={p.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Scarica
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info */}
        {!payrollFiles.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <strong>ℹ️</strong> Le tue buste paga verranno visualizzate qui non appena disponibili dall'azienda.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}