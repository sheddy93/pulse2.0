"use client";

import Link from "next/link";
import { Shield, Lock, Server, Database, ExternalLink, Mail } from "lucide-react";

/**
 * Footer Component - Professional with trust badges
 */
export function Footer() {
  return (
    <footer className="py-16 px-4 border-t border-border bg-bg">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-foreground text-lg">PulseHR</span>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-4">
              Gestione HR semplice e moderna per aziende e consulenti del lavoro italiani.
            </p>

            {/* Social Icons - placeholder until real URLs */}
            <div className="flex items-center gap-3">
              {/* LinkedIn - placeholder */}
              <span
                className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted cursor-not-allowed"
                aria-label="LinkedIn (coming soon)"
                title="LinkedIn - Coming soon"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </span>
              {/* Twitter/X - placeholder */}
              <span
                className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted cursor-not-allowed"
                aria-label="Twitter (coming soon)"
                title="Twitter - Coming soon"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Prodotto</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#features" className="text-muted hover:text-foreground transition-colors">
                  Funzionalita
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-muted hover:text-foreground transition-colors">
                  Prezzi
                </Link>
              </li>
              <li>
                <Link href="#come-funziona" className="text-muted hover:text-foreground transition-colors">
                  Come funziona
                </Link>
              </li>
              <li>
                <Link href="/register/company" className="text-muted hover:text-foreground transition-colors">
                  Prova gratuita
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Azienda</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-muted/50 flex items-center gap-1">
                  Privacy <ExternalLink className="w-3 h-3 opacity-50" />
                </span>
              </li>
              <li>
                <span className="text-muted/50 flex items-center gap-1">
                  Termini <ExternalLink className="w-3 h-3 opacity-50" />
                </span>
              </li>
              <li>
                <span className="text-muted/50 flex items-center gap-1">
                  Cookie <ExternalLink className="w-3 h-3 opacity-50" />
                </span>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Supporto</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:supporto@pulsehr.it"
                  className="text-muted hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  supporto@pulsehr.it
                </a>
              </li>
              <li>
                <Link href="/login" className="text-muted hover:text-foreground transition-colors">
                  Accedi
                </Link>
              </li>
              <li>
                <Link href="/register/consultant" className="text-muted hover:text-foreground transition-colors">
                  Area consulenti
                </Link>
              </li>
              <li>
                <span className="text-muted/50">Centro assistenza (coming soon)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-2 text-muted">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">GDPR-ready</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Lock className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">Dati protetti</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Database className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">Pensato per PMI</span>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="text-center pt-8 border-t border-border">
          <p className="text-sm text-muted">
            &copy; 2026 PulseHR. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}