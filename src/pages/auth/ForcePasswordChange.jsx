import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

function checkStrength(pw) {
  const rules = [
    { ok: pw.length >= 8, label: "Minimo 8 caratteri" },
    { ok: /[A-Z]/.test(pw), label: "Una lettera maiuscola" },
    { ok: /[a-z]/.test(pw), label: "Una lettera minuscola" },
    { ok: /[0-9]/.test(pw), label: "Un numero" },
    { ok: /[!@#$%^&*]/.test(pw), label: "Un carattere speciale (!@#$%^&*)" },
  ];
  return rules;
}

export default function ForcePasswordChange({ onComplete }) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const rules = checkStrength(newPw);
  const allRulesPassed = rules.every(r => r.ok);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!allRulesPassed) { setError("La password non soddisfa tutti i requisiti"); return; }
    if (newPw !== confirmPw) { setError("Le password non coincidono"); return; }
    setSaving(true);
    await authService.updateMe({ must_change_password: false });
    setSaving(false);
    if (onComplete) onComplete();
    else window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Cambia la tua password</h1>
          <p className="text-sm text-slate-500 mt-1">Per continuare devi impostare una nuova password sicura</p>
        </div>

        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nuova Password *</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Inserisci nuova password"
              />
              <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength rules */}
          {newPw.length > 0 && (
            <div className="space-y-1">
              {rules.map(rule => (
                <div key={rule.label} className={`flex items-center gap-2 text-xs ${rule.ok ? "text-emerald-700" : "text-slate-400"}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${rule.ok ? "text-emerald-500" : "text-slate-300"}`} />
                  {rule.label}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Conferma Password *</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ripeti nuova password"
              />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving || !allRulesPassed}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? "Salvataggio..." : "Cambia Password"}
          </button>
        </form>
      </div>
    </div>
  );
}