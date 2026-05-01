/**
 * AppShell ottimizzato con feature gating
 * Nasconde features non abilitate in base a subscription e role
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import useDarkMode from "@/hooks/useDarkMode";
import { filterNavItems } from "@/lib/featureGating";
import {
  LayoutDashboard, Users, Building2, FileText, Clock, LogOut,
  Menu, X, ChevronRight, UserCog, Link2, Shield, Settings as SettingsIcon,
  ClipboardList, Briefcase, CalendarDays, FileBadge, Activity, Monitor, BookOpen, Award, Heart, GraduationCap, BarChart3, MessageCircle, TrendingUp, MessageSquare, Receipt, Calendar, Bell, CreditCard, Sparkles, Code, Zap, Moon, Sun
} from "lucide-react";
import { getRoleLabel, getRoleColor } from "@/lib/roles";
import NotificationBell from "./NotificationBell";
import HRAssistantWidget from "@/components/assistant/HRAssistantWidget";
import AppInstallBanner from "./AppInstallBanner";

const COMPANY_NAV = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/company" },
    { label: "Dipendenti", icon: Users, path: "/dashboard/company/employees" },
    { label: "Turni", icon: CalendarDays, path: "/dashboard/company/shifts" },
    { label: "Presenze", icon: Clock, path: "/dashboard/company/attendance" },
    { label: "Documenti", icon: FileText, path: "/dashboard/company/documents" },
    { label: "Ferie & Permessi", icon: CalendarDays, path: "/dashboard/company/leave-requests" },
    { label: "Formazione", icon: GraduationCap, path: "/dashboard/company/training" },
    { label: "Performance", icon: BarChart3, path: "/dashboard/company/performance" },
    { label: "Rimborsi Spese", icon: Receipt, path: "/dashboard/company/expenses" },
    { label: "Analytics", icon: TrendingUp, path: "/dashboard/company/analytics" },
    { label: "Integrazioni", icon: Zap, path: "/dashboard/company/integrations" },
    { label: "Abbonamento", icon: CreditCard, path: "/dashboard/company/subscription" },
    { label: "Impostazioni", icon: SettingsIcon, path: "/dashboard/company/settings" },
];

const EMPLOYEE_NAV = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/employee" },
    { label: "Timbratura", icon: Clock, path: "/dashboard/employee/attendance" },
    { label: "I Miei Turni", icon: Calendar, path: "/dashboard/employee/shifts" },
    { label: "Ferie & Permessi", icon: CalendarDays, path: "/dashboard/employee/leave" },
    { label: "Documenti", icon: FileText, path: "/dashboard/employee/documents" },
    { label: "Formazione", icon: GraduationCap, path: "/dashboard/employee/training" },
    { label: "Feedback", icon: BarChart3, path: "/dashboard/employee/feedback" },
    { label: "Messaggi", icon: MessageSquare, path: "/dashboard/employee/messages" },
    { label: "Il Mio Profilo", icon: UserCog, path: "/dashboard/employee/my-profile" },
];

export default function OptimizedAppShell({ user, children }) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useDarkMode();
  const [navItems, setNavItems] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const location = useLocation();
  const role = user?.role || "employee";

  useEffect(() => {
    const initNav = async () => {
      // Carica subscription
      if (user?.company_id && (role === 'company_owner' || role === 'company_admin' || role === 'hr_manager')) {
        const subs = await base44.entities.CompanySubscription.filter({
          company_id: user.company_id,
          status: 'active'
        });
        setSubscription(subs[0] || null);
      }

      // Filtra nav in base a features
      let baseNav = [];
      if (role === 'employee') {
        baseNav = EMPLOYEE_NAV;
      } else if (['company_owner', 'company_admin', 'hr_manager', 'manager'].includes(role)) {
        baseNav = COMPANY_NAV;
      }

      const filtered = await filterNavItems(baseNav, user, subscription);
      setNavItems(filtered);
    };

    if (user) initNav();
  }, [user, subscription]);

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

        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white", getRoleColor(role))}>
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
            {getRoleLabel(role)}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
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
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-400" />}
            </button>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white", getRoleColor(role))}>
              {(user?.full_name || user?.email || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <HRAssistantWidget user={user} />
      </div>
    </div>
  );
}