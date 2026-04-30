"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Lock, Shield, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

/**
 * Security badges footer for authentication pages
 * - Lock icon with "Dati Protetti" / "Data Protected"
 * - SSL badge
 * - Privacy focus badge
 */
export function AuthFooter({ className }) {
  const { language } = useLanguage();

  const badges = [
    {
      icon: Lock,
      labelIt: "Dati Protetti",
      labelEn: "Data Protected",
    },
    {
      icon: Shield,
      labelIt: "SSL",
      labelEn: "SSL",
    },
    {
      icon: CheckCircle2,
      labelIt: "Privacy Focus",
      labelEn: "Privacy Focus",
    },
  ];

  return (
    <div className={cn("w-full mt-8", className)}>
      {/* Security Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          const label = language === "it" ? badge.labelIt : badge.labelEn;
          
          return (
            <div
              key={index}
              className="flex items-center gap-2 text-muted hover:text-foreground transition-colors duration-200"
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              <span className="text-xs sm:text-sm font-medium">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Footer Text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted">
          {language === "it" 
            ? "Dati protetti con standard di sicurezza moderni" 
            : "Data protected with modern security standards"}
        </p>
      </div>
    </div>
  );
}

/**
 * Simplified footer variant with just badges
 */
export function AuthFooterBadges({ className }) {
  const { language } = useLanguage();

  const badges = [
    {
      icon: Lock,
      labelIt: "Dati Protetti",
      labelEn: "Data Protected",
    },
    {
      icon: Shield,
      labelIt: "SSL",
      labelEn: "SSL",
    },
    {
      icon: CheckCircle2,
      labelIt: "Privacy",
      labelEn: "Privacy",
    },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        const label = language === "it" ? badge.labelIt : badge.labelEn;
        
        return (
          <div
            key={index}
            className="flex items-center gap-1.5 text-muted"
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="text-xs font-medium">{label}</span>
          </div>
        );
      })}
    </div>
  );
}