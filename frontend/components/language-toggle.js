"use client";

import { useLanguage } from "@/components/language-provider";


export function LanguageToggle() {
  const { language, setLanguage, dictionary } = useLanguage();

  return (
    <div className="language-toggle" role="group" aria-label="Language switcher">
      <button
        className={`language-toggle-button ${language === "it" ? "language-toggle-button-active" : ""}`}
        onClick={() => setLanguage("it")}
        type="button"
      >
        {dictionary.common.italian}
      </button>
      <button
        className={`language-toggle-button ${language === "en" ? "language-toggle-button-active" : ""}`}
        onClick={() => setLanguage("en")}
        type="button"
      >
        {dictionary.common.english}
      </button>
    </div>
  );
}
