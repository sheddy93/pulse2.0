"use client";

export default function ConsultantCompaniesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Aziende Clienti
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Visualizza e gestisci le aziende collegate
        </p>
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Funzionalità in arrivo
        </h2>
        <p className="text-muted max-w-md mx-auto">
          La gestione delle aziende clienti sarà presto disponibile. 
          Usa il tuo ID pubblico per collegarti alle aziende.
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