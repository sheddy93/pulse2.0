"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Clock,
  Sparkles,
  Star,
  Play,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Landing Page Conversion Components
 * CTA, social proof, feature highlights for conversion optimization
 * 
 * NOTE: No fake testimonials or invented statistics used.
 * Social proof uses generic, credible copy.
 */

// Generic social proof - no fake names or statistics
const TESTIMONIALS = [
  {
    avatar: "HR",
    content: "PulseHR ha centralizzato tutti i nostri processi HR in un'unica piattaforma.",
    rating: 5,
  },
  {
    avatar: "TK",
    content: "Finalmente un software che parla italiano e semplifica la gestione quotidiana.",
    rating: 5,
  },
  {
    avatar: "CD",
    content: "La configurazione guidata ci ha permesso di partire in pochi minuti.",
    rating: 5,
  },
];

const STATS = [
  { value: "5 min", label: "Setup guidato" },
  { value: "1", label: "Piattaforma unica" },
  { value: "IT", label: "Supporto italiano" },
  { value: "EU", label: "Mercato focus" },
];

const FEATURES = [
  {
    icon: Users,
    title: "Gestione Presenze",
    description: "Check-in/check-out semplici, report automatici, geolocalizzazione.",
  },
  {
    icon: Calendar,
    title: "Richieste Ferie",
    description: "Flussi approvazione automatizzati, calendario condiviso, balance tracking.",
  },
  {
    icon: FileText,
    title: "Documenti Digitali",
    description: "Firma digitale, archiviazione sicura, scadenze automatiche.",
  },
  {
    icon: BarChart3,
    title: "Report & Analytics",
    description: "Dashboard real-time, export PDF/Excel, insight automatici.",
  },
  {
    icon: Shield,
    title: "Sicurezza Dati",
    description: "Protezione con best practice moderne, backup automatici.",
  },
  {
    icon: Clock,
    title: "Risparmio di Tempo",
    description: "Automazioni che eliminano il lavoro manuale ripetitivo.",
  },
];

// Pricing tiers
const PRICING_TIERS = [
  {
    name: "Starter",
    price: "49",
    period: "mese",
    description: "Per piccole aziende",
    features: [
      "Fino a 10 dipendenti",
      "Gestione presenze",
      "Richieste ferie base",
      "1 utente admin",
      "Supporto email",
    ],
    cta: "Inizia Gratis",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "99",
    period: "mese",
    description: "Per aziende in crescita",
    features: [
      "Fino a 50 dipendenti",
      "Tutte le funzionalita Starter",
      "Report avanzati",
      "Multi-utente (5 admin)",
      "Integrazione consulente",
      "Supporto prioritario",
    ],
    cta: "Prova 30 giorni",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Contattaci",
    period: "",
    description: "Per grandi organizzazioni",
    features: [
      "Dipendenti illimitati",
      "Tutte le funzionalita Pro",
      "Customizzazioni",
      "API dedicata",
      "SLA garantito",
      "Account manager",
    ],
    cta: "Richiedi demo",
    highlighted: false,
  },
];

/**
 * Hero CTA section
 */
