import { useState, useCallback } from 'react';

export const LANGUAGES = {
  it: { name: 'Italiano', flag: '🇮🇹' },
  en: { name: 'English', flag: '🇬🇧' },
};

const translations = {
  it: {
    // Hero
    hero_title: 'Gestione Risorse Umane Innovativa e Intelligente',
    hero_subtitle: 'PulseHR trasforma il tuo HR con automazioni intelligenti, analytics real-time e experience memorabile per dipendenti.',
    hero_cta_company: 'Registra la Tua Azienda',
    hero_cta_consultant: 'Diventa Consulente',
    
    // Features
    features_title: 'Funzionalità Rivoluzionarie',
    features_subtitle: 'Tutto ciò che serve per un HR moderno e efficiente',
    
    feature_1_title: 'Timbratura Intelligente',
    feature_1_desc: 'GPS, offline-first, sincronizzazione automatica',
    
    feature_2_title: 'Analytics Real-Time',
    feature_2_desc: 'Dashboard avanzate con insights predittivi',
    
    feature_3_title: 'Automazioni Intelligenti',
    feature_3_desc: 'Workflow di approvazione, notifiche smart',
    
    feature_4_title: 'Competenze & Formazione',
    feature_4_desc: 'Gestione sviluppo e scadenziario certificazioni',
    
    feature_5_title: 'Documenti Digitali',
    feature_5_desc: 'Upload, firma digitale, tracciamento scadenze',
    
    feature_6_title: 'Mobile-First PWA',
    feature_6_desc: 'App nativa su iOS e Android',
    
    // Benefits
    benefits_title: 'Perché Scegliere PulseHR?',
    benefits_1: 'Interfaccia Intuitiva: Non serve training, tutti la usano subito',
    benefits_2: 'Scalabile: Dalla startup alle grandi aziende, senza compromessi',
    benefits_3: 'Integrazioni: Collega i tuoi strumenti preferiti',
    benefits_4: 'Mobile & Offline: Funziona sempre, anche senza internet',
    
    // Pricing
    pricing_title: 'Prezzi Trasparenti',
    pricing_subtitle: 'Scegli il piano giusto',
    startup: 'Startup',
    professional: 'Professional',
    enterprise: 'Enterprise',
    popular: 'Più Popolare',
    users_limit: 'dipendenti',
    unlimited: 'Illimitato',
    per_month: 'al mese',
    contact_us: 'Contattaci',
    
    // CTA
    ready_title: 'Pronti a Trasformare l\'HR?',
    ready_subtitle: 'Inizia gratuitamente oggi. Nessuna carta di credito.',
    get_started: 'Inizia Ora',
    
    // Footer
    footer_product: 'Prodotto',
    footer_support: 'Supporto',
    footer_legal: 'Legal',
    footer_docs: 'Documentazione',
    footer_help: 'Help Center',
    footer_contacts: 'Contatti',
    footer_privacy: 'Privacy',
    footer_terms: 'Termini',
    footer_cookies: 'Cookie',
  },
  en: {
    // Hero
    hero_title: 'Innovative and Intelligent HR Management',
    hero_subtitle: 'PulseHR transforms your HR with smart automations, real-time analytics and memorable employee experience.',
    hero_cta_company: 'Register Your Company',
    hero_cta_consultant: 'Become a Consultant',
    
    // Features
    features_title: 'Revolutionary Features',
    features_subtitle: 'Everything you need for modern and efficient HR',
    
    feature_1_title: 'Smart Time Tracking',
    feature_1_desc: 'GPS, offline-first, automatic sync',
    
    feature_2_title: 'Real-Time Analytics',
    feature_2_desc: 'Advanced dashboards with predictive insights',
    
    feature_3_title: 'Smart Automations',
    feature_3_desc: 'Approval workflows, smart notifications',
    
    feature_4_title: 'Skills & Training',
    feature_4_desc: 'Development management and certification expiry',
    
    feature_5_title: 'Digital Documents',
    feature_5_desc: 'Upload, digital signature, expiry tracking',
    
    feature_6_title: 'Mobile-First PWA',
    feature_6_desc: 'Native app on iOS and Android',
    
    // Benefits
    benefits_title: 'Why Choose PulseHR?',
    benefits_1: 'Intuitive Interface: No training needed, everyone uses it immediately',
    benefits_2: 'Scalable: From startup to enterprise, no compromises',
    benefits_3: 'Integrations: Connect your favorite tools',
    benefits_4: 'Mobile & Offline: Always works, even without internet',
    
    // Pricing
    pricing_title: 'Transparent Pricing',
    pricing_subtitle: 'Choose the right plan',
    startup: 'Startup',
    professional: 'Professional',
    enterprise: 'Enterprise',
    popular: 'Most Popular',
    users_limit: 'employees',
    unlimited: 'Unlimited',
    per_month: 'per month',
    contact_us: 'Contact Us',
    
    // CTA
    ready_title: 'Ready to Transform HR?',
    ready_subtitle: 'Start free today. No credit card required.',
    get_started: 'Get Started',
    
    // Footer
    footer_product: 'Product',
    footer_support: 'Support',
    footer_legal: 'Legal',
    footer_docs: 'Documentation',
    footer_help: 'Help Center',
    footer_contacts: 'Contacts',
    footer_privacy: 'Privacy',
    footer_terms: 'Terms',
    footer_cookies: 'Cookies',
  },
};

export const useI18n = () => {
  const [lang, setLang] = useState('it');

  const t = useCallback(
    (key) => {
      return translations[lang][key] || key;
    },
    [lang]
  );

  const changeLang = useCallback((newLang) => {
    if (LANGUAGES[newLang]) {
      setLang(newLang);
      localStorage.setItem('preferredLanguage', newLang);
    }
  }, []);

  return { lang, t, changeLang, LANGUAGES };
};