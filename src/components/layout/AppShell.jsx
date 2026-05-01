/**
 * AppShell.jsx
 * ------------
 * Layout principale usato da TUTTE le pagine autenticate.
 * Fornisce: sidebar navigazione, header, area contenuto principale.
 *
 * Props:
 *  - user  (object): oggetto utente Base44 con almeno { role, email, full_name }
 *  - children: contenuto della pagina
 *
 * Comportamento:
 *  - La navigazione sidebar cambia in base a user.role (vedi oggetto NAV)
 *  - Su mobile: hamburger menu con overlay
 *  - Badge ruolo colorato (colori da getRoleColor in lib/roles.js)
 *  - Campanella notifiche (NotificationBell) nell'header
 *  - AI Assistant Widget (HRAssistantWidget) flotante in basso a destra
 *
 * Per aggiungere una voce di menu:
 *  → Aggiungila nell'array corretto (COMPANY_NAV, CONSULTANT_NAV, ecc.)
 *  → Formato: { label: "...", icon: IconComponent, path: "/path/..." }
 */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import useDarkMode from "@/hooks/useDarkMode";
import {
  LayoutDashboard, Users, Building2, FileText, Clock, LogOut,
  Menu, X, ChevronRight, UserCog, Link2, Shield, Settings as SettingsIcon,
  ClipboardList, Briefcase, CalendarDays, FileBadge, Activity, Monitor, BookOpen, Award, Heart, GraduationCap, BarChart3, MessageCircle, TrendingUp, MessageSquare, Receipt, Calendar, Bell, CreditCard, Sparkles, Code, Zap, Moon, Sun
} from "lucide-react";
import { getRoleLabel, getRoleColor, isCompanyRole, isConsultantRole } from "@/lib/roles";
import NotificationBell from "./NotificationBell";
import HRAssistantWidget from "@/components/assistant/HRAssistantWidget";
import AppInstallBanner from "./AppInstallBanner";

// Shared company nav (used by all company roles)
const COMPANY_NAV = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/company" },
    { label: "Login Temporanei", icon: Users, path: "/dashboard/admin/temporary-logins" },
    { label: "Dipendenti", icon: Users, path: "/dashboard/company/employees" },
    { label: "Aggiungi lavoratore", icon: UserCog, path: "/dashboard/company/employees/new" },
    { label: "Admin Aziendali", icon: Shield, path: "/dashboard/company/admins" },
    { label: "Consulenti", icon: Briefcase, path: "/dashboard/company/consultants" },
    { label: "Turni settimanali", icon: CalendarDays, path: "/dashboard/company/shifts" },
    { label: "Presenze", icon: Clock, path: "/dashboard/company/attendance" },
    { label: "Straordinari", icon: Clock, path: "/dashboard/company/overtime" },
    { label: "Approvazione Ferie", icon: CalendarDays, path: "/dashboard/company/leave-requests" },
    { label: "Competenze", icon: Award, path: "/dashboard/company/skills" },
    { label: "Benefit", icon: Heart, path: "/dashboard/company/benefits" },
    { label: "Annunci", icon: FileText, path: "/dashboard/company/announcements" },
    { label: "Gestione asset", icon: Monitor, path: "/dashboard/company/assets" },
    { label: "Documenti", icon: FileText, path: "/dashboard/company/documents" },
    { label: "Archivio Documenti", icon: FileText, path: "/dashboard/company/document-archive" },
    { label: "Invia Messaggi", icon: MessageSquare, path: "/dashboard/company/send-message" },
    { label: "Corsi di Formazione", icon: GraduationCap, path: "/dashboard/company/training" },
    { label: "Valutazioni 360°", icon: BarChart3, path: "/dashboard/company/performance" },
    { label: "HR Analytics", icon: TrendingUp, path: "/dashboard/company/analytics" },
    { label: "Generatore Report", icon: BarChart3, path: "/dashboard/company/report-generator" },
    { label: "Gestione Workflow", icon: SettingsIcon, path: "/dashboard/company/workflow-configuration" },
    { label: "Geofence GPS", icon: SettingsIcon, path: "/dashboard/company/geofence" },
    { label: "Analytics IA", icon: Sparkles, path: "/dashboard/company/ai-analytics" },
    { label: "Rimborsi Spese", icon: Receipt, path: "/dashboard/company/expenses" },
    { label: "Calendario Ferie", icon: CalendarDays, path: "/dashboard/company/time-off-calendar" },
    { label: "Team Analytics", icon: TrendingUp, path: "/dashboard/company/team-analytics" },
    { label: "Template Documenti", icon: FileText, path: "/dashboard/company/document-templates" },
    { label: "Esportazione Payroll", icon: FileText, path: "/dashboard/company/payroll-export" },
    { label: "Integrazioni", icon: Zap, path: "/dashboard/company/integrations" },
    { label: "API Management", icon: Code, path: "/dashboard/company/api" },
    { label: "Abbonamento", icon: CreditCard, path: "/dashboard/company/subscription" },
    { label: "Il mio account", icon: UserCog, path: "/dashboard/company/my-account" },
    { label: "Impostazioni", icon: SettingsIcon, path: "/dashboard/company/settings" },
];

const MANAGER_NAV = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/company" },
    { label: "Dipendenti", icon: Users, path: "/dashboard/company/employees" },
    { label: "Presenze", icon: Clock, path: "/dashboard/company/attendance" },
    { label: "Approvazione Ferie", icon: CalendarDays, path: "/dashboard/company/leave-requests" },
    { label: "Straordinari", icon: Clock, path: "/dashboard/company/overtime" },
    { label: "Turni settimanali", icon: CalendarDays, path: "/dashboard/company/shifts" },
    { label: "Annunci", icon: FileText, path: "/dashboard/company/announcements" },
];

