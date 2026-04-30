// components/pwa/pwa-provider.jsx
'use client';

import { useEffect, useState } from 'react';

export function PWARegister() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker DISABLED for MVP - uncomment to enable later
    // if ('serviceWorker' in navigator) {
    //   navigator.serviceWorker
    //     .register('/sw.js')
    //     .then((registration) => {
    //       console.log('SW registered:', registration.scope);
    //     })
    //     .catch((error) => {
    //       console.log('SW registration failed:', error);
    //     });
    // }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.646a9 9 0 010 12.728m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
        <span className="font-medium">Sei offline. Alcune funzioni potrebbero non essere disponibili.</span>
      </div>
    );
  }

  return null;
}

export default PWARegister;
