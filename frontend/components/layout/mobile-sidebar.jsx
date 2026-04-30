"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { getNavigationForRole } from "@/components/navigation-config";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export function MobileSidebar({ role = "employee", isOpen, onClose }) {
  const pathname = usePathname();
  const groups = getNavigationForRole(role);

  return (
    <div className={cn("fixed inset-0 z-40 xl:hidden", isOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <div className={cn("absolute inset-0 bg-slate-950/50 transition-opacity", isOpen ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside className={cn("absolute inset-y-0 left-0 flex w-80 max-w-[88vw] flex-col border-r border-slate-800 bg-slate-950 px-4 py-5 text-slate-100 shadow-2xl transition-transform", isOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">PulseHR</div>
            <div className="mt-1 text-lg font-semibold text-white">Workspace</div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-6 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} onClick={onClose} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm", active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white")}>
                      <Icon className={cn("h-4 w-4", active ? "text-blue-300" : "text-slate-500")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
