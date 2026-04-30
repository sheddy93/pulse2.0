"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

/**
 * Professional theme switcher with segmented control design.
 * 
 * Features:
 * - Three options: Light, Dark, System
 * - Segmented control UI with smooth animations
 * - Active state: blue background with white icon
 * - Inactive state: muted gray icon
 * - Persists to localStorage via existing ThemeProvider
 * - Syncs with system preference when System is selected
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 shadow-sm border border-slate-200 dark:border-slate-700">
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative inline-flex items-center justify-center
              rounded-md px-3 py-1.5 min-w-[2.5rem]
              text-sm font-medium
              transition-all duration-200 ease-in-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-80 hover:opacity-100"
              }
            `}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={isActive}
          >
            <Icon 
              className={`
                h-4 w-4 transition-transform duration-200
                ${isActive ? "scale-110" : "scale-100"}
              `}
            />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
