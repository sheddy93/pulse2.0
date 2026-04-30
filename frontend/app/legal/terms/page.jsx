export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Termini di Servizio</h1>
        
        <div className="prose prose-gray">
          <p className="text-gray-600 mb-4">
            <strong>Ultimo aggiornamento:</strong> 25 Aprile 2026
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Accettazione</h2>
          <p className="text-gray-600">
            Utilizzando PulseHR accetti questi termini. Se non li accetti, non utilizzare il servizio.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Descrizione del servizio</h2>
          <p className="text-gray-600">
            PulseHR è una piattaforma SaaS per la gestione HR che include presenze, ferie, 
            documenti e workflow per aziende italiane.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Account e sicurezza</h2>
          <p className="text-gray-600">
            Sei responsabile di mantenere sicure le tue credenziali. Segnala immediatamente 
            qualsiasi uso non autorizzato.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Uso accettabile</h2>
          <p className="text-gray-600">
            Non utilizzare PulseHR per attività illegali o non autorizzate. 
            L&apos;utente è responsabile dei contenuti caricati.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Proprietà intellettuale</h2>
          <p className="text-gray-600">
            PulseHR e i suoi contenuti sono proprietà di PulseHR SRL.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6. Limitazione di responsabilità</h2>
          <p className="text-gray-600">
            Il servizio è fornito &quot;così com&apos;è&quot;. Non siamo responsabili per perdite dovute 
            all&apos;uso della piattaforma.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7. Modifiche</h2>
          <p className="text-gray-600">
            Possiamo modificare questi termini con preavviso di 30 giorni.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8. Legge applicabile</h2>
          <p className="text-gray-600">
            Questi termini sono regolati dalla legge italiana.
          </p>
        </div>
      </div>
    </div>
  );
}