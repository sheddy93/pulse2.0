import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import { generatePublicId, generateTempPassword } from "@/lib/roles";
import { UserPlus, Eye, EyeOff, Check } from "lucide-react";

export default function NewEmployee() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    employee_code: "", job_title: "", department: "", location: "",
    manager: "", hire_date: "", status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null); // { tempPassword }
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const companies = await base44.entities.Company.filter({ id: me.company_id });
        setCompany(companies[0] || null);
      }
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    const tempPassword = generateTempPassword();
    const empCode = form.employee_code || `EMP-${Date.now().toString().slice(-6)}`;
    await base44.entities.EmployeeProfile.create({
      ...form,
      employee_code: empCode,
      company_id: company.id,
      has_account: true,
      temp_password: tempPassword,
    });
    setDone({ tempPassword, email: form.email });
    setSaving(false);
  };

  if (done) return (
    <AppShell user={user}>
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Dipendente creato!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Comunica al dipendente le credenziali di accesso. Dovrà cambiare la password al primo login.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 space-y-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Email / Username</p>
              <p className="font-mono font-semibold text-slate-800">{done.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Password temporanea</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-bold text-lg text-slate-800">
                  {showPw ? done.tempPassword : "••••••••••"}
                </p>
                <button onClick={() => setShowPw(s => !s)}>
                  {showPw ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setDone(null); setForm({ first_name:"",last_name:"",email:"",phone:"",employee_code:"",job_title:"",department:"",location:"",manager:"",hire_date:"",status:"active" }); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Aggiungi un altro
            </button>
            <button
              onClick={() => navigate("/dashboard/company/employees")}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
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
            {[
              { k: "first_name", label: "Nome *", required: true },
              { k: "last_name", label: "Cognome *", required: true },
              { k: "email", label: "Email (username accesso) *", required: true, type: "email" },
              { k: "phone", label: "Telefono" },
              { k: "employee_code", label: "Codice dipendente" },
              { k: "job_title", label: "Mansione" },
              { k: "department", label: "Reparto" },
              { k: "location", label: "Sede" },
              { k: "manager", label: "Responsabile" },
              { k: "hire_date", label: "Data assunzione", type: "date" },
            ].map(({ k, label, required, type }) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                <input
                  type={type || "text"}
                  required={required}
                  value={form[k]}
                  onChange={e => set(k, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stato</label>
              <select
                value={form.status}
                onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Attivo</option>
                <option value="onboarding">Onboarding</option>
                <option value="inactive">Inattivo</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
            Verrà generata automaticamente una <strong>password temporanea</strong>. Il dipendente dovrà cambiarla al primo accesso.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Annulla
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Creazione..." : "Crea dipendente"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}