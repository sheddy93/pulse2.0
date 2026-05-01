import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/hooks/useI18n";
import { Users, Clock, FileText, TrendingUp, Shield, Zap, CheckCircle2, ArrowRight, Menu, X, Star, Smartphone, Monitor, Zap as ZapIcon, BarChart3, Calendar, Lock } from "lucide-react";
import { motion } from "framer-motion";
import DemoRequestModal from "@/components/landing/DemoRequestModal";

const LOGO = "https://media.base44.com/images/public/69f3ad50c2e669c8723343df/7bee81eaa_ChatGPTImage1mag202619_47_14.png";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// Screenshot mockup delle feature principali
const FEATURE_SCREENS = [
  {
    id: 'attendance',
    title: 'Timbratura Intelligente',
    subtitle: 'GPS in tempo reale con geofence',
    description: 'Tracciamento automatico delle presenze con geolocalizzazione e alert di anomalie',
    icon: Clock,
    color: 'from-emerald-500 to-teal-600',
    features: ['📍 Geofence dinamico', '🔔 Alert istantanei', '📊 Analytics real-time', '📱 Mobile-first']
  },
  {
    id: 'documents',
    title: 'Gestione Documenti',
    subtitle: 'Firma digitale integrata',
    description: 'Template personalizzati, firma digitale e tracking scadenze automatico',
    icon: FileText,
    color: 'from-blue-500 to-indigo-600',
    features: ['📄 Template custom', '✍️ Firma digitale', '⏰ Reminder scadenze', '📧 Notifiche email']
  },
  {
    id: 'training',
    title: 'Piattaforma Formazione',
    subtitle: 'LMS integrato',
    description: 'Corsi, certificazioni e piani formativi con tracking progresso',
    icon: ZapIcon,
    color: 'from-purple-500 to-pink-600',
    features: ['🎓 Corsi online', '📜 Certificazioni', '📈 Progresso real-time', '🏆 Badge achievement']
  },
  {
    id: 'shifts',
    title: 'Gestione Turni',
    subtitle: 'Calendario intelligente',
    description: 'Assegnazione, scambio turni e alert per copertura',
    icon: Calendar,
    color: 'from-orange-500 to-red-600',
    features: ['📅 Calendario interattivo', '⚠️ Alert copertura', '🔄 Scambio turni', '📊 Analytics turni']
  },
  {
    id: 'performance',
    title: 'Valutazioni 360°',
    subtitle: 'Feedback strutturato',
    description: 'Sistema di valutazione multi-rater con analytics comportamentali',
    icon: BarChart3,
    color: 'from-yellow-500 to-orange-600',
    features: ['⭐ Valutazioni 360', '💬 Feedback annuale', '📊 Dashboard analytics', '🎯 Obiettivi SMART']
  },
  {
    id: 'security',
    title: 'Sicurezza Enterprise',
    subtitle: 'GDPR compliant',
    description: 'Autenticazione avanzata, audit log e conformità normativa',
    icon: Lock,
    color: 'from-slate-600 to-slate-800',
    features: ['🔐 SSO/SAML', '📋 Audit log completo', '🔒 GDPR compliant', '🛡️ Backup automatico']
  }
];

