import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, FileText, Clock, LogOut,
  Menu, X, ChevronRight, UserCog, Link2, Shield, Settings,
  ClipboardList, Briefcase, CalendarDays, FileBadge
} from "lucide-react";

const NAV = {
  super_admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/admin" },
    { label: "Aziende", icon: Building2, path: "/dashboard/admin/companies" },
    { label: "Utenti", icon: Users, path: "/dashboard/admin/users" },
    { label: "Sistema", icon: Shield, path: "/dashboard/admin/system" },
  ],
  consultant: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/consultant" },
    { label: "Aziende clienti", icon: Building2, path: "/dashboard/consultant/companies" },
    { label: "Dipendenti", icon: Users, path: "/dashboard/consultant/employees" },
    { label: "Richieste collegamento", icon: Link2, path: "/dashboard/consultant/link-requests" },
    { label: "Documenti", icon: FileText, path: "/dashboard/consultant/documents" },
    { label: "Impostazioni", icon: Settings, path: "/dashboard/consultant/settings" },
  ],
  company: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/company" },
    { label: "Dipendenti", icon: Users, path: "/dashboard/company/employees" },
    { label: "Aggiungi lavoratore", icon: UserCog, path: "/dashboard/company/employees/new" },
    { label: "Consulenti", icon: Briefcase, path: "/dashboard/company/consultants" },
    { label: "Presenze", icon: Clock, path: "/dashboard/company/attendance" },
    { label: "Documenti", icon: FileText, path: "/dashboard/company/documents" },
    { label: "Impostazioni", icon: Settings, path: "/dashboard/company/settings" },
  ],
  employee: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/employee" },
    { label: "Timbratura", icon: Clock, path: "/dashboard/employee/attendance" },
    { label: "Le mie presenze", icon: ClipboardList, path: "/dashboard/employee/history" },
    { label: "Ferie & Permessi", icon: CalendarDays, path: "/dashboard/employee/leave" },
    { label: "Documenti", icon: FileText, path: "/dashboard/employee/documents" },
    { label: "Contratto", icon: FileBadge, path: "/dashboard/employee/contract" },
    { label: "Profilo", icon: UserCog, path: "/dashboard/employee/profile" },
  ],
};

const ROLE_LABEL = {
  super_admin: "Super Admin",
  consultant: "Consulente",
  company: "Azienda",
  employee: "Dipendente",
};

const ROLE_COLOR = {
  super_admin: "bg-red-600",
  consultant: "bg-violet-600",
  company: "bg-blue-600",
  employee: "bg-emerald-600",
};

export default function AppShell({ user, children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || "employee";
  const navItems = NAV[role] || [];

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative z-30 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-slate-800 text-lg">PulseHR</span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold text-white", ROLE_COLOR[role])}>
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            {ROLE_LABEL[role] || role}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">{user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-blue-600" : "text-slate-400")} />
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
              {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {user?.full_name || user?.email}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}