import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Settings, Globe, Megaphone, DollarSign, Share2, Save, CreditCard } from "lucide-react";
import StripePlansManager from "@/components/admin/StripePlansManager";
import { toast } from "sonner";

const PLATFORMS = ["linkedin", "twitter", "facebook", "instagram", "github", "youtube"];

export default function SuperAdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hero");
  const [heroContent, setHeroContent] = useState({});
  const [pricingPlans, setPricingPlans] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (me?.role !== "super_admin") {
        window.location.href = "/";
        return;
      }
      setUser(me);

      const [hero, pricing, announces, socials] = await Promise.all([
        base44.entities.LandingPageContent.filter({ section: "hero" }),
        base44.entities.LandingPageContent.filter({ section: "pricing" }),
        base44.entities.GlobalAnnouncement.filter({ is_active: true }),
        base44.entities.SocialLinks.filter({})
      ]);

      if (hero[0]) setHeroContent(hero[0]);
      if (pricing[0]) setPricingPlans(pricing[0].pricing_plans || []);
      setAnnouncements(announces);

      const socialMap = {};
      socials.forEach(s => {
        socialMap[s.platform] = s;
      });
      setSocialLinks(socialMap);
    }).finally(() => setLoading(false));
  }, []);

  const saveHero = async () => {
    setSaving(true);
    try {
      if (heroContent.id) {
        await base44.entities.LandingPageContent.update(heroContent.id, heroContent);
      } else {
        await base44.entities.LandingPageContent.create({ ...heroContent, section: "hero" });
      }
      toast.success("Hero salvato");
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      const pricing = { ...heroContent, section: "pricing", pricing_plans: pricingPlans };
      if (pricing.id) {
        await base44.entities.LandingPageContent.update(pricing.id, pricing);
      } else {
        await base44.entities.LandingPageContent.create(pricing);
      }
      toast.success("Prezzi salvati");
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const saveSocialLink = async (platform, url, icon) => {
    setSaving(true);
    try {
      const link = socialLinks[platform];
      if (link?.id) {
        await base44.entities.SocialLinks.update(link.id, { url, icon_name: icon });
      } else {
        await base44.entities.SocialLinks.create({ platform, url, icon_name: icon });
      }
      setSocialLinks(prev => ({
        ...prev,
        [platform]: { ...prev[platform], url, icon_name: icon }
      }));
      toast.success(`${platform} aggiornato`);
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  if (loading) return <PageLoader color="red" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Super Admin Settings</h1>
            <p className="text-slate-600">Gestione piattaforma (accesso ristretto)</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          {[
            { id: "hero", label: "Hero", icon: Globe },
            { id: "pricing", label: "Pricing", icon: DollarSign },
            { id: "announcements", label: "Annunci", icon: Megaphone },
            { id: "social", label: "Social Links", icon: Share2 },
            { id: "stripe", label: "Stripe & Piani", icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Hero Content */}
        {activeTab === "hero" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Titolo Hero</label>
              <input
                type="text"
                value={heroContent.hero_title || ""}
                onChange={e => setHeroContent({ ...heroContent, hero_title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Gestione Risorse Umane Semplice e Efficace"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sottotitolo Hero</label>
              <textarea
                value={heroContent.hero_subtitle || ""}
                onChange={e => setHeroContent({ ...heroContent, hero_subtitle: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="PulseHR ti permette di gestire..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">CTA Button Text</label>
              <input
                type="text"
                value={heroContent.hero_cta_text || ""}
                onChange={e => setHeroContent({ ...heroContent, hero_cta_text: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Registra Azienda"
              />
            </div>
            <button
              onClick={saveHero}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Salvataggio..." : "Salva Hero"}
            </button>
          </div>
        )}

        {/* Pricing */}
        {activeTab === "pricing" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <p className="text-sm text-slate-600">Modifica i piani di prezzo:</p>
            {pricingPlans.map((plan, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-3">
                <input
                  type="text"
                  value={plan.name || ""}
                  onChange={e => {
                    const newPlans = [...pricingPlans];
                    newPlans[idx].name = e.target.value;
                    setPricingPlans(newPlans);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome piano"
                />
                <input
                  type="text"
                  value={plan.price || ""}
                  onChange={e => {
                    const newPlans = [...pricingPlans];
                    newPlans[idx].price = e.target.value;
                    setPricingPlans(newPlans);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="€99"
                />
              </div>
            ))}
            <button
              onClick={savePricing}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Salvataggio..." : "Salva Prezzi"}
            </button>
          </div>
        )}

        {/* Announcements */}
        {activeTab === "announcements" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            {announcements.length === 0 ? (
              <p className="text-slate-600">Nessun annuncio attivo</p>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                  <p className="text-sm text-slate-600 mt-2">{ann.content}</p>
                  <p className="text-xs text-slate-400 mt-2">Tipo: {ann.type}</p>
                </div>
              ))
            )}
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 text-sm">
              + Nuovo Annuncio
            </button>
          </div>
        )}

        {/* Social Links */}
        {activeTab === "social" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            {PLATFORMS.map(platform => (
              <div key={platform} className="p-4 border border-slate-200 rounded-lg space-y-3">
                <label className="block font-semibold text-slate-900 capitalize">{platform}</label>
                <input
                  type="text"
                  value={socialLinks[platform]?.url || ""}
                  onChange={e => {
                    const icon = socialLinks[platform]?.icon_name || platform;
                    saveSocialLink(platform, e.target.value, icon);
                  }}
                  placeholder={`https://${platform}.com/...`}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        )}
        {/* Stripe Plans */}
        {activeTab === "stripe" && (
          <StripePlansManager />
        )}
      </div>
    </AppShell>
  );
}