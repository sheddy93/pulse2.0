import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { generateTempPassword, COMPANY_SUB_ROLES } from "@/lib/roles";
import { UserCog, Eye, EyeOff, Check, Copy, Mail } from "lucide-react";
import { toast } from "sonner";

export default function CreateCompanyAdmin() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", role: "company_admin" });
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const companies = // TODO: Replace with service.Company.filter({ id: me.company_id });
        setCompany(companies[0]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    const tempPassword = generateTempPassword();
    const publicId = `ADM-${Date.now().toString().slice(-6)}`;

    // Invite user to platform
    await base44.users.inviteUser(form.email, form.role);

    // TODO: Replace with service.EmployeeProfile.create() call
    // Stub profile creation - service integration pending

    setDone({ tempPassword, email: form.email, role: form.role, name: `${form.first_name} ${form.last_name}`, publicId });
    setSaving(false);
  };

  const copyPw = () => {
    navigator.clipboard.writeText(done.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <PageLoader color="blue" />;

  if (done) return (
    <AppShell user={user}>
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Admin creato!</h2>
            <p className="text-sm text-slate-500 mt-1">{done.name} è stato invitato come {COMPANY_SUB_ROLES.find(r => r.value === done.role)?.label}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-4">
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
                <button onClick={copyPw} className="p-1 text-slate-400 hover:text-slate-600">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
            L'admin dovrà cambiare la password al primo accesso. Comunica le credenziali in modo sicuro.
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setDone(null); setForm({ first_name: "", last_name: "", email: "", role: "company_admin" }); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
              Aggiungi un altro
            </button>
            <button onClick={() => navigate("/dashboard/company/admins")}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              Vai agli admin
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <UserCog className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Crea Admin Aziendale</h1>
            <p className="text-sm text-slate-500">{company?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nome *</label>
              <input type="text" required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cognome *</label>
              <input type="text" required value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@azienda.it" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Ruolo *</label>
            <div className="space-y-2">
              {COMPANY_SUB_ROLES.map(role => (
                <label key={role.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.role === role.value ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input type="radio" name="role" value={role.value} checked={form.role === role.value}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="mt-1" />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{role.label}</p>
                    <p className="text-xs text-slate-500">{role.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
            Sarà inviato un invito email e generata una <strong>password temporanea</strong>.
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Annulla</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Creazione..." : "Crea Admin"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}