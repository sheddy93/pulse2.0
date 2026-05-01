import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n, LANGUAGES } from "@/hooks/useI18n";
import { Users, Clock, FileText, TrendingUp, Shield, Zap, CheckCircle2, ArrowRight, Menu, X, Star, Instagram, Facebook, Linkedin, Music } from "lucide-react";
import { motion } from "framer-motion";
import DemoRequestModal from "@/components/landing/DemoRequestModal";

const LOGO = "https://media.base44.com/images/public/69f3ad50c2e669c8723343df/a5026eec8_generated_image.png";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingNew() {
  const { lang, t, changeLang } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [heroContent, setHeroContent] = useState(null);
  const [dbPricingPlans, setDbPricingPlans] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    base44.entities.LandingPageContent.filter({ section: "hero" }).then(r => { if (r[0]) setHeroContent(r[0]); });
    base44.entities.LandingPageContent.filter({ section: "pricing" }).then(r => { if (r[0]?.pricing_plans?.length) setDbPricingPlans(r[0].pricing_plans); });
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="PulseHR" className="h-10 w-10" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">PulseHR</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Features</a>
            <a href="#benefits" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Benefits</a>
            <a href="#pricing" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Pricing</a>
          </nav>

          {/* Language & Auth */}
          <div className="flex items-center gap-4">
            <select
              value={lang}
              onChange={e => changeLang(e.target.value)}
              className="px-3 py-1.5 bg-slate-800/50 border border-blue-500/30 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {Object.entries(LANGUAGES).map(([code, { name }]) => (
                <option key={code} value={code} className="bg-slate-900">{name}</option>
              ))}
            </select>
            <button
              onClick={handleLogin}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all text-sm"
            >
              {t('get_started')}
            </button>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden border-t border-blue-500/20 bg-slate-950">
            <nav className="flex flex-col gap-1 p-4">
              <a href="#features" className="px-4 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-blue-500/10 font-medium">Features</a>
              <a href="#benefits" className="px-4 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-blue-500/10 font-medium">Benefits</a>
              <a href="#pricing" className="px-4 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-blue-500/10 font-medium">Pricing</a>
            </nav>
          </motion.div>
        )}
      </motion.header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              {(() => {
                const title = heroContent?.hero_title || t('hero_title');
                const words = title.split(' ');
                const half = Math.ceil(words.length / 2);
                return <>{words.slice(0, half).join(' ')} <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{words.slice(half).join(' ')}</span></>;
              })()}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl">
              {heroContent?.hero_subtitle || t('hero_subtitle')}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => setShowDemoModal(true)}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              ⭐ Prova gratis 14 giorni <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="/auth/register/consultant"
              className="px-8 py-4 border-2 border-violet-400 text-violet-300 rounded-xl font-semibold hover:bg-violet-500/10 transition-all flex items-center justify-center gap-2"
            >
              {t('hero_cta_consultant')}
            </a>
          </motion.div>

          <motion.div variants={fadeInUp} className="pt-10 flex items-center gap-6 flex-wrap">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-slate-950" />
              ))}
            </div>
            <div>
              <p className="text-slate-300 font-medium">+50 aziende in Italia</p>
              <p className="text-sm text-slate-500">Si fidano di PulseHR</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }} className="text-center space-y-4">
            <h2 className="text-4xl font-bold">{t('features_title')}</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">{t('features_subtitle')}</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Clock, title: 'feature_1_title', desc: 'feature_1_desc' },
              { icon: TrendingUp, title: 'feature_2_title', desc: 'feature_2_desc' },
              { icon: Zap, title: 'feature_3_title', desc: 'feature_3_desc' },
              { icon: Users, title: 'feature_4_title', desc: 'feature_4_desc' },
              { icon: FileText, title: 'feature_5_title', desc: 'feature_5_desc' },
              { icon: Shield, title: 'feature_6_title', desc: 'feature_6_desc' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  className="p-6 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-slate-900/50 hover:border-blue-500/40 transition-all backdrop-blur"
                >
                  <Icon className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t(feature.title)}</h3>
                  <p className="text-slate-400 text-sm">{t(feature.desc)}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }} className="text-center space-y-4">
            <h2 className="text-4xl font-bold">{t('benefits_title')}</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {[1, 2, 3, 4].map((num) => (
              <motion.div
                key={num}
                variants={fadeInUp}
                className="flex gap-6 items-start p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold">{num}</span>
                </div>
                <p className="text-lg text-slate-300">{t(`benefits_${num}`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }} className="text-center space-y-4">
            <h2 className="text-4xl font-bold">{t('pricing_title')}</h2>
            <p className="text-xl text-slate-400">{t('pricing_subtitle')}</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {(dbPricingPlans || [
              { name: 'startup', price: '€99', users: '10', features: ['Gestione dipendenti', 'Presenze', 'Documenti', 'Chat'] },
              { name: 'professional', price: '€299', users: '50', popular: true, features: ['Tutto da Startup', 'Valutazioni 360°', 'Workflow', 'Export', 'API'] },
              { name: 'enterprise', price: 'Custom', users: 'unlimited', features: ['Tutto da Professional', 'SSO/SAML', 'Supporto dedicato', 'Custom'] },
            ]).map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className={`rounded-xl p-8 border transition-all ${
                  plan.popular
                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-slate-900/80 ring-2 ring-blue-500/50 md:scale-105'
                    : 'border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-slate-900/50'
                }`}
              >
                {plan.popular && (
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-500/30 rounded-full text-sm font-semibold border border-blue-400/50">
                    <Star className="w-4 h-4" /> {t('popular')}
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 capitalize">{t(plan.name)}</h3>
                <p className="text-sm text-slate-400 mb-4">{t('users_limit')}: {plan.users === 'unlimited' ? t('unlimited') : plan.users}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-400">/{t('per_month')}</span>
                </div>
                <button
                   onClick={() => setShowDemoModal(true)}
                   className={`w-full py-3 rounded-lg font-semibold mb-6 transition-all ${
                     plan.popular
                       ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                       : 'border border-blue-500/30 text-blue-300 hover:bg-blue-500/10'
                   }`}
                 >
                   ⭐ Prova gratis
                 </button>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-purple-600/20 border-y border-blue-500/20">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-6 text-center space-y-6"
        >
          <h2 className="text-4xl font-bold">{t('ready_title')}</h2>
          <p className="text-xl text-slate-300">{t('ready_subtitle')}</p>
          <button
            onClick={() => setShowDemoModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all text-lg"
          >
            ⭐ Prova 14 giorni gratis
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-blue-500/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-blue-500/10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={LOGO} alt="PulseHR" className="h-8 w-8" />
                <span className="font-bold text-blue-400">PulseHR</span>
              </div>
              <p className="text-sm text-slate-400">Gestione HR moderna per aziende innovative</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer_product')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition-colors">{t('pricing_title')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer_support')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">{t('footer_docs')}</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">{t('footer_help')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer_legal')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">{t('footer_privacy')}</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">{t('footer_terms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center hover:scale-110 transition-transform">
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:scale-110 transition-transform">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center hover:scale-110 transition-transform">
                <Linkedin className="w-5 h-5 text-white" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 to-black flex items-center justify-center hover:scale-110 transition-transform border border-slate-700">
                <Music className="w-5 h-5 text-white" />
              </a>
            </div>
            <p className="text-sm text-slate-500">&copy; 2026 PulseHR. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>

      {showDemoModal && <DemoRequestModal onClose={() => setShowDemoModal(false)} />}
    </div>
  );
}