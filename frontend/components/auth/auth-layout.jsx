"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Activity } from "lucide-react";

/**
 * Professional split-layout component for authentication pages
 * - Left panel (40%): Hidden on mobile, shows branding/illustration
 * - Right panel (60%): Contains the form content
 * - Responsive: Single column on mobile, split on desktop (lg:)
 */
export function AuthLayout({ children, className }) {
  return (
    <div className={cn("min-h-screen flex flex-col lg:flex-row", className)}>
      {/* Left Panel - Hidden on mobile, visible on lg+ screens */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
        {/* Decorative floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-400/15 rounded-full blur-2xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-start p-12 lg:p-16 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
              <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">PulseHR</h1>
          </div>

          {/* Tagline */}
          <div className="max-w-md space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              Gestione del personale
              <br />
              semplificata
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              La piattaforma completa per gestire dipendenti, presenze e amministrazione aziendale in modo efficiente.
            </p>
          </div>

          {/* Decorative elements */}
          <div className="mt-16 grid grid-cols-3 gap-4 w-full max-w-md">
            <div className="h-1 bg-white/30 rounded-full" />
            <div className="h-1 bg-white/20 rounded-full" />
            <div className="h-1 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Right Panel - Always visible */}
      <div className="flex-1 lg:w-[60%] flex items-center justify-center bg-background p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
