"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Activity } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Logo + controls header for authentication pages
 * - PulseHR logo/branding
 * - Language switcher component
 * - Theme switcher component
 */
export function AuthHeader({ className, showControls = true }) {
  return (
    <div className={cn("w-full flex items-center justify-between mb-8", className)}>
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg border border-primary/20">
          <Activity className="w-5 h-5 text-primary" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">
          PulseHR
        </span>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      )}
    </div>
  );
}

/**
 * Simplified logo-only header variant
 */
export function AuthHeaderLogo({ className }) {
  return (
    <div className={cn("w-full flex items-center justify-center mb-8", className)}>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg border border-primary/20">
          <Activity className="w-5 h-5 text-primary" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">
          PulseHR
        </span>
      </div>
    </div>
  );
}
