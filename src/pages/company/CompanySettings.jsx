import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { authService } from '@/services/authService';
import companyService from '@/services/companies.service';
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Settings, Building2, Save, Bell, Shield } from "lucide-react";
import { toast } from "sonner";
import GeofenceAlertSettings from "@/components/company/GeofenceAlertSettings";

export default function CompanySettings() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", vat_number: "" });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const companies = await base44.entities.Company.filter({ id: me.company_id });
        const comp = companies[0];
        if (comp) {
          setCompany(comp);
          setForm({
            name: comp.name || "",
            email: comp.email || "",
            phone: comp.phone || "",
            address: comp.address || "",
            vat_number: comp.vat_number || "",
          });
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    await base44.entities.Company.update(company.id, form);
    toast.success("Impostazioni salvate");
    setSaving(false);
  };

  if (loading) return <PageLoader color="blue" />;

  const tabs = [
    { id: "company", label: "Dati Azienda", icon: Building2 },
    { id: "notifications", label: "Notifiche", icon: Bell },
    { id: "security", label: "Sicurezza", icon: Shield },
    { id: "geofence", label: "Geofence", icon: Shield },
  ];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Impostazioni Azienda</h1>
            <p className="text-sm text-slate-500">Gestisci le impostazioni della tua azienda</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "company" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Dati Aziendali</h2>
            {[
              { key: "name", label: "Nome Azienda", placeholder: "Es. Acme S.r.l." },
              { key: "vat_number", label: "Partita IVA", placeholder: "IT12345678901" },
              { key: "email", label: "Email", placeholder: "info@azienda.it" },
              { key: "phone", label: "Telefono", placeholder: "+39 02 1234567" },
              { key: "address", label: "Indirizzo", placeholder: "Via Roma 1, Milano" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Preferenze Notifiche</h2>
            <p className="text-sm text-slate-500">Le notifiche vengono inviate automaticamente via email per ferie, straordinari e documenti in scadenza.</p>
            {[
              "Notifica quando un dipendente richiede ferie",
              "Notifica quando un dipendente richiede straordinario",
              "Notifica documenti in scadenza (30 giorni prima)",
              "Notifica contratti in scadenza",
            ].map((label, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-700">{label}</span>
                <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Sicurezza e Accessi</h2>
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-slate-700">Account proprietario</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
              <p className="text-xs text-slate-400">Ruolo: {user?.role}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold">Autenticazione</p>
              <p className="text-sm text-blue-700 mt-1">L'autenticazione è gestita dalla piattaforma PulseHR. Per cambiare la password utilizza la pagina di login.</p>
            </div>
          </div>
        )}

        {activeTab === "geofence" && company && (
          <GeofenceAlertSettings companyId={company.id} />
        )}
      </div>
    </AppShell>
  );
}