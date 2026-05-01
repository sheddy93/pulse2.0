import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Bell, Mail, Smartphone, Check, Loader2 } from "lucide-react";

const NOTIFICATION_CATEGORIES = [
  {
    group: "Richieste",
    items: [
      { key: "leave_requests", label: "Ferie & Permessi", desc: "Approvazioni, rifiuti e aggiornamenti sulle richieste di ferie" },
      { key: "overtime_requests", label: "Straordinari", desc: "Stato delle richieste di straordinario" },
    ]
  },
  {
    group: "Presenze",
    items: [
      { key: "attendance", label: "Timbrature", desc: "Conferma delle timbrature in entrata e uscita" },
    ]
  },
  {
    group: "Scadenze",
    items: [
      { key: "document_expiry", label: "Documenti in scadenza", desc: "Avvisi per documenti in scadenza nei prossimi 30 giorni" },
      { key: "contract_expiry", label: "Contratti in scadenza", desc: "Avvisi per contratti prossimi alla scadenza" },
      { key: "certification_expiry", label: "Certificazioni in scadenza", desc: "Scadenza di certificati e corsi di formazione" },
    ]
  },
  {
    group: "Altro",
    items: [
      { key: "payroll", label: "Buste paga disponibili", desc: "Notifica quando una nuova busta paga è disponibile" },
      { key: "announcements", label: "Annunci aziendali", desc: "Comunicazioni e annunci dalla tua azienda" },
    ]
  }
];

const DEFAULT_PREFS = {
  leave_requests_inapp: true, leave_requests_email: true,
  overtime_requests_inapp: true, overtime_requests_email: false,
  attendance_inapp: false, attendance_email: false,
  document_expiry_inapp: true, document_expiry_email: true,
  contract_expiry_inapp: true, contract_expiry_email: true,
  certification_expiry_inapp: true, certification_expiry_email: false,
  payroll_inapp: true, payroll_email: true,
  announcements_inapp: true, announcements_email: false,
};

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefId, setPrefId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const existing = await base44.entities.NotificationPreference.filter({ user_email: me.email });
      if (existing.length > 0) {
        const p = existing[0];
        setPrefId(p.id);
        setPrefs({ ...DEFAULT_PREFS, ...p });
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const data = { ...prefs, user_email: user.email };
    if (prefId) {
      await base44.entities.NotificationPreference.update(prefId, data);
    } else {
      const created = await base44.entities.NotificationPreference.create(data);
      setPrefId(created.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Preferenze Notifiche</h1>
              <p className="text-sm text-slate-500">Scegli quali avvisi ricevere e tramite quale canale</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saved ? "Salvato!" : saving ? "Salvo..." : "Salva preferenze"}
          </button>
        </div>

        {/* Channel legend */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <span><strong>In-app</strong> — notifica nel pannello campana</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-emerald-500" />
            <span><strong>Email</strong> — invio all'indirizzo del tuo account</span>
          </div>
        </div>

        {/* Categories */}
        {NOTIFICATION_CATEGORIES.map(({ group, items }) => (
          <div key={group} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">{group}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  {/* In-app toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      onClick={() => toggle(`${key}_inapp`)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        prefs[`${key}_inapp`] ? "bg-blue-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        prefs[`${key}_inapp`] ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                  {/* Email toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      onClick={() => toggle(`${key}_email`)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        prefs[`${key}_email`] ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        prefs[`${key}_email`] ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Save bottom */}
        <div className="flex justify-end pb-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {saved ? "Preferenze salvate!" : saving ? "Salvo..." : "Salva preferenze"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}