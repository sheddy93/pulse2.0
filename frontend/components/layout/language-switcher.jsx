'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'it', name: 'Italiano', flag: 'IT' },
  { code: 'en', name: 'English', flag: 'EN' },
];

// Hook to manage language state
function useLanguage() {
  const [language, setLanguage] = useState('it');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('language') || 'it';
    setLanguage(saved);
  }, []);

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
    localStorage.setItem('language', langCode);
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('languageChange', { detail: langCode }));
  };

  return { language, changeLanguage, mounted };
}

export function LanguageSwitcher({ variant = 'sidebar' }) {
  const { language, changeLanguage, mounted } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const handleChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex rounded-lg border border-border overflow-hidden">
        {languages.map((lang) => (
          <div
            key={lang.code}
            className={cn(
              "px-3 py-1.5 text-xs font-medium",
              lang.code === 'it' ? "bg-primary text-primary-foreground" : "bg-card text-muted"
            )}
          >
            {lang.code.toUpperCase()}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Lingua attuale: ${currentLang.name}. Fai clic per cambiare lingua`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-muted transition-colors text-sm"
        >
          <Globe className="w-4 h-4 text-muted" />
          <span className="font-medium">{currentLang.name}</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-soft p-2 z-50 shadow-lg">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleChange(lang.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    language === lang.code
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-bg-muted text-foreground"
                  )}
                >
                  <span className="font-medium">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {language === lang.code && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Sidebar variant - compact buttons
  return (
    <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Seleziona lingua">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          aria-label={`Cambia lingua in ${lang.name}`}
          aria-pressed={language === lang.code}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            language === lang.code
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted hover:bg-bg-muted"
          )}
        >
          {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// Export for other components to use
export function getCurrentLanguage() {
  if (typeof window === 'undefined') return 'it';
  return localStorage.getItem('language') || 'it';
}

// Export event name for listeners
export const LANGUAGE_CHANGE_EVENT = 'languageChange';
