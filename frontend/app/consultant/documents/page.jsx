"use client";

export default function ConsultantDocumentsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Documenti
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestisci i documenti delle aziende collegate
        </p>
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Funzionalità in arrivo
        </h2>
        <p className="text-muted max-w-md mx-auto">
          La gestione documenti sarà presto disponibile.
        </p>
        <a 
          href="/dashboard/consultant"
          className="inline-flex items-center mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Torna alla Dashboard
        </a>
      </div>
    </div>
  );
}