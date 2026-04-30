"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigationForRole } from "@/components/navigation-config";
import { cn } from "@/lib/cn";
import { OperationalAssistantAvatar } from "@/components/ui/operational-assistant-avatar";

export function Sidebar({ role = "employee", className = "" }) {
  const pathname = usePathname();
  const groups = getNavigationForRole(role);

  return (
    <aside
      className={cn(
        "w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 px-4 py-5",
        className
      )}
    >
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-400">PulseHR</div>
        <div className="mt-2 text-xl font-semibold text-white">Hybrid Workspace</div>
        <p className="mt-2 text-sm text-slate-400">
          Sidebar unificata con esperienza diversa per ruolo.
        </p>
      </div>

      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item, index) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                      active
                        ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-blue-300" : "text-slate-500")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <OperationalAssistantAvatar withLabel size="sm" />
        <p className="mt-3 text-sm text-slate-400">
          L'assistente operativo fornisce suggerimenti basati sulle regole HR e workflow PulseHR.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
