import { useState, useEffect } from "react";

const THEME_KEY = "pulsehr_theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle("dark-dashboard", theme === "dark");
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  return { theme, toggleTheme, isDark: theme === "dark" };
}