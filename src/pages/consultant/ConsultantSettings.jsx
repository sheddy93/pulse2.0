import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Settings, User, Bell, Shield, Save, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function ConsultantSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then((me) => {
      setUser(me);
      setForm({ full_name: me.full_name || "", phone: me.phone || "" });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    toast.success("Profilo aggiornato");
    setSaving(false);
  };

  const copyId = () => {
    navigator.clipboard.writeText(user?.public_id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <PageLoader color="violet" />;

  const tabs = [
    { id: "profile", label: "Profilo", icon: User },
    { id: "notifications", label: "Notifiche", icon: Bell },
    { id: "security", label: "Sicurezza", icon: Shield },
  ];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Impostazioni</h1>
            <p className="text-sm text-slate-500">Gestisci il tuo profilo e le preferenze</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-slate-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === tab.id ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Public ID */}
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-800">Il tuo ID Pubblico</p>
                <p className="text-lg font-mono font-bold text-violet-700 mt-0.5">{user?.public_id || "Non assegnato"}</p>
                <p className="text-xs text-violet-600 mt-1">Condividi questo ID con le aziende per collegarti</p>
              </div>
              <button onClick={copyId} className="p-2 rounded-lg hover:bg-violet-100 transition-colors">
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-violet-600" />}
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-semibold text-slate-800">Dati Profilo</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email (non modificabile)</label>
                <input type="email" value={user?.email || ""} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400" />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg font-semibold text-sm hover:bg-violet-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Notifiche</h2>
            {[
              "Notifica quando un'azienda accetta la tua richiesta",
              "Notifica quando un documento richiede revisione",
              "Notifica documenti in scadenza delle aziende clienti",
            ].map((label, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-700">{label}</span>
                <div className="w-10 h-6 bg-violet-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Sicurezza</h2>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-700">Account</p>
              <p className="text-sm text-slate-600 mt-1">{user?.email}</p>
            </div>
            <div className="p-4 bg-violet-50 rounded-lg">
              <p className="text-sm text-violet-800 font-semibold">Autenticazione</p>
              <p className="text-sm text-violet-700 mt-1">Per cambiare la password utilizza la pagina di login con il link "Password dimenticata".</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}