"use client";

export default function CompanyPayrollPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Payroll
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestione buste paga e prospetti payroll
        </p>
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Funzionalità in arrivo
        </h2>
        <p className="text-muted max-w-md mx-auto">
          La gestione payroll sarà presto disponibile.
        </p>
        <a 
          href="/dashboard/company"
          className="inline-flex items-center mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Torna alla Dashboard
        </a>
      </div>
    </div>
  );
}