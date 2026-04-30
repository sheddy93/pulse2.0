"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Visual marker for the built-in operational assistant.
 *
 * Design notes:
 * - intentionally human-like and feminine-coded without resembling a real person
 * - used where the assistant "speaks" or offers suggestions
 * - keep this component small and reusable so the assistant can appear
 *   in dashboards, notifications, chat panels and future automation flows
 */
export function OperationalAssistantAvatar({ className = "", size = "md", withLabel = false }) {
  const sizeMap = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full border border-violet-200 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-blue-500 shadow-lg",
          sizeMap[size]
        )}
        aria-hidden="true"
      >
        <div className="absolute inset-x-1 top-1 h-1/2 rounded-t-full bg-slate-900/20" />
        <div className="absolute left-1/2 top-[27%] h-[28%] w-[28%] -translate-x-1/2 rounded-full bg-white/95" />
        <div className="absolute left-1/2 top-[48%] h-[30%] w-[46%] -translate-x-1/2 rounded-t-[999px] bg-white/95" />
        <div className="absolute -right-1 bottom-0 rounded-tl-2xl bg-white/15 px-1.5 py-1">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      {withLabel ? (
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">Assistente Operativo</div>
          <div className="text-xs text-slate-500">Suggerimenti operativi PulseHR</div>
        </div>
      ) : null}
    </div>
  );
}

export default OperationalAssistantAvatar;
