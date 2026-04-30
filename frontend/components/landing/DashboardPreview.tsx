"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  UserCog,
  User,
  MessageSquare,
  MousePointer,
  ChevronRight,
} from "lucide-react";

/**
 * Dashboard Preview Section
 * Tabbed interface showing different dashboard views
 * 
 * NOTE: Screenshots will be placeholder until real dashboard screenshots are provided
 */
const DASHBOARD_TABS = [
  {
    id: "admin",
    label: "Admin Dashboard",
    icon: LayoutDashboard,
    description: "Vista completa per amministratori e responsabili HR",
    placeholder: "[Screenshot Admin Dashboard - Da inserire]",
  },
  {
    id: "manager",
    label: "Manager View",
    icon: UserCog,
    description: "Dashboard semplificata per team manager",
    placeholder: "[Screenshot Manager View - Da inserire]",
  },
  {
    id: "employee",
    label: "Employee View",
    icon: User,
    description: "Interfaccia intuitiva per dipendenti",
    placeholder: "[Screenshot Employee View - Da inserire]",
  },
];

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState("admin");

  const currentTab = DASHBOARD_TABS.find((t) => t.id === activeTab) || DASHBOARD_TABS[0];

  return (
    <section className="py-20 px-4 bg-surface">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            La dashboard giusta per ogni ruolo
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Interfacce specifiche per amministratori, manager e dipendenti.
            Tutti vedono solo ciò che serve.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-2 mb-8">
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-bg text-muted hover:text-foreground border border-border"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Preview Container */}
        <div className="relative rounded-2xl border-2 border-border bg-bg overflow-hidden shadow-2xl">
          {/* Browser Chrome */}
          <div className="bg-bg border-b border-border px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
              <div className="w-3 h-3 rounded-full bg-green-500/20" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-muted font-medium">
                {currentTab.label} - PulseHR
              </span>
            </div>
          </div>

          {/* Screenshot Area - Placeholder */}
          <div className="aspect-video bg-gradient-to-br from-bg to-surface flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              {/* Annotation callout - top left */}
              <div className="absolute top-8 left-8 bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-[200px]">
                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                  <MessageSquare className="w-4 h-4" />
                  Notifiche in tempo reale
                </div>
                <p className="text-xs text-muted">Alert per richieste, scadenze e anomalie</p>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-primary/30" />
              </div>

              {/* Annotation callout - top right */}
              <div className="absolute top-8 right-8 bg-success/10 border border-success/20 rounded-lg p-3 max-w-[200px]">
                <div className="flex items-center gap-2 text-sm font-medium text-success mb-1">
                  <MousePointer className="w-4 h-4" />
                  Click facile
                </div>
                <p className="text-xs text-muted">Azioni rapide senza navigazione complessa</p>
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-success/30" />
              </div>

              {/* Placeholder content */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 bg-muted/30">
                <LayoutDashboard className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">{currentTab.label}</p>
                <p className="text-sm text-muted mb-4">{currentTab.description}</p>
                <p className="text-xs text-muted/60 border border-border/50 bg-bg px-3 py-2 rounded-lg inline-block">
                  {currentTab.placeholder}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom annotation */}
          <div className="bg-bg border-t border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <ChevronRight className="w-4 h-4" />
              <span>Clicca sui tab per vedere le diverse viste</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Dashboard reattiva e ottimizzata
            </div>
          </div>
        </div>

        {/* Features List Below Preview */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            { title: "Dati in tempo reale", desc: "Presenze e ferie aggiornate istantaneamente" },
            { title: "Filtri avanzati", desc: "Cerca e ordina per qualsiasi campo" },
            { title: "Esportazione rapida", desc: "PDF e Excel in un click" },
          ].map((feature, i) => (
            <div key={i} className="text-center p-4">
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}