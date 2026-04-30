"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import {
  Zap,
  Shield,
  Globe,
  Headphones,
  Server,
  Lock,
  Database,
  CheckCircle2,
} from "lucide-react";

/**
 * Stats Section Component
 * Uses real product features instead of fake user counts
 */
const STATS = [
  {
    icon: Zap,
    value: "5 min",
    label: "Setup guidato",
    description: "Dalla registrazione al primo dipendente",
  },
  {
    icon: Shield,
    value: "EU",
    label: "Privacy",
    description: "Progettato con attenzione a privacy e ruoli",
  },
  {
    icon: Globe,
    value: "EU",
    label: "Focus",
    description: "Pensato per il mercato italiano",
  },
  {
    icon: Headphones,
    value: "IT",
    label: "Supporto",
    description: "Team italiano disponibile su tutti i piani",
  },
];

/**
 * Trust Badges Row
 */
const TRUST_BADGES = [
  { icon: Database, text: "Backup automatici" },
  { icon: Lock, text: "Dati protetti" },
  { icon: Shield, text: "Privacy design" },
  { icon: Server, text: "Pensato per PMI" },
];

export function StatsSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Main Stats Section */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Progettato per la compliance e la semplicita
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              PulseHR non è solo un software. È unpartner per la gestione HR conforme alle normative italiane ed europee.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, index) => (
              <div
                key={index}
                className={cn(
                  "relative p-6 rounded-2xl bg-bg border border-border text-center group hover:border-primary/30 transition-all",
                  mounted ? "animate-fade-in-up" : "opacity-0"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Value */}
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-lg font-medium text-primary mb-2">
                  {stat.label}
                </div>

                {/* Description */}
                <p className="text-sm text-muted">
                  {stat.description}
                </p>

                {/* Hover accent */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-secondary rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <section className="py-8 px-4 border-y border-border bg-bg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {TRUST_BADGES.map((badge, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-muted"
              >
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <badge.icon className="w-5 h-5 text-success" />
                </div>
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}