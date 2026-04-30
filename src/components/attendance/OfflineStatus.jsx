import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function OfflineStatus({ isOnline, isSyncing, pendingCount = 0 }) {
  const [show, setShow] = useState(!isOnline);

  useEffect(() => {
    setShow(!isOnline || isSyncing);
  }, [isOnline, isSyncing]);

  if (!show) return null;

  return (
    <div className={`fixed bottom-6 right-6 rounded-lg shadow-lg p-4 text-sm font-medium max-w-xs ${
      isSyncing ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sincronizzazione in corso...</span>
          </>
        ) : isOnline ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Sincronizzato</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>{pendingCount} timbratura{pendingCount !== 1 ? 'e' : ''} offline</span>
          </>
        )}
      </div>
    </div>
  );
}