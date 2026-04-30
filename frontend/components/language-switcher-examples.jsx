"use client";

/**
 * LANGUAGE SWITCHER - USAGE EXAMPLES
 * ==================================
 * Professional segmented language switcher for PulseHR
 */

import LanguageSwitcherSegmented, {
  LanguageProvider,
  LanguageSwitcherStandalone,
  useLanguage,
} from "./language-switcher-segmented";

// ============================================================================
// EXAMPLE 1: Basic Usage with Provider (Recommended)
// ============================================================================

export function Example1_BasicUsage() {
  return (
    <LanguageProvider>
      <div className="p-8 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Language Switcher Examples
        </h2>

        {/* Default Size */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Default Size
          </label>
          <LanguageSwitcherSegmented />
        </div>

        {/* Compact Size (for header) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Compact Size (Header)
          </label>
          <LanguageSwitcherSegmented size="compact" />
        </div>

        {/* Large Size */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Large Size
          </label>
          <LanguageSwitcherSegmented size="large" />
        </div>

        {/* Current Language Display */}
        <CurrentLanguageDisplay />
      </div>
    </LanguageProvider>
  );
}

// Helper component to show current language
function CurrentLanguageDisplay() {
  const { language } = useLanguage();
  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <p className="text-sm text-blue-900 dark:text-blue-100">
        Current Language: <strong>{language}</strong>
      </p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Standalone Usage (Without Provider)
// ============================================================================

export function Example2_Standalone() {
  const handleLanguageChange = (lang) => {
    console.log("Language changed to:", lang);
  };

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Standalone Switcher
      </h2>

      <LanguageSwitcherStandalone
        size="default"
        onChange={handleLanguageChange}
        defaultLanguage="IT"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Header Integration
// ============================================================================

export function Example3_HeaderIntegration() {
  return (
    <LanguageProvider>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="container-wide py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              PulseHR
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Dipendenti
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Report
            </a>
          </nav>

          {/* Right Section with Language Switcher */}
          <div className="flex items-center gap-4">
            <LanguageSwitcherSegmented size="compact" />
            <button className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                JD
              </span>
            </button>
          </div>
        </div>
      </header>
    </LanguageProvider>
  );
}

// ============================================================================
// EXAMPLE 4: Settings Panel
// ============================================================================

export function Example4_SettingsPanel() {
  return (
    <LanguageProvider>
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Impostazioni
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Personalizza le tue preferenze
            </p>
          </div>

          {/* Settings Items */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {/* Language Setting */}
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Lingua / Language
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Seleziona la tua lingua preferita
                </p>
              </div>
              <LanguageSwitcherSegmented size="default" />
            </div>

            {/* Other Settings */}
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Notifiche
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Gestisci le notifiche email
                </p>
              </div>
              <button className="h-6 w-11 bg-blue-600 rounded-full relative transition-colors">
                <span className="absolute right-0.5 top-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </LanguageProvider>
  );
}

// ============================================================================
// EXAMPLE 5: Multi-component Sync
// ============================================================================

export function Example5_MultiComponentSync() {
  return (
    <LanguageProvider>
      <div className="p-8 space-y-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Multiple Switchers (Auto-Synced)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Switcher 1
            </p>
            <LanguageSwitcherSegmented size="compact" />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Switcher 2
            </p>
            <LanguageSwitcherSegmented size="default" />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Switcher 3
            </p>
            <LanguageSwitcherSegmented size="large" />
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          💡 All switchers are automatically synchronized through the LanguageProvider context
        </p>

        <CurrentLanguageDisplay />
      </div>
    </LanguageProvider>
  );
}

// ============================================================================
// EXAMPLE 6: Custom Styled Variant
// ============================================================================

export function Example6_CustomStyles() {
  return (
    <LanguageProvider>
      <div className="p-8 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Custom Styled Variants
        </h2>

        {/* With custom className */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Custom Margin & Shadow
          </label>
          <LanguageSwitcherSegmented
            size="default"
            className="shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/10"
          />
        </div>

        {/* In a card */}
        <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-2xl border border-blue-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Benvenuto in PulseHR
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Gestisci il tuo team con facilità
              </p>
            </div>
            <LanguageSwitcherSegmented size="large" />
          </div>
        </div>
      </div>
    </LanguageProvider>
  );
}
