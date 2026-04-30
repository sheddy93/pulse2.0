"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Crown,
  Zap,
} from "lucide-react";

/**
 * Pricing tiers with real pricing data
 */
const PRICING_TIERS = [
  {
    name: "Starter",
    price: "Gratis",
    period: "",
    description: "Per piccole aziende fino a 5 dipendenti",
    highlight: false,
    badge: null,
    features: [
      "Fino a 5 dipendenti",
      "Gestione presenze base",
      "Richieste ferie semplici",
      "1 utente admin",
      "Supporto email",
    ],
    cta: "Inizia Gratis",
    ctaLink: "/register/company",
  },
  {
    name: "Professional",
    price: "9",
    period: "EUR/dipendente/mese",
    description: "Per aziende in crescita",
    highlight: true,
    badge: "Piu Popolare",
    features: [
      "Dipendenti illimitati",
      "Tutte le funzionalita Starter",
      "Report avanzati",
      "Multi-utente (fino a 10 admin)",
      "Integrazione consulente completa",
      "Supporto prioritario",
      "API access",
    ],
    cta: "Prova 14 giorni",
    ctaLink: "/register/company",
  },
  {
    name: "Enterprise",
    price: "19",
    period: "EUR/dipendente/mese",
    description: "Per grandi organizzazioni",
    highlight: false,
    badge: null,
    features: [
      "Tutto in Professional",
      "Account manager dedicato",
      "Customizzazioni",
      "Training personalizzato",
      "Integrazioni premium",
      "Supporto telefonico",
    ],
    cta: "Richiedi Demo",
    ctaLink: "/register/company",
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Prezzi Trasparenti</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Scegli il piano perfetto per la tua azienda
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
            Nessun costo nascosto. Cambia piano quando vuoi. Cancella in qualsiasi momento.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 bg-surface rounded-xl border border-border">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted hover:text-foreground"
              )}
            >
              Mensile
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                billingCycle === "annual"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted hover:text-foreground"
              )}
            >
              Annuale
              <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {PRICING_TIERS.map((tier, index) => (
            <div
              key={index}
              className={cn(
                "relative p-8 rounded-2xl border transition-all",
                tier.highlight
                  ? "bg-primary/5 border-primary/30 shadow-xl scale-105"
                  : "bg-surface border-border hover:border-primary/20",
                mounted ? "animate-fade-in-up" : "opacity-0"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {tier.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-muted mb-4">{tier.description}</p>

                {/* Price */}
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm text-muted ml-1">{tier.period}</span>
                  )}
                </div>

                {/* Annual discount note */}
                {billingCycle === "annual" && tier.price !== "Gratis" && (
                  <p className="text-xs text-success mt-2">
                    Risparmi ~{Math.round(parseInt(tier.price) * 0.2 * 12)} EUR/anno
                  </p>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={tier.ctaLink}
                className={cn(
                  "block w-full py-3 rounded-xl font-medium text-center transition-colors",
                  tier.highlight
                    ? "bg-primary text-white hover:bg-primary-strong"
                    : "bg-bg text-foreground hover:bg-primary hover:text-white border border-border"
                )}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Pricing Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Tutti i piani includono: Setup guidato, Supporto in italiano, Aggiornamenti automatici
          </p>
        </div>
      </div>
    </section>
  );
}