// Dashboard per ruoli (escluso SuperAdmin - interno)
const ROLE_DASHBOARDS = [
  {
    role: 'Dipendente',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    features: [
      { label: 'Timbratura', detail: 'Check-in/out con GPS' },
      { label: 'Miei Turni', detail: 'Calendario personalizzato' },
      { label: 'Ferie & Permessi', detail: 'Richieste e saldo' },
      { label: 'Formazione', detail: 'Corsi e certificati' },
      { label: 'Documenti', detail: 'Contratto e allegati' },
      { label: 'Feedback', detail: 'Valutazioni ricevute' }
    ]
  },
  {
    role: 'Manager/HR',
    icon: Clock,
    color: 'from-emerald-500 to-emerald-600',
    features: [
      { label: 'Presenze Team', detail: 'Dashboard presenze' },
      { label: 'Approvazioni', detail: 'Ferie, straord., doc.' },
      { label: 'Team Analytics', detail: 'KPI del team' },
      { label: 'Turni', detail: 'Assegnazione e alert' },
      { label: 'Performance', detail: 'Valutazioni team' },
      { label: 'Workflow', detail: 'Processi automatici' }
    ]
  },
  {
    role: 'Amministratore Azienda',
    icon: Shield,
    color: 'from-purple-500 to-purple-600',
    features: [
      { label: 'Gestione Azienda', detail: 'Dati, sedi, reparti' },
      { label: 'Utenti & Ruoli', detail: 'Permessi granulari' },
      { label: 'Feature Licensing', detail: 'Attiva/disattiva' },
      { label: 'Integrazioni', detail: 'API, Slack, etc.' },
      { label: 'HR Analytics', detail: 'Dashboard BI avanzata' },
      { label: 'Audit Log', detail: 'Compliance GDPR' }
    ]
  }
];

