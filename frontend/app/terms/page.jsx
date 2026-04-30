export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Termini e Condizioni
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              <strong>Status:</strong> In aggiornamento per closed beta
            </p>
            
            <p className="text-gray-600 mb-4">
              PulseHR è attualmente in fase di sviluppo e testing. I presenti 
              Termini e Condizioni sono in fase di aggiornamento per conformarsi 
              agli standard richiesti dalla closed beta.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              Servizio
            </h2>
            <p className="text-gray-600 mb-4">
              PulseHR fornisce una piattaforma di gestione HR. L'accesso al 
              servizio è riservato agli utenti registrati nell'ambito del 
              programma di closed beta.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              Limitazioni di Responsabilità
            </h2>
            <p className="text-gray-600 mb-4">
              Durante la fase di closed beta, il servizio potrebbe subire 
              interruzioni o modifiche senza preavviso. PulseHR non garantisce 
              la continuità del servizio.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              Contatti
            </h2>
            <p className="text-gray-600">
              Per qualsiasi domanda relativa ai termini, contatta il supporto 
              all'indirizzo: <strong>legal@pulsehr.it</strong>
            </p>
            
            <p className="text-sm text-gray-500 mt-8">
              Ultimo aggiornamento: Aprile 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}