// Shared consultant nav
const CONSULTANT_NAV = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/consultant" },
    { label: "Aziende clienti", icon: Building2, path: "/dashboard/consultant/companies" },
    { label: "Dipendenti", icon: Users, path: "/dashboard/consultant/employees" },
    { label: "Richieste collegamento", icon: Link2, path: "/dashboard/consultant/link-requests" },
    { label: "Revisione Documenti", icon: FileText, path: "/dashboard/consultant/document-review" },
    { label: "Calendario HR", icon: Calendar, path: "/dashboard/consultant/calendar" },
    { label: "Impostazioni", icon: SettingsIcon, path: "/dashboard/consultant/settings" },
];

const NAV = {
  super_admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/admin" },
    { label: "Configurazioni Piattaforma", icon: Zap, path: "/dashboard/admin/platform-settings" },
    { label: "Feature Management", icon: Zap, path: "/dashboard/admin/features" },
    { label: "Pricing Plans", icon: CreditCard, path: "/dashboard/admin/pricing" },
    { label: "Aziende", icon: Building2, path: "/dashboard/admin/companies" },
    { label: "Utenti", icon: Users, path: "/dashboard/admin/users" },
    { label: "Analytics", icon: Activity, path: "/dashboard/admin/analytics" },
    { label: "Settings", icon: SettingsIcon, path: "/dashboard/admin/settings" },
  ],
  consultant: CONSULTANT_NAV,
  labor_consultant: CONSULTANT_NAV,
  external_consultant: CONSULTANT_NAV,
  safety_consultant: CONSULTANT_NAV,
  company: COMPANY_NAV,
  company_owner: COMPANY_NAV,
  company_admin: COMPANY_NAV,
  hr_manager: COMPANY_NAV,
  manager: MANAGER_NAV,
  employee: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/employee" },
    { label: "Timbratura", icon: Clock, path: "/dashboard/employee/attendance" },
    { label: "Calendario Presenze", icon: ClipboardList, path: "/dashboard/employee/calendar" },
    { label: "Miei Documenti", icon: FileText, path: "/dashboard/employee/personal-documents" },
    { label: "Documenti Aziendali", icon: FileText, path: "/dashboard/employee/document-management" },
    { label: "Messaggi", icon: MessageSquare, path: "/dashboard/employee/messages" },
    { label: "Sicurezza (2FA)", icon: Shield, path: "/dashboard/employee/two-factor" },
    { label: "Le mie presenze", icon: ClipboardList, path: "/dashboard/employee/history" },
    { label: "Ferie & Permessi", icon: CalendarDays, path: "/dashboard/employee/leave" },
    { label: "Saldo Ferie", icon: Calendar, path: "/dashboard/employee/leave-balance" },
    { label: "I Miei Turni", icon: Calendar, path: "/dashboard/employee/shifts" },
    { label: "Straordinari", icon: Clock, path: "/dashboard/employee/overtime" },
    { label: "I miei benefit", icon: Heart, path: "/dashboard/employee/benefits" },
    { label: "Documenti da firmare", icon: FileText, path: "/dashboard/employee/documents" },
    { label: "Le mie competenze", icon: Award, path: "/dashboard/employee/skills" },
    { label: "Formazione", icon: GraduationCap, path: "/dashboard/employee/training" },
    { label: "Piani di Formazione", icon: GraduationCap, path: "/dashboard/employee/training-plans" },
    { label: "Il Mio Feedback", icon: BarChart3, path: "/dashboard/employee/feedback" },
    { label: "Chat Interna", icon: MessageSquare, path: "/dashboard/employee/chat" },
    { label: "Le Mie Spese", icon: Receipt, path: "/dashboard/employee/expenses" },
    { label: "Contratto", icon: FileBadge, path: "/dashboard/employee/contract" },
    { label: "Il Mio Profilo", icon: UserCog, path: "/dashboard/employee/my-profile" },
    { label: "Profilo", icon: UserCog, path: "/dashboard/employee/profile" },
    { label: "Preferenze Notifiche", icon: Bell, path: "/dashboard/employee/notification-settings" },
  ],
};

// Using getRoleLabel and getRoleColor from roles.js

export default function AppShell({ user, children }) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useDarkMode();
  const location = useLocation();
  const role = user?.role || "employee";
  const navItems = NAV[role] || NAV["employee"] || [];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden flex-col">
      <AppInstallBanner />
      <div className="flex h-screen overflow-hidden">
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn(
        "fixed lg:relative z-30 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-lg">PulseHR</span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white", getRoleColor(role))}>
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
              {getRoleLabel(role)}
            </div>
            <select
              onChange={(e) => {
                // Language change logic
                localStorage.setItem('language', e.target.value);
                window.location.reload();
              }}
              defaultValue={localStorage.getItem('language') || 'it'}
              className="px-2 py-1 text-xs bg-slate-800 border border-slate-600 text-white rounded cursor-pointer focus:outline-none"
            >
              <option value="it">🇮🇹 IT</option>
              <option value="en">🇬🇧 EN</option>
            </select>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/dashboard/" + role && location.pathname.startsWith(item.path) && item.path.length > 20);
            const exactActive = location.pathname === item.path;
            const isActive = exactActive;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>

      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-3 flex-shrink-0">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            {user && <NotificationBell user={user} />}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-400" />}
            </button>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white", getRoleColor(role))}>
              {(user?.full_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user?.full_name || user?.email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <HRAssistantWidget user={user} />
      </div>
    </div>
  );
}