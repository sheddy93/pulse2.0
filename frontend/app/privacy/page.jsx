export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              <strong>Status:</strong> In aggiornamento per closed beta
            </p>
            
            <p className="text-gray-600 mb-4">
              PulseHR è attualmente in fase di sviluppo e testing. La presente 
              Privacy Policy è in fase di aggiornamento per conformarsi agli 
              standard richiesti dalla closed beta.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              Trattamento dei Dati
            </h2>
            <p className="text-gray-600 mb-4">
              I dati personali degli utenti vengono trattati in conformità con 
              il Regolamento (UE) 2016/679 (GDPR) e la normativa italiana 
              vigente in materia di protezione dei dati personali.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              Contatti
            </h2>
            <p className="text-gray-600">
              Per qualsiasi domanda relativa alla privacy, contatta il supporto 
              all'indirizzo: <strong>privacy@pulsehr.it</strong>
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