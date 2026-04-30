"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  Building2,
  FileText,
  LayoutDashboard,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

/**
 * How It Works - 3 step guide
 */
const STEPS = [
  {
    step: 1,
    title: "Registra azienda o consulente",
    description: "Crea il tuo account aziendale o come consulente del lavoro in pochi minuti.",
    icon: Building2,
    color: "primary",
  },
  {
    step: 2,
    title: "Aggiungi dipendenti e documenti",
    description: "Importa anagrafiche dipendenti, carica contratti e documenti HR necessari.",
    icon: FileText,
    color: "info",
  },
  {
    step: 3,
    title: "Gestisci e monitora",
    description: "Dashboard operativa per timbrature, approvazione ferie, report e compliance.",
    icon: LayoutDashboard,
    color: "success",
  },
];

/**
 * Solutions per role
 */
const SOLUTIONS = [
  {
    icon: Building2,
    title: "Aziende",
    description: "Controlla presenze, ferie e documenti senza rincorrere email o file Excel.",
    benefits: [
      "Dashboard operativa",
      "Approvazione ferie guidata",
      "Report automatici",
    ],
    cta: "Inizia ora",
    ctaLink: "/register/company",
  },
  {
    icon: Building2,
    title: "Consulenti del lavoro",
    description: "Gestisci più aziende clienti, scadenze e documenti da un'unica vista.",
    benefits: [
      "Multi-azienda",
      "Scadenze in vista unica",
      "Audit trail completo",
    ],
    cta: "Diventa partner",
    ctaLink: "/register/consultant",
  },
  {
    icon: Building2,
    title: "Dipendenti",
    description: "Timbra, richiedi ferie e consulta documenti in pochi tocchi.",
    benefits: [
      "Timbratura 1-tap",
      "Richiesta ferie mobile",
      "Documenti sempre aggiornati",
    ],
    cta: "Scopri come",
    ctaLink: "/register/company",
  },
];

export function HowItWorksSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="come-funziona" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Inizia in 3 passaggi</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Come Funziona
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Tre semplici passaggi per iniziare a gestire il tuo team con PulseHR.
            Nessuna configurazione complessa.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {STEPS.map((step, index) => (
            <div
              key={index}
              className={cn(
                "relative text-center",
                mounted ? "animate-fade-in-up" : "opacity-0"
              )}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Step Number */}
              <div className="w-12 h-12 rounded-full bg-primary text-white font-bold text-xl inline-flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                {step.step}
              </div>

              {/* Icon Container */}
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-110",
                step.color === "primary" && "bg-primary/10",
                step.color === "info" && "bg-info/10",
                step.color === "success" && "bg-success/10"
              )}>
                <step.icon className={cn(
                  "w-10 h-10",
                  step.color === "primary" && "text-primary",
                  step.color === "info" && "text-info",
                  step.color === "success" && "text-success"
                )} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted leading-relaxed">
                {step.description}
              </p>

              {/* Connector Line (hidden on mobile) */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}
            </div>
          ))}
        </div>

        {/* Solutions Per Role */}
        <div className="border-t border-border pt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Pulse HR per ogni ruolo
            </h3>
            <p className="text-lg text-muted">
              Funzionalità pensate per le esigenze specifiche di ciascun utente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {SOLUTIONS.map((solution, index) => (
              <div
                key={index}
                className={cn(
                  "p-6 bg-surface rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all",
                  mounted ? "animate-fade-in-up" : "opacity-0"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <solution.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Title & Description */}
                <h4 className="text-xl font-bold text-foreground mb-2">
                  {solution.title}
                </h4>
                <p className="text-muted mb-4 leading-relaxed">{solution.description}</p>

                {/* Benefits List */}
                <ul className="space-y-2 mb-6">
                  {solution.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-muted">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={solution.ctaLink}
                  className="text-sm font-medium text-primary hover:text-primary-strong inline-flex items-center gap-1"
                >
                  {solution.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}