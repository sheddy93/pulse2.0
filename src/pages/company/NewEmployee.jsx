import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { generateTempPassword } from "@/lib/roles";
import { UserPlus, Eye, EyeOff, Check, Copy } from "lucide-react";

const FIELDS = [
  { k: "first_name", label: "Nome *", req: true },
  { k: "last_name", label: "Cognome *", req: true },
  { k: "email", label: "Email (username accesso) *", req: true, type: "email" },
  { k: "phone", label: "Telefono" },
  { k: "employee_code", label: "Codice dipendente" },
  { k: "job_title", label: "Mansione" },
  { k: "department", label: "Reparto" },
  { k: "location", label: "Sede" },
  { k: "manager", label: "Responsabile" },
  { k: "hire_date", label: "Data assunzione", type: "date" },
];

export default function NewEmployee() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", employee_code: "", job_title: "", department: "", location: "", manager: "", hire_date: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [pwCopied, setPwCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const companies = await base44.entities.Company.filter({ id: me.company_id });
        setCompany(companies[0] || null);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    const tempPassword = generateTempPassword();
    // Invite user to platform with employee role
    if (form.email) {
      await base44.users.inviteUser(form.email, "employee");
    }

    await base44.entities.EmployeeProfile.create({
      ...form,
      employee_code: form.employee_code || `EMP-${Date.now().toString().slice(-6)}`,
      company_id: company.id,
      has_account: !!form.email,
      temp_password: tempPassword,
      user_email: form.email,
    });
    setDone({ tempPassword, email: form.email });
    setSaving(false);
  };

  if (loading) return <PageLoader />;

  if (done) return (
    <AppShell user={user}>
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Dipendente creato!</h2>
          <p className="text-slate-500 text-sm mb-6">Comunica al dipendente le credenziali. Dovrà cambiarle al primo accesso.</p>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-4 mb-6">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">EMAIL / USERNAME</p>
              <p className="font-mono font-semibold text-slate-800">{done.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">PASSWORD TEMPORANEA</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg font-bold text-slate-800 flex-1">{showPw ? done.tempPassword : "••••••••••"}</p>
                <button onClick={() => setShowPw(s => !s)} className="p-1 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(done.tempPassword); setPwCopied(true); setTimeout(() => setPwCopied(false), 2000); }} className="p-1 text-slate-400 hover:text-slate-600">
                  {pwCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setDone(null); setForm({ first_name: "", last_name: "", email: "", phone: "", employee_code: "", job_title: "", department: "", location: "", manager: "", hire_date: "", status: "active" }); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Aggiungi un altro
            </button>
            <button onClick={() => navigate("/dashboard/company/employees")}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              Vai ai dipendenti
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Aggiungi lavoratore</h1>
            <p className="text-sm text-slate-500">{company?.name || "Azienda"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map(({ k, label, req, type }) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                <input type={type || "text"} required={req} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stato</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Attivo</option>
                <option value="onboarding">Onboarding</option>
                <option value="inactive">Inattivo</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
            Sarà generata automaticamente una <strong>password temporanea</strong>. Il dipendente dovrà cambiarla al primo accesso.
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Annulla</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Creazione..." : "Crea dipendente"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}