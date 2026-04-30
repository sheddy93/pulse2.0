"use client";

import { useLanguage } from "@/components/language-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { LaptopMinimal, MoonStar, SunMedium } from "lucide-react";

const THEME_OPTIONS = {
  light: {
    icon: SunMedium,
    it: "Chiaro",
    en: "Light",
  },
  dark: {
    icon: MoonStar,
    it: "Scuro",
    en: "Dark",
  },
  system: {
    icon: LaptopMinimal,
    it: "Sistema",
    en: "System",
  },
};

export function ThemeToggle() {
  const { language } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const CurrentIcon = THEME_OPTIONS[resolvedTheme]?.icon || MoonStar;
  const label = language === "it" ? "Tema" : "Theme";

  return (
    <Dropdown
      align="end"
      trigger={
        <Button aria-label={label} className="topbar-icon-button" size="icon" type="button" variant="ghost">
          <CurrentIcon className="h-4 w-4" />
        </Button>
      }
    >
      {Object.entries(THEME_OPTIONS).map(([value, option]) => {
        const Icon = option.icon;
        return (
          <button
            className={`dropdown-item ${theme === value ? "dropdown-item-active" : ""}`}
            key={value}
            onClick={() => setTheme(value)}
            type="button"
          >
            <span className="dropdown-item-leading">
              <Icon className="h-4 w-4" />
            </span>
            <span>{option[language]}</span>
          </button>
        );
      })}
    </Dropdown>
  );
}
