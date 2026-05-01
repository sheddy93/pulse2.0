/**
 * PWAStatusDashboard.jsx
 * ======================
 * Mostra stato PWA, cache status, offline sync
 * - Service Worker status (installed, updating, ready)
 * - Cache size e contenuto
 * - Offline pending entries
 * - Push notification status
 * 
 * Usare in settings o debug panel
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Database, Wifi, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PWAStatusDashboard() {
  const [swStatus, setSWStatus] = useState('unknown');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState({});
  const [notificationStatus, setNotificationStatus] = useState('default');
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Service Worker status
    checkSWStatus();
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkSWStatus = async () => {
    if (!('serviceWorker' in navigator)) {
      setSWStatus('unsupported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.installing) {
        setSWStatus('installing');
      } else if (registration.waiting) {
        setSWStatus('waiting');
        setUpdateAvailable(true);
      } else if (registration.active) {
        setSWStatus('active');
      }

      // Get cache status
      getCacheStatus();
    } catch (error) {
      console.error('SW status check failed:', error);
      setSWStatus('error');
    }
  };

  const getCacheStatus = async () => {
    try {
      const cacheNames = await caches.keys();
      const status = {};

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        status[name] = keys.length;
      }

      setCacheStatus(status);
    } catch (error) {
      console.error('Cache status check failed:', error);
    }
  };

  const handleUpdateSW = () => {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      if (event.data.type === 'SW_ACTIVATED') {
        window.location.reload();
      }
    };

    navigator.serviceWorker.controller?.postMessage(
      { type: 'SKIP_WAITING' },
      [channel.port2]
    );
  };

  const handleClearCache = async () => {
    if (!confirm('Cancellare tutti i cache? L\'app dovrà ri-scaricare i dati.')) return;

    const channel = new MessageChannel();
    
    channel.port1.onmessage = () => {
      getCacheStatus();
      alert('Cache cancellato con successo');
    };

    navigator.serviceWorker.controller?.postMessage(
      { type: 'CLEAR_CACHE' },
      [channel.port2]
    );
  };

  const handleRequestNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
    } catch (error) {
      console.error('Notification request failed:', error);
    }
  };

  const getTotalCacheSize = () => {
    return Object.values(cacheStatus).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">PWA Status</h2>
      </div>

      {/* Service Worker Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              swStatus === 'active' ? 'bg-green-500' :
              swStatus === 'waiting' ? 'bg-yellow-500' :
              swStatus === 'installing' ? 'bg-blue-500' :
              'bg-red-500'
            }`} />
            <div>
              <p className="text-sm font-semibold text-slate-900">Service Worker</p>
              <p className="text-xs text-slate-500 capitalize">{swStatus}</p>
            </div>
          </div>
          <RefreshCw 
            className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600"
            onClick={checkSWStatus}
          />
        </div>

        {updateAvailable && (
          <button
            onClick={handleUpdateSW}
            className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
          >
            Update Service Worker
          </button>
        )}
      </div>

      {/* Online Status */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">Connection</p>
            <p className="text-xs text-slate-500">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              notificationStatus === 'granted' ? 'bg-green-500' :
              notificationStatus === 'denied' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500 capitalize">{notificationStatus}</p>
            </div>
          </div>
        </div>

        {notificationStatus !== 'granted' && notificationStatus !== 'denied' && (
          <button
            onClick={handleRequestNotifications}
            className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            Enable Notifications
          </button>
        )}
      </div>

      {/* Cache Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <p className="text-sm font-semibold text-slate-900">Cache Storage</p>
          </div>
          <p className="text-xs text-slate-600">
            {getTotalCacheSize()} entries
          </p>
        </div>

        <div className="space-y-2">
          {Object.entries(cacheStatus).map(([name, count]) => (
            <div key={name} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
              <span className="text-slate-700 font-medium">{name}</span>
              <span className="text-slate-500">{count} items</span>
            </div>
          ))}
        </div>

        {getTotalCacheSize() > 0 && (
          <button
            onClick={handleClearCache}
            className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Clear Cache
          </button>
        )}
      </div>

      {/* Feature Support */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-900 uppercase">Supported Features</p>
        <div className="space-y-1">
          {[
            { name: 'Service Worker', supported: 'serviceWorker' in navigator },
            { name: 'Push Notifications', supported: 'PushManager' in window },
            { name: 'IndexedDB', supported: 'indexedDB' in window },
            { name: 'Background Sync', supported: 'SyncManager' in window },
            { name: 'Web Workers', supported: 'Worker' in window },
          ].map(({ name, supported }) => (
            <div key={name} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{name}</span>
              {supported ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-slate-600 space-y-1">
        <p>
          <strong>Cache Strategy:</strong> Network-first with intelligent fallback
        </p>
        <p>
          <strong>Offline Sync:</strong> Pending entries saved to IndexedDB
        </p>
        <p>
          <strong>TTL:</strong> Assets 30d, API 1h, Pages 24h, Images 7d
        </p>
      </div>
    </div>
  );
}