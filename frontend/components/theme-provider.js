"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hr_theme";
const THEMES = ["light", "dark", "system"];

const ThemeContext = createContext(null);

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themePreference = theme;
  document.documentElement.style.colorScheme = resolvedTheme;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.classList.toggle("light", resolvedTheme === "light");
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme = THEMES.includes(storedTheme) ? storedTheme : "system";
    setThemeState(nextTheme);
    const nextResolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme;
    setResolvedTheme(nextResolvedTheme);
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleSystemThemeChange() {
      if (theme !== "system") {
        return;
      }

      const nextResolvedTheme = getSystemTheme();
      setResolvedTheme(nextResolvedTheme);
      applyTheme("system");
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function handleStorage(event) {
      if (event.key !== STORAGE_KEY) {
        return;
      }
      const nextTheme = THEMES.includes(event.newValue) ? event.newValue : "system";
      setThemeState(nextTheme);
      const nextResolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme;
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextTheme);
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function setTheme(nextTheme) {
    const safeTheme = THEMES.includes(nextTheme) ? nextTheme : "system";
    window.localStorage.setItem(STORAGE_KEY, safeTheme);
    setThemeState(safeTheme);
    const nextResolvedTheme = safeTheme === "system" ? getSystemTheme() : safeTheme;
    setResolvedTheme(nextResolvedTheme);
    applyTheme(safeTheme);
  }

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
