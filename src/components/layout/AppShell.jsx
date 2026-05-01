import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, FileText, Clock, LogOut,
  Menu, X, ChevronRight, UserCog, Link2, Shield, Settings as SettingsIcon,
  ClipboardList, Briefcase, CalendarDays, FileBadge, Activity, Monitor, BookOpen, Award, Heart, GraduationCap, BarChart3, MessageCircle, TrendingUp, MessageSquare, Receipt, Calendar, Bell, CreditCard
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import HRAssistantWidget from "@/components/assistant/HRAssistantWidget";

const NAV = {
  super_admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/admin" },
    { label: "Analytics", icon: Activity, path: "/dashboard/admin/analytics" },
    { label: "Aziende", icon: Building2, path: "/dashboard/admin/companies" },
    { label: "Utenti", icon: Users, path: "/dashboard/admin/users" },
    { label: "Settings", icon: SettingsIcon, path: "/dashboard/admin/settings" },
  ],
  consultant: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/consultant" },
    { label: "Aziende clienti", icon: Building2, path: "/dashboard/consultant/companies" },
    { label: "Dipendenti", icon: Users, path: "/dashboard/consultant/employees" },
    { label: "Richieste collegamento", icon: Link2, path: "/dashboard/consultant/link-requests" },
    { label: "Revisione Documenti", icon: FileText, path: "/dashboard/consultant/document-review" },
    { label: "Calendario HR", icon: Calendar, path: "/dashboard/consultant/calendar" },
    { label: "Impostazioni", icon: SettingsIcon, path: "/dashboard/consultant/settings" },
  ],
  company: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/company" },
    { label: "Dipendenti", icon: Users, path: "/dashboard/company/employees" },
    { label: "Aggiungi lavoratore", icon: UserCog, path: "/dashboard/company/employees/new" },
    { label: "Consulenti", icon: Briefcase, path: "/dashboard/company/consultants" },
    { label: "Turni settimanali", icon: CalendarDays, path: "/dashboard/company/shifts" },
    { label: "Presenze", icon: Clock, path: "/dashboard/company/attendance" },
    { label: "Straordinari", icon: Clock, path: "/dashboard/company/overtime" },
    { label: "Competenze", icon: Award, path: "/dashboard/company/skills" },
    { label: "Benefit", icon: Heart, path: "/dashboard/company/benefits" },
    { label: "Annunci", icon: FileText, path: "/dashboard/company/announcements" },
    { label: "Gestione asset", icon: Monitor, path: "/dashboard/company/assets" },
    { label: "Assegnazioni", icon: Monitor, path: "/dashboard/company/asset-assignments" },
    { label: "Documenti", icon: FileText, path: "/dashboard/company/documents" },
    { label: "Audit Log", icon: BookOpen, path: "/dashboard/company/audit-log" },
    { label: "Offerte di Lavoro", icon: FileText, path: "/dashboard/company/job-postings" },
    { label: "Candidati", icon: Users, path: "/dashboard/company/candidates" },
    { label: "Corsi di Formazione", icon: GraduationCap, path: "/dashboard/company/training" },
    { label: "Piani di Formazione", icon: GraduationCap, path: "/dashboard/company/training-plans" },
    { label: "Scadenziario Certificazioni", icon: Calendar, path: "/dashboard/company/certification-expiry" },
    { label: "Valutazioni 360°", icon: BarChart3, path: "/dashboard/company/performance" },
    { label: "Dai Feedback", icon: MessageCircle, path: "/dashboard/company/give-feedback" },
    { label: "Calendario HR", icon: Calendar, path: "/dashboard/company/calendar" },
    { label: "HR Analytics", icon: TrendingUp, path: "/dashboard/company/analytics" },
    { label: "Rimborsi Spese", icon: Receipt, path: "/dashboard/company/expenses" },
    { label: "Approvazione Ferie", icon: CalendarDays, path: "/dashboard/company/leave-requests" },
    { label: "Onboarding Dipendenti", icon: Users, path: "/dashboard/company/onboarding-tracking" },
    { label: "Integrazioni API", icon: SettingsIcon, path: "/dashboard/company/integrations" },
    { label: "Abbonamento", icon: CreditCard, path: "/dashboard/company/subscription" },
    { label: "Impostazioni", icon: SettingsIcon, path: "/dashboard/company/settings" },
  ],
  employee: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/employee" },
    { label: "Timbratura", icon: Clock, path: "/dashboard/employee/attendance" },
    { label: "Calendario Presenze", icon: ClipboardList, path: "/dashboard/employee/calendar" },
    { label: "Miei Documenti", icon: FileText, path: "/dashboard/employee/documents" },
    { label: "Le mie presenze", icon: ClipboardList, path: "/dashboard/employee/history" },
    { label: "Ferie & Permessi", icon: CalendarDays, path: "/dashboard/employee/leave" },
    { label: "Saldo Ferie", icon: Calendar, path: "/dashboard/employee/leave-balance" },
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
    { label: "Profilo", icon: UserCog, path: "/dashboard/employee/profile" },
    { label: "Preferenze Notifiche", icon: Bell, path: "/dashboard/employee/notification-settings" },
  ],
};

const ROLE_LABEL = { super_admin: "Super Admin", consultant: "Consulente", company: "Azienda", employee: "Dipendente" };
const ROLE_COLOR = { super_admin: "bg-red-600", consultant: "bg-violet-600", company: "bg-blue-600", employee: "bg-emerald-600" };

export default function AppShell({ user, children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const role = user?.role || "employee";
  const navItems = NAV[role] || [];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn(
        "fixed lg:relative z-30 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-slate-800 text-lg">PulseHR</span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100">
          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white", ROLE_COLOR[role])}>
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
            {ROLE_LABEL[role]}
          </div>
          <p className="text-xs text-slate-400 mt-1.5 truncate">{user?.email}</p>
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
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="px-3 py-2">
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Lingua</label>
            <select className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            {user && <NotificationBell user={user} />}
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white", ROLE_COLOR[role])}>
              {(user?.full_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.full_name || user?.email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <HRAssistantWidget user={user} />
    </div>
  );
}