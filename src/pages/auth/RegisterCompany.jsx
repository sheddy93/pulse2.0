import { useState } from 'react';
import { authService } from '@/services/authService';
import { Building2, Mail, Phone, User, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function RegisterCompany() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    company_name: "",
    vat_number: "",
    email: "",
    phone: "",
    owner_name: "",
    owner_surname: "",
    password: "",
    password_confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!form.company_name || !form.vat_number || !form.email || !form.phone) {
      setError("Tutti i campi aziendali sono obbligatori");
      return false;
    }
    if (!form.owner_name || !form.owner_surname || !form.password) {
      setError("Tutti i dati proprietario sono obbligatori");
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
      // TODO: Replace with service.Company.create() for REST API
      const publicId = `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // TODO: Replace with authService REST API call
      await authService.updateMe({
        role: "company_owner",
        full_name: `${form.owner_name} ${form.owner_surname}`,
        phone: form.phone,
        profile_completed: true,
        must_change_password: false
      });

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard/company";
      }, 2000);
    } catch (err) {
      setError(err.message || "Errore nella registrazione");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center space-y-6 shadow-xl">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Azienda Registrata!</h2>
            <p className="text-slate-600 mt-2">Benvenuto in PulseHR. Verrai reindirizzato al dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Registra la Tua Azienda</h1>
          <p className="text-slate-600">Inizia a gestire i tuoi dipendenti su PulseHR</p>
        </div>

        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Dati Azienda */}
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Dati Azienda</h2>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Azienda *</label>
              <input
                type="text"
                required
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Es. Acme Srl"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Partita IVA *</label>
              <input
                type="text"
                required
                value={form.vat_number}
                onChange={e => setForm({ ...form, vat_number: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Es. 12345678901"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Azienda *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="info@azienda.com"
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
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+39 02 1234 5678"
                />
              </div>
            </div>
          </div>

          {/* Dati Proprietario */}
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Proprietario Azienda</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.owner_name}
                  onChange={e => setForm({ ...form, owner_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Cognome *</label>
                <input
                  type="text"
                  required
                  value={form.owner_surname}
                  onChange={e => setForm({ ...form, owner_surname: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rossi"
                />
              </div>
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
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ripeti password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Registrazione in corso..." : "Registra Azienda"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Hai già un account?{" "}
          <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}