"use client";

import { createContext, useContext, useEffect, useState } from "react";

// LanguageProvider Context
const LanguageContext = createContext({
  language: "IT",
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("IT");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage on mount
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && (savedLanguage === "IT" || savedLanguage === "EN")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    if (mounted) {
      localStorage.setItem("language", lang);
      // Dispatch custom event for sync
      window.dispatchEvent(
        new CustomEvent("languageChange", { detail: { language: lang } })
      );
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Size configurations
const sizes = {
  compact: {
    container: "h-8 px-1 gap-1",
    button: "h-6 px-3 text-xs font-medium",
    indicator: "h-6",
  },
  default: {
    container: "h-10 px-2 gap-1.5",
    button: "h-8 px-4 text-sm font-semibold",
    indicator: "h-8",
  },
  large: {
    container: "h-12 px-2.5 gap-2",
    button: "h-10 px-6 text-base font-semibold",
    indicator: "h-10",
  },
};

// Main Component
export default function LanguageSwitcherSegmented({
  size = "default",
  className = "",
  ariaLabel = "Language selector",
}) {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={`inline-flex rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 ${sizes[size].container} ${className}`}
        aria-hidden="true"
      >
        <button className={`relative z-10 rounded-full transition-colors ${sizes[size].button} text-slate-600 dark:text-slate-400`}>
          IT
        </button>
        <button className={`relative z-10 rounded-full transition-colors ${sizes[size].button} text-slate-600 dark:text-slate-400`}>
          EN
        </button>
      </div>
    );
  }

  const languages = [
    { code: "IT", label: "Italiano" },
    { code: "EN", label: "English" },
  ];

  const activeIndex = languages.findIndex((lang) => lang.code === language);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 ${sizes[size].container} ${className}`}
    >
      {/* Sliding Indicator */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-300 ease-in-out ${sizes[size].indicator}`}
        style={{
          width: `calc(50% - ${size === "compact" ? "4px" : size === "default" ? "6px" : "8px"})`,
          left: activeIndex === 0 
            ? size === "compact" ? "4px" : size === "default" ? "6px" : "8px"
            : `calc(50% + ${size === "compact" ? "2px" : size === "default" ? "3px" : "4px"})`,
        }}
        aria-hidden="true"
      />

      {/* Language Buttons */}
      {languages.map((lang, index) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            role="tab"
            aria-selected={isActive}
            aria-label={`Switch to ${lang.label}`}
            onClick={() => setLanguage(lang.code)}
            className={`
              relative z-10 rounded-full transition-all duration-300 ease-in-out
              ${sizes[size].button}
              ${
                isActive
                  ? "text-white font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800
            `}
          >
            {lang.code}
          </button>
        );
      })}
    </div>
  );
}

// Standalone variant without Provider requirement
export function LanguageSwitcherStandalone({
  size = "default",
  className = "",
  ariaLabel = "Language selector",
  onChange,
  defaultLanguage = "IT",
}) {
  const [language, setLanguageState] = useState(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage on mount
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && (savedLanguage === "IT" || savedLanguage === "EN")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    if (mounted) {
      localStorage.setItem("language", lang);
      onChange?.(lang);
      // Dispatch custom event for sync
      window.dispatchEvent(
        new CustomEvent("languageChange", { detail: { language: lang } })
      );
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={`inline-flex rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 ${sizes[size].container} ${className}`}
        aria-hidden="true"
      >
        <button className={`relative z-10 rounded-full transition-colors ${sizes[size].button} text-slate-600 dark:text-slate-400`}>
          IT
        </button>
        <button className={`relative z-10 rounded-full transition-colors ${sizes[size].button} text-slate-600 dark:text-slate-400`}>
          EN
        </button>
      </div>
    );
  }

  const languages = [
    { code: "IT", label: "Italiano" },
    { code: "EN", label: "English" },
  ];

  const activeIndex = languages.findIndex((lang) => lang.code === language);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 ${sizes[size].container} ${className}`}
    >
      {/* Sliding Indicator */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-300 ease-in-out ${sizes[size].indicator}`}
        style={{
          width: `calc(50% - ${size === "compact" ? "4px" : size === "default" ? "6px" : "8px"})`,
          left: activeIndex === 0 
            ? size === "compact" ? "4px" : size === "default" ? "6px" : "8px"
            : `calc(50% + ${size === "compact" ? "2px" : size === "default" ? "3px" : "4px"})`,
        }}
        aria-hidden="true"
      />

      {/* Language Buttons */}
      {languages.map((lang, index) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            role="tab"
            aria-selected={isActive}
            aria-label={`Switch to ${lang.label}`}
            onClick={() => setLanguage(lang.code)}
            className={`
              relative z-10 rounded-full transition-all duration-300 ease-in-out
              ${sizes[size].button}
              ${
                isActive
                  ? "text-white font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800
            `}
          >
            {lang.code}
          </button>
        );
      })}
    </div>
  );
}
