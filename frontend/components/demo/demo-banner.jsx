'use client';

export function DemoBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-50">
      <span className="font-medium">⚠️ Modalità Demo</span>
      <span className="ml-2">Questi sono dati di esempio. Clicca qui per cancellarli.</span>
    </div>
  );
}