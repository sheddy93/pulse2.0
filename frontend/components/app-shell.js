"use client";

import { useMemo, useState } from "react";
import { getStoredUser } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { cn } from "@/lib/cn";

/**
 * Shared authenticated shell.
 *
 * Why this file matters:
 * - central place for the product frame
 * - makes UI changes global and safer
 * - supports future modules like Operational Assistant, notifications, extra workspaces
 */
export function AppShell({ children, contentClassName = "" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = useMemo(() => getStoredUser(), []);
  const role = currentUser?.role || "employee";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar role={role} className="hidden xl:flex" />

        <MobileSidebar role={role} isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar role={role} onOpenSidebar={() => setMobileOpen(true)} />

          <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
            <div className={cn("mx-auto w-full max-w-[1600px]", contentClassName)}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
