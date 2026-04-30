export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-gray">
          <p className="text-gray-600 mb-4">
            <strong>Ultimo aggiornamento:</strong> 25 Aprile 2026
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Titolare del trattamento</h2>
          <p className="text-gray-600">
            PulseHR SRL, con sede legale in Via Roma 123, 00100 Roma, Italia.
            P.IVA: 12345678901
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Dati raccolti</h2>
          <p className="text-gray-600">
            Raccogliamo i seguenti dati personali per fornire i nostri servizi HR:
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>Dati anagrafici (nome, cognome, email)</li>
            <li>Dati aziendali (nome azienda, P.IVA)</li>
            <li>Dati di presenza (timbrature, ferie)</li>
            <li>Documenti caricati dagli utenti</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Finalità del trattamento</h2>
          <p className="text-gray-600">
            I dati sono trattati per gestire le procedure HR dell&apos;azienda cliente, 
            incluse presenze, ferie, documenti e compliance.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Base giuridica</h2>
          <p className="text-gray-600">
            Il trattamento avviene sulla base dell&apos;esecuzione del contratto di servizio 
            e del legittimo interesse del titolare.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Conservazione</h2>
          <p className="text-gray-600">
            I dati sono conservati per la durata necessaria a fornire il servizio e per 
            gli obblighi di legge.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6. Diritti dell&apos;interessato</h2>
          <p className="text-gray-600">
            Puoi esercitare i tuoi diritti (accesso, rettifica, cancellazione) 
            scrivendo a <a href="mailto:privacy@pulsehr.it" className="text-blue-600">privacy@pulsehr.it</a>.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7. Contatti</h2>
          <p className="text-gray-600">
            Per domande sulla privacy: <a href="mailto:privacy@pulsehr.it" className="text-blue-600">privacy@pulsehr.it</a>
          </p>
        </div>
      </div>
    </div>
  );
}