import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Briefcase, Mail, Phone, User, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const CONSULTANT_TYPES = [
  { id: "labor", label: "Consulente del Lavoro", desc: "Contratti, ferie, normative" },
  { id: "external", label: "Consulente Esterno", desc: "Specialista esterno per progetti" },
  { id: "safety", label: "Consulente Sicurezza", label: "RSPP e sicurezza sul lavoro" }
];

export default function RegisterConsultant() {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    consultant_type: "labor",
    password: "",
    password_confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!form.name || !form.surname || !form.email || !form.phone) {
      setError("Tutti i campi personali sono obbligatori");
      return false;
    }
    if (!form.consultant_type) {
      setError("Seleziona il tipo di consulente");
      return false;
    }
    if (form.password.length < 8) {
      setError("Password minimo 8 caratteri");
      return false;
    }
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[!@#$%^&*]/.test(form.password)) {
      setError("Password deve contenere maiuscola, numero e carattere speciale");
      return false;
    }
    if (form.password !== form.password_confirm) {
      setError("Le password non coincidono");
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Crea ID pubblico consulente
      const publicId = `CONS_${form.consultant_type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Invita consulente
      await base44.users.inviteUser(form.email, "labor_consultant");

      // Aggiorna profilo
      await base44.auth.updateMe({
        role: "labor_consultant",
        consultant_type: form.consultant_type,
        consultant_public_id: publicId,
        full_name: `${form.name} ${form.surname}`,
        phone: form.phone,
        profile_completed: true,
        must_change_password: false
      });

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard/consultant";
      }, 2000);
    } catch (err) {
      setError(err.message || "Errore nella registrazione");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center space-y-6 shadow-xl">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Consulente Registrato!</h2>
            <p className="text-slate-600 mt-2">Benvenuto in PulseHR. Verrai reindirizzato al dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Registrati come Consulente</h1>
          <p className="text-slate-600">Connettiti con aziende e offri le tue competenze</p>
        </div>

        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Dati Personali */}
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Dati Personali</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Giovanni"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Cognome *</label>
                <input
                  type="text"
                  required
                  value={form.surname}
                  onChange={e => setForm({ ...form, surname: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Bianchi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="giovanni@consulente.it"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Telefono *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="+39 333 12345678"
                />
              </div>
            </div>
          </div>

          {/* Tipo Consulente */}
          <div className="space-y-3 pb-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Tipo di Consulente *</h2>
            <div className="space-y-2">
              {CONSULTANT_TYPES.map(type => (
                <label key={type.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="consultant_type"
                    value={type.id}
                    checked={form.consultant_type === type.id}
                    onChange={e => setForm({ ...form, consultant_type: e.target.value })}
                    className="mt-1 cursor-pointer"
                  />
                  <div>
                    <p className="font-semibold text-slate-800">{type.label}</p>
                    <p className="text-xs text-slate-600">{type.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">Credenziali Accesso</h2>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Min 8 char, maiusc, numero, simbolo"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Minimo 8 caratteri, maiuscola, numero e simbolo</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Conferma Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={form.password_confirm}
                  onChange={e => setForm({ ...form, password_confirm: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ripeti password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Registrazione in corso..." : "Registrati come Consulente"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Hai già un account?{" "}
          <Link to="/auth/login" className="text-violet-600 hover:text-violet-700 font-semibold">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}