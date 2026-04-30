export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sicurezza</h1>
        
        <div className="prose prose-gray">
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">🔒 Crittografia</h2>
          <p className="text-gray-600">
            Tutti i dati sono crittografati in transito (TLS 1.3) e a riposo (AES-256).
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">🇪🇺 Server in Europa</h2>
          <p className="text-gray-600">
            I dati sono ospitati su server in Europa (AWS Frankfurt) per garantire 
            conformità GDPR.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">✓ Compliance</h2>
          <p className="text-gray-600">
            PulseHR è conforme a:
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>GDPR (Regolamento UE 2016/679)</li>
            <li>Direttiva ePrivacy</li>
            <li>Standard ISO 27001 (in fase di certificazione)</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">🔑 Autenticazione</h2>
          <p className="text-gray-600">
            Token di autenticazione sicuri con scadenza. 
            Password crittografate con bcrypt.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">📋 Audit Log</h2>
          <p className="text-gray-600">
            Tutte le azioni sensibili sono tracciate con timestamp e utente.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">🔔 Backup</h2>
          <p className="text-gray-600">
            Backup automatici giornalieri con retention di 30 giorni.
          </p>
          
          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">📧 Segnalazione problemi</h2>
          <p className="text-gray-600">
            Segnala vulnerabilità di sicurezza a: <a href="mailto:security@pulsehr.it" className="text-blue-600">security@pulsehr.it</a>
          </p>
        </div>
      </div>
    </div>
  );
}