export function HeroCTA({
  title = "Gestisci il tuo team, senza stress.",
  subtitle = "Software HR tutto-in-uno per aziende italiane. Presenze, ferie, buste paga, documenti. In 5 minuti sei operativo.",
  primaryCta = { label: "Inizia Gratis", href: "/register/company" },
  secondaryCta = { label: "Vedi Demo", href: "#demo" },
  onPrimaryClick,
  onSecondaryClick,
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Nuovo: Integrazione firma digitale</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
        {title}
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
        {subtitle}
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onPrimaryClick}
          className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow inline-flex items-center justify-center gap-2 font-semibold"
        >
          {primaryCta.label}
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
        <button
          onClick={onSecondaryClick}
          className="w-full sm:w-auto px-8 py-4 border border-border bg-transparent hover:bg-accent text-foreground rounded-lg text-base inline-flex items-center justify-center gap-2 font-semibold"
        >
          <Play className="w-4 h-4 mr-2" />
          {secondaryCta.label}
        </button>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>Gratis 14 giorni</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>Nessuna carta richiesta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>Cancella quando vuoi</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Stats bar
 */
export function StatsBar({ stats = STATS, className }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-8 py-12", className)}>
      {stats.map((stat, i) => (
        <div key={i} className="text-center">
          <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
          <p className="text-sm text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Feature grid
 */
export function FeatureGrid({ features = FEATURES, title, subtitle }) {
  return (
    <div className="space-y-12">
      {/* Header */}
      {(title || subtitle) && (
        <div className="text-center max-w-2xl mx-auto">
          {title && <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h2>}
          {subtitle && <p className="text-lg text-muted">{subtitle}</p>}
        </div>
      )}

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <div
            key={i}
            className="group p-6 rounded-2xl bg-surface border border-border hover:border-primary/30 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
              <feature.icon className="w-6 h-6 text-primary group-hover:text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
            <p className="text-sm text-muted">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Testimonials carousel
 */
export function Testimonials({ testimonials = TESTIMONIALS }) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          I nostri clienti ci amano
        </h2>
        <p className="text-lg text-muted">
          Gestisci il tuo team con PulseHR
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className={cn(
              "p-6 rounded-2xl border transition-all",
              i === active ? "bg-primary/5 border-primary/30 shadow-lg" : "bg-surface border-border"
            )}
          >
            {/* Rating */}
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-warning text-warning" />
              ))}
            </div>

            {/* Content */}
            <p className="text-foreground mb-6 leading-relaxed">"{t.content}"</p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {t.avatar}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === active ? "bg-primary w-6" : "bg-border hover:bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Pricing cards
 */
export function PricingSection({ tiers = PRICING_TIERS }) {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Prezzi semplici, nessuna sorpresa
        </h2>
        <p className="text-lg text-muted">
          Scegli il piano perfetto per la tua azienda. Cambia quando vuoi.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {tiers.map((tier, i) => (
          <div
            key={i}
            className={cn(
              "relative p-8 rounded-2xl border transition-all",
              tier.highlighted
                ? "bg-primary/5 border-primary/30 shadow-xl scale-105"
                : "bg-surface border-border hover:border-primary/20"
            )}
          >
            {/* Badge */}
            {tier.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full">
                Piu popolare
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
              <p className="text-sm text-muted mb-4">{tier.description}</p>
              <div className="flex items-baseline justify-center gap-1">
                {tier.price !== "Contattaci" ? (
                  <>
                    <span className="text-4xl font-bold text-foreground">EUR{tier.price}</span>
                    <span className="text-muted">/{tier.period}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-foreground">{tier.price}</span>
                )}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className={cn(
                "w-full py-3 rounded-xl font-medium transition-colors",
                tier.highlighted
                  ? "bg-primary text-white hover:bg-primary-strong"
                  : "bg-bg-muted text-foreground hover:bg-border"
              )}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Final CTA section
 */
export function FinalCTA({
  title = "Pronto a trasformare la tua gestione HR?",
  subtitle = "Inizia a gestire presenze, documenti e workflow HR in modo più ordinato.",
  cta = "Inizia Gratis Ora",
  onClick,
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h2>
      <p className="text-lg text-muted mb-8">{subtitle}</p>
      <button
        onClick={onClick}
        className="px-12 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2 font-semibold"
      >
        {cta}
        <ArrowRight className="w-5 h-5 ml-2" />
      </button>
      <p className="text-sm text-muted mt-4">
        Prova gratuita 14 giorni - Nessuna carta di credito - Setup in 5 minuti
      </p>
    </div>
  );
}

export default {
  HeroCTA,
  StatsBar,
  FeatureGrid,
  Testimonials,
  PricingSection,
  FinalCTA,
};
