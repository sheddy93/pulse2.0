"use client";

import Link from "next/link";
import { ArrowRight, Mail, MapPin, Shield, Lock, Database } from "lucide-react";

/**
 * Final CTA Section Component
 */
export function FinalCTASection() {
  return (
    <section className="py-20 px-4 bg-surface">
      <div className="max-w-2xl mx-auto text-center">
        {/* Headline */}
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Pronto a semplificare la gestione HR?
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-muted mb-8">
          Unisciti alle aziende italiane che hanno gia scelto PulseHR.
          Setup in 5 minuti, nessuna carta di credito richiesta.
        </p>

        {/* CTA Button */}
        <Link
          href="/register/company"
          className="inline-flex items-center justify-center bg-primary text-white rounded-xl text-lg px-12 py-4 shadow-lg shadow-primary/25 hover:bg-primary-strong hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          Inizia Ora - E Gratis
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>

        {/* Trust text below button */}
        <p className="text-sm text-muted mt-4 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-success" />
            GDPR-ready
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-4 h-4 text-success" />
            Dati protetti
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-4 h-4 text-success" />
            Pensato per PMI
          </span>
        </p>
      </div>
    </section>
  );
}