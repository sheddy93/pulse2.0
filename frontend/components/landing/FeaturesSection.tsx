"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import {
  Users,
  Calendar,
  FileText,
  Shield,
  BarChart3,
  Bell,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

/**
 * Features with icons and descriptions
 */
const FEATURES = [
  {
    icon: Users,
    title: "Presenze & Timbrature",
    description: "Check-in/check-out semplici, geolocalizzazione, report automatici delle presenze.",
    color: "primary",
    tag: "Attendance",
  },
  {
    icon: Calendar,
    title: "Ferie & Permessi",
    description: "Flussi di approvazione automatizzati, calendario condiviso, tracking balance ferie.",
    color: "success",
    tag: "Leave Management",
  },
  {
    icon: FileText,
    title: "Documenti HR",
    description: "Firma digitale, archiviazione sicura, scadenze automatiche e notifiche.",
    color: "info",
    tag: "Documents",
  },
  {
    icon: Shield,
    title: "Compliance GDPR",
    description: "Conformità completa al GDPR italiano, audit trail, gestione consenso.",
    color: "warning",
    tag: "Compliance",
  },
  {
    icon: BarChart3,
    title: "Report & Analytics",
    description: "Dashboard operativa real-time, export PDF/Excel, insight per decisioni strategiche.",
    color: "secondary",
    tag: "Analytics",
  },
  {
    icon: Bell,
    title: "Alert Operativi",
    description: "Notifiche automatiche per approvazioni, scadenze, richieste ferie e anomalie presenze.",
    color: "danger",
    tag: "Notifications",
  },
];

/**
 * Color mapping for feature cards
 */
const TAG_COLORS = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  info: "bg-info/10 text-info border-info/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  danger: "bg-danger/10 text-danger border-danger/20",
};

const ICON_COLORS = {
  primary: "text-primary",
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  secondary: "text-secondary",
  danger: "text-danger",
};

/**
 * Animated Icon Component
 */
function AnimatedFeatureIcon({ icon: Icon, color, isHovered }: { icon: any; color: string; isHovered: boolean }) {
  return (
    <div
      className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
        isHovered ? `bg-${color} text-white` : `${TAG_COLORS[color].split(" ")[0]}/10 ${ICON_COLORS[color]}`
      )}
    >
      <Icon className={cn("w-7 h-7 transition-transform", isHovered ? "scale-110" : "")} />
    </div>
  );
}

/**
 * Features Section Component
 * Grid of feature cards with hover animations
 */
export function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Funzionalita Complete</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tutto ciò che serve per gestire il tuo team
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Funzionalità pensate per semplificare il lavoro HR quotidiano.
            Nessuna configurazione complessa, tutto funziona out-of-the-box.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "group relative p-6 rounded-2xl bg-surface border border-border transition-all duration-300 cursor-pointer",
                "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
                "hover:-translate-y-1",
                mounted ? "animate-fade-in-up" : "opacity-0"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tag Badge */}
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mb-4",
                  hoveredIndex === index ? "bg-primary text-white border-primary" : TAG_COLORS[feature.color]
                )}
              >
                {feature.tag}
              </span>

              {/* Icon */}
              <div className="mb-4">
                <AnimatedFeatureIcon
                  icon={feature.icon}
                  color={feature.color}
                  isHovered={hoveredIndex === index}
                />
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Accent Line */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-b-xl transition-all duration-300",
                  hoveredIndex === index ? "w-full" : "w-0"
                )}
              />
            </div>
          ))}
        </div>

        {/* CTA after features */}
        <div className="text-center mt-12">
          <Link
            href="/register/company"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-strong font-medium"
          >
            Inizia gratis e scopri tutte le funzionalita
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Import Link for CTA
import Link from "next/link";

/**
 * Quick Features List - smaller display for inline usage
 */
export function QuickFeaturesList() {
  const quickFeatures = [
    { icon: Clock, text: "Setup in 5 minuti" },
    { icon: CheckCircle2, text: "Nessuna carta di credito" },
    { icon: Zap, text: "Aggiornamenti inclusi" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-6">
      {quickFeatures.map((f, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-muted">
          <f.icon className="w-4 h-4 text-success" />
          <span>{f.text}</span>
        </div>
      ))}
    </div>
  );
}