import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function AppInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShow(false);
      }
    }
  };

  if (!show || !deferredPrompt) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Download className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">Installa PulseHR sul tuo telefono</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="px-4 py-1.5 bg-white text-blue-600 font-semibold rounded-lg text-sm hover:bg-blue-50 transition-colors"
        >
          Installa
        </button>
        <button
          onClick={() => setShow(false)}
          className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}