"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import {
  MessageSquare,
  Star,
  Quote,
  AlertCircle,
} from "lucide-react";

/**
 * Testimonials Section Component
 * 
 * NOTE: This section displays a placeholder because real customer
 * testimonials have not been collected yet. Following the anti-fake
 * policy, we do NOT invent testimonials.
 * 
 * When real testimonials are available, replace the placeholder content
 * with actual customer quotes.
 */
export function TestimonialsSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="py-20 px-4 bg-surface">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cosa dicono i nostri clienti
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Quando avremo testimonials reali da parte dei nostri clienti,
            saranno pubblicati qui.
          </p>
        </div>

        {/* Placeholder Notice */}
        <div className={cn(
          "max-w-3xl mx-auto",
          mounted ? "animate-fade-in-up" : "opacity-0"
        )}>
          <div className="relative p-8 rounded-2xl bg-bg border-2 border-dashed border-border text-center">
            {/* Notice Icon */}
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-muted" />
            </div>

            {/* Quote Icon */}
            <Quote className="w-10 h-10 text-primary/20 mx-auto mb-4" />

            {/* Placeholder Text */}
            <p className="text-lg text-muted mb-6 italic">
              I testimonials saranno aggiunti quando disponibili.
              Non utilizziamo dati inventati.
            </p>

            {/* Info Box */}
            <div className="inline-flex items-start gap-3 p-4 bg-muted/50 rounded-xl text-left max-w-md">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Nota informativa</p>
                <p className="text-muted text-xs">
                  PulseHR non inventa testimonials falsi. Quando i clienti reali
                  ci forniranno il loro feedback, sara pubblicato qui in modo trasparente.
                </p>
              </div>
            </div>

            {/* Placeholder for 3 testimonial cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-8 opacity-50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 text-muted" />
                    ))}
                  </div>
                  <div className="h-16 bg-muted/50 rounded mb-3" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div>
                      <div className="h-3 w-20 bg-muted rounded mb-1" />
                      <div className="h-2 w-16 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}