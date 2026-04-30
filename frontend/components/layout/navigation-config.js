"use client";

import {
  LayoutDashboard,
  Building2,
  Users,
  Clock3,
  FileText,
  WalletCards,
  Shield,
  Bell,
  BrainCircuit,
  CreditCard,
  UserCog,
  CalendarDays,
} from "lucide-react";

/**
 * Single source of truth for role-based navigation.
 *
 * Keeping navigation in one place makes future changes easier:
 * - less duplicated menu code
 * - fewer routing bugs
 * - cleaner role separation
 */
export const NAVIGATION_BY_ROLE = {
  super_admin: [
    {
      title: "Piattaforma",
      items: [
        { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
        { label: "Aziende", href: "/companies", icon: Building2 },
        { label: "Sicurezza", href: "/settings/security", icon: Shield },
      ],
    },
    {
      title: "Growth",
      items: [
        { label: "Fatturazione", href: "/company/billing", icon: CreditCard },
        { label: "Assistente Operativo", href: "/automation", icon: BrainCircuit },
      ],
    },
  ],
  labor_consultant: [
    {
      title: "Consulente",
      items: [
        { label: "Dashboard", href: "/dashboard/consultant", icon: LayoutDashboard },
        { label: "Aziende", href: "/consultant/companies", icon: Building2 },
        { label: "Payroll", href: "/consultant/payroll", icon: WalletCards },
        { label: "Documenti", href: "/consultant/documents", icon: FileText },
      ],
    },
  ],
  external_consultant: [
    {
      title: "Consulente",
      items: [
        { label: "Dashboard", href: "/dashboard/consultant", icon: LayoutDashboard },
        { label: "Aziende", href: "/consultant/companies", icon: Building2 },
        { label: "Documenti", href: "/consultant/documents", icon: FileText },
      ],
    },
  ],
  safety_consultant: [
    {
      title: "Consulente",
      items: [
        { label: "Dashboard", href: "/dashboard/consultant", icon: LayoutDashboard },
        { label: "Aziende", href: "/consultant/companies", icon: Building2 },
        { label: "Documenti", href: "/consultant/documents", icon: FileText },
      ],
    },
  ],
  company_owner: [
    {
      title: "Azienda",
      items: [
        { label: "Dashboard", href: "/dashboard/company", icon: LayoutDashboard },
        { label: "Utenti", href: "/company/users", icon: Users },
        { label: "Presenze", href: "/company/attendance", icon: Clock3 },
        { label: "Payroll", href: "/company/payroll", icon: WalletCards },
        { label: "Documenti", href: "/company/documents", icon: FileText },
      ],
    },
  ],
  company_admin: [
    {
      title: "Azienda",
      items: [
        { label: "Dashboard", href: "/dashboard/company", icon: LayoutDashboard },
        { label: "Utenti", href: "/company/users", icon: Users },
        { label: "Presenze", href: "/company/attendance", icon: Clock3 },
        { label: "Documenti", href: "/company/documents", icon: FileText },
      ],
    },
  ],
  hr_manager: [
    {
      title: "HR",
      items: [
        { label: "Dashboard", href: "/dashboard/company", icon: LayoutDashboard },
        { label: "Utenti", href: "/company/users", icon: Users },
        { label: "Presenze", href: "/company/attendance", icon: Clock3 },
        { label: "Payroll", href: "/company/payroll", icon: WalletCards },
      ],
    },
  ],
  manager: [
    {
      title: "Manager",
      items: [
        { label: "Dashboard", href: "/dashboard/company", icon: LayoutDashboard },
        { label: "Presenze", href: "/company/attendance", icon: Clock3 },
        { label: "Richieste", href: "/attendance", icon: CalendarDays },
      ],
    },
  ],
  employee: [
    {
      title: "Dipendente",
      items: [
        { label: "Dashboard", href: "/dashboard/employee", icon: LayoutDashboard },
        { label: "Presenze", href: "/attendance", icon: Clock3 },
        { label: "Buste paga", href: "/employee/payslips", icon: WalletCards },
        { label: "Richieste", href: "/attendance/leave", icon: CalendarDays },
      ],
    },
  ],
};

// Default/fallback navigation for unknown roles - returns empty to prevent showing wrong menu
const DEFAULT_NAVIGATION = [
  {
    title: "Errore",
    items: [
      { label: "Ricarica", href: "/login", icon: LayoutDashboard },
    ],
  },
];

export function getNavigationForRole(role) {
  // If role is known, return its navigation
  if (role && NAVIGATION_BY_ROLE[role]) {
    return NAVIGATION_BY_ROLE[role];
  }
  
  // CRITICAL: If role is unknown, do NOT default to employee menu
  // This prevents consultants/companies from seeing employee-only menus
  console.warn(`Unknown role "${role}" in getNavigationForRole. Showing error menu.`);
  return DEFAULT_NAVIGATION;
}
