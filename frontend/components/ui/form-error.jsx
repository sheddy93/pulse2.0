'use client';

export function FormError({ error, field }) {
  if (!error) return null;
  
  // Errore per campo specifico
  if (field && error.fields?.[field]) {
    return (
      <p className="mt-1 text-sm text-red-600">
        {Array.isArray(error.fields[field]) 
          ? error.fields[field][0] 
          : error.fields[field]}
      </p>
    );
  }
  
  // Errore globale
  if (error.message && !field) {
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error.message}</p>
      </div>
    );
  }
  
  // Errore generico (stringa)
  if (typeof error === 'string') {
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }
  
  return null;
}

export default FormError;