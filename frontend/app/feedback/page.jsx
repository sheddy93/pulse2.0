'use client';

import { useState } from 'react';

const CATEGORIES = [
  { id: 'bug', label: '🐛 Bug / Errore' },
  { id: 'suggestion', label: '💡 Suggerimento' },
  { id: 'ux', label: '🎨 UX/UI' },
  { id: 'feature', label: '✨ Nuova feature' },
  { id: 'other', label: '❓ Altro' },
];

export default function FeedbackPage() {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    // TODO: Inviare feedback via API o email
    console.log('Feedback:', { category, message, email });
    
    // Simula invio
    await new Promise(r => setTimeout(r, 1000));
    
    setLoading(false);
    setSubmitted(true);
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Grazie per il tuo feedback!</h2>
          <p className="text-gray-600 mb-6">
            Abbiamo ricevuto il tuo messaggio. Ti risponderemo al più presto.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-700">
            Torna alla home
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Segnala un problema</h1>
          <p className="text-gray-600">
            Aiutaci a migliorare PulseHR. Segnala bug, suggerimenti o идеi.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                    category === cat.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (opzionale)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario@azienda.it"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Per ricevere aggiornamenti sulla tua segnalazione</p>
          </div>
          
          {/* Messaggio */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Messaggio *
            </label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descrivi il problema o il tuo suggerimento..."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !category || !message}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Invio in corso...' : 'Invia Feedback'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Oppure scrivici direttamente a <a href="mailto:support@pulsehr.it" className="text-blue-600">support@pulsehr.it</a>
        </p>
      </div>
    </div>
  );
}