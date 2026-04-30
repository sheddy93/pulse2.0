"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Menu,
  X,
  Play,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Navigation Header Component
 * Sticky nav with smooth scroll-to-top on logo click
 */
export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        Vai al contenuto principale
      </a>

      <nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-background/80 backdrop-blur-sm border-b border-border"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            aria-label="PulseHR - Torna alla home"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-foreground">PulseHR</span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted hover:text-foreground transition-colors">
              Funzionalita
            </Link>
            <Link href="#pricing" className="text-sm text-muted hover:text-foreground transition-colors">
              Prezzi
            </Link>
            <Link href="/login" className="text-sm text-muted hover:text-foreground transition-colors">
              Accedi
            </Link>
            <Link
              href="/register/company"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-strong transition-colors"
            >
              Prova Gratis
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted hover:text-foreground"
            aria-label={mobileMenuOpen ? "Chiudi menu" : "Apri menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4">
            <Link href="#features" className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Funzionalita
            </Link>
            <Link href="#pricing" className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Prezzi
            </Link>
            <Link href="/login" className="block text-sm text-muted hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Accedi
            </Link>
            <Link
              href="/register/company"
              className="block w-full text-center text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Prova Gratis
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}

/**
 * Trust Badges - Real verifiable product features
 * Using honest, verifiable claims only
 */
const TRUST_BADGES = [
  "Setup guidato",
  "Privacy design",
  "Pensato per PMI",
];

/**
 * Hero Section Component
 * Main landing section with animations, badge, and CTAs
 */
export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="main-content" className="relative py-20 md:py-32 px-4 overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT COLUMN - Content */}
          <div className={cn(
            "space-y-6",
            mounted ? "animate-fade-in-up" : "opacity-0"
          )}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Pensato per PMI e consulenti
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
              Gestisci HR in un&apos;unica piattaforma.
              <span className="text-primary"> Semplice.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted leading-relaxed">
              PulseHR centralizza presenze, ferie, documenti e compliance.
              Flussi guidati, automazioni operative, report automatici.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/register/company"
                className="w-full sm:w-auto bg-primary text-white rounded-xl text-base px-8 py-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:bg-primary-strong transition-all inline-flex items-center justify-center font-semibold"
              >
                Registra azienda
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/register/consultant"
                className="w-full sm:w-auto bg-surface text-foreground rounded-xl border-2 border-border text-base px-8 py-4 inline-flex items-center justify-center font-semibold hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                Sono un consulente
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted pt-4">
              {TRUST_BADGES.map((badge, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN - Dashboard Preview */}
          <div className={cn(
            "relative",
            mounted ? "animate-fade-in-up" : "opacity-0"
          )} style={{ animationDelay: "200ms" }}>
            {/* Dashboard Mockup Container */}
            <div className="relative rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="bg-bg border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted font-medium">Dashboard PulseHR</span>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-4 bg-gradient-to-br from-bg to-surface">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Presenze oggi", value: "42" },
                    { label: "Ferie pending", value: "8" },
                    { label: "Doc scaduti", value: "3" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-bg border border-border rounded-lg p-3">
                      <div className="text-xs text-muted mb-1">{stat.label}</div>
                      <div className="text-xl font-bold text-foreground">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Bar Chart */}
                <div className="bg-bg border border-border rounded-lg p-4 h-32 flex items-end gap-2">
                  {[65, 45, 80, 55, 70, 90, 60].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t transition-all hover:bg-primary/30"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Activity List */}
                <div className="bg-bg border border-border rounded-lg p-4 space-y-2">
                  <div className="text-xs font-semibold text-foreground mb-2">Attivita Recenti</div>
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-muted">Nuova richiesta ferie - Mario Rossi</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-float">
              Dashboard operativa
            </div>

            {/* Play Button Overlay (placeholder for video) */}
            <button className="absolute inset-0 flex items-center justify-center group">
              <div className="w-16 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-primary ml-1" />
              </div>
            </button>

            {/* Placeholder note for real screenshot */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-dashed border-border text-center">
              <p className="text-xs text-muted">
                {/* Screenshot placeholder - replace with real dashboard screenshot */}
                [Screenshot della dashboard verra inserito qui]
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}