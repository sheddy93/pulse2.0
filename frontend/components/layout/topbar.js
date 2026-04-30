"use client";

import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationCenter } from "@/components/notifications/notification-center";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  company_owner: "Titolare",
  company_admin: "Admin Azienda",
  hr_manager: "HR Manager",
  manager: "Manager",
  external_consultant: "Consulente",
  labor_consultant: "Consulente del Lavoro",
  safety_consultant: "Consulente Sicurezza",
  employee: "Dipendente",
};

export function Topbar({ role = "employee", onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={onOpenSidebar}
            aria-label="Apri navigazione"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">PulseHR Workspace</div>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                Esperienza Hybrid
              </h2>
              <span className="hidden rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white sm:inline-flex">
                {ROLE_LABELS[role] || "Workspace"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span className="text-sm text-slate-600">Assistente Operativo pronto</span>
          </div>
          <div className="hidden lg:block">
            <LanguageToggle />
          </div>
          <NotificationCenter />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