export default function LandingInnovative() {
  const { lang, t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState('attendance');
  const [activeRoleTab, setActiveRoleTab] = useState(0);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const currentFeature = FEATURE_SCREENS.find(f => f.id === activeFeature);
  const currentRole = ROLE_DASHBOARDS[activeRoleTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src={LOGO} alt="AldevionHR" className="h-8 md:h-10 w-auto" />
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AldevionHR</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Features</a>
            <a href="#dashboards" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Dashboards</a>
            <a href="#pricing" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Prezzi</a>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="px-4 md:px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all text-xs md:text-sm"
            >
              Accedi
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden border-t border-blue-500/20 bg-slate-950 p-4 space-y-2">
            <a href="#features" className="block px-4 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-blue-500/10">Features</a>
            <a href="#dashboards" className="block px-4 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-blue-500/10">Dashboards</a>
            <a href="#pricing" className="block px-4 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-blue-500/10">Prezzi</a>
          </motion.div>
        )}
      </motion.header>

      {/* Hero Enhanced */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-32 space-y-8 md:space-y-12">
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 md:space-y-8">
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              HR Moderno,<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Semplice ed Efficiente
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl">
              Gestione completa dei dipendenti: presenze, documenti, formazione, turni e performance in una sola piattaforma
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
            <button
              onClick={() => setShowDemoModal(true)}
              className="group px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 transition-all hover:scale-105 text-sm md:text-base"
            >
              ⭐ Prova 14 giorni <ArrowRight className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="/auth/register/consultant"
              className="px-6 md:px-8 py-3 md:py-4 border-2 border-violet-400 text-violet-300 rounded-xl font-semibold hover:bg-violet-500/10 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              Sono un Consulente
            </a>
          </motion.div>

          <motion.div variants={fadeInUp} className="pt-6 md:pt-10 flex items-center gap-4 md:gap-6 flex-wrap">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-slate-950" />
              ))}
            </div>
            <div>
              <p className="text-slate-300 font-medium text-sm md:text-base">+50 aziende italiane</p>
              <p className="text-xs md:text-sm text-slate-500">Già utilizzano AldevionHR</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Visual Divider */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />

      {/* Features Interactive */}
      <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-12 md:space-y-16">
          <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }} className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Funzionalità Potenti</h2>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">Tutto quello che serve per gestire le HR in modo moderno</p>
          </motion.div>

          {/* Feature Grid */}
          <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {FEATURE_SCREENS.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeature === feature.id;
              const gradients = {
                attendance: 'from-emerald-500 to-teal-600',
                documents: 'from-blue-500 to-indigo-600',
                training: 'from-purple-500 to-pink-600',
                shifts: 'from-orange-500 to-red-600',
                performance: 'from-yellow-500 to-orange-600',
                security: 'from-slate-600 to-slate-800'
              };
              return (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  whileHover={{ y: -4 }}
                  className={`p-4 rounded-lg border transition-all text-center space-y-2 ${
                    isActive
                      ? `border-transparent bg-gradient-to-br ${gradients[feature.id]} ring-2 ring-offset-2 ring-offset-slate-950`
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className={`text-xs md:text-sm font-medium line-clamp-2 ${isActive ? 'text-white' : 'text-slate-400'}`}>{feature.title}</div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Feature Detail */}
          {currentFeature && (
            <motion.div
              key={currentFeature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-blue-500/20 rounded-2xl p-6 md:p-10 space-y-6 md:space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div className="space-y-4 md:space-y-6">
                  <div className={`inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r ${currentFeature.color} rounded-full text-white font-semibold text-sm`}>
                    ✨ {currentFeature.subtitle}
                  </div>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold">{currentFeature.title}</h3>
                  <p className="text-lg text-slate-300">{currentFeature.description}</p>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    {currentFeature.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`hidden md:block h-96 bg-gradient-to-br ${currentFeature.color} rounded-xl shadow-2xl flex items-center justify-center`}>
                  <div className="text-center text-white/50">
                    <div className="text-6xl mb-2">{currentFeature.icon === Clock ? '⏱️' : currentFeature.icon === FileText ? '📄' : currentFeature.icon === Zap ? '⚡' : currentFeature.icon === Calendar ? '📅' : currentFeature.icon === BarChart3 ? '📊' : '🔒'}</div>
                    <p className="text-sm">Preview Feature</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Visual Divider */}
      <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500" />

      {/* Role Dashboards */}
      <section id="dashboards" className="py-20 md:py-28 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-12 md:space-y-16">
          <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }} className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Dashboard Personalizzati</h2>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">Ogni ruolo ha la propria interfaccia ottimizzata</p>
          </motion.div>

          {/* Role Tabs */}
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
            {ROLE_DASHBOARDS.map((roleItem, idx) => {
              const Icon = roleItem.icon;
              return (
                <motion.button
                  key={idx}
                  onClick={() => setActiveRoleTab(idx)}
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg border transition-all font-medium text-sm md:text-base ${
                    activeRoleTab === idx
                      ? `bg-gradient-to-r ${roleItem.color} border-transparent text-white`
                      : 'border-blue-500/20 bg-blue-500/5 text-slate-300 hover:border-blue-500/40'
                  }`}
                >
                  <Icon className="w-4 md:w-5 h-4 md:h-5" />
                  <span className="hidden sm:inline">{roleItem.role}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Dashboard Features Grid */}
          <motion.div
            key={activeRoleTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {currentRole.features.map((feature, i) => {
              const colors = ['from-emerald-500/20 to-teal-600/20', 'from-blue-500/20 to-indigo-600/20', 'from-purple-500/20 to-pink-600/20', 'from-orange-500/20 to-red-600/20', 'from-yellow-500/20 to-orange-600/20', 'from-slate-600/20 to-slate-800/20'];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 md:p-6 rounded-xl border border-slate-700 bg-gradient-to-br ${colors[i % colors.length]} hover:border-slate-600 transition-all`}
                >
                  <h4 className="font-semibold text-white mb-1">{feature.label}</h4>
                  <p className="text-sm text-slate-400">{feature.detail}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Visual Divider */}
      <div className="h-1 bg-gradient-to-r from-pink-500 via-blue-500 to-emerald-500" />

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 border-y border-purple-500/20">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-6 md:space-y-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Pronto a Trasformare le Tue HR?</h2>
          <p className="text-lg md:text-xl text-slate-300">Inizia gratuitamente, nessuna carta di credito richiesta</p>
          <button
            onClick={() => setShowDemoModal(true)}
            className="px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all text-base md:text-lg inline-block"
          >
            ⭐ Inizia la prova gratuita
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-blue-500/20 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center">
            <p className="text-sm text-slate-500">&copy; 2026 AldevionHR. Gestione HR intelligente e connessa.</p>
          </div>
        </div>
      </footer>

      {showDemoModal && <DemoRequestModal onClose={() => setShowDemoModal(false)} />}
    </div>
  );
}