// PWA Utilities for service worker registration and notification handling

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return false;
    }
  }

  return false;
};

export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey || undefined
    });
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
};

/**
 * Offline Time Entry Storage (IndexedDB)
 */
const DB_NAME = 'PulseHR';
const STORE_NAME = 'pending_time_entries';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

/**
 * Salva una timbratura offline in IndexedDB
 */
export const saveTimeEntryOffline = async (entry) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({ ...entry, savedAt: new Date().toISOString(), synced: false });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Offline save failed:', error);
    return false;
  }
};

/**
 * Legge tutte le timbrature non sincronizzate
 */
export const getPendingTimeEntries = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const entries = store.getAll();
    return new Promise((resolve, reject) => {
      entries.onsuccess = () => resolve(entries.result.filter(e => !e.synced));
      entries.onerror = () => reject(entries.error);
    });
  } catch (error) {
    console.error('Failed to get pending entries:', error);
    return [];
  }
};

/**
 * Sincronizza timbrature offline con il server
 */
export const syncOfflineTimeEntries = async (base44) => {
  const pending = await getPendingTimeEntries();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      const { id, synced: _, ...data } = entry;
      await base44.entities.TimeEntry.create(data);
      
      // Marca come sincronizzato
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const updated = { ...entry, synced: true };
      store.put(updated);
      
      synced++;
    } catch (error) {
      console.error(`Sync failed for entry:`, error);
      failed++;
    }
  }

  return { synced, failed };
};

/**
 * Pulisce le timbrature sincronizzate da IndexedDB
 */
export const cleanupSyncedEntries = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const allEntries = store.getAll();
    
    return new Promise((resolve, reject) => {
      allEntries.onsuccess = () => {
        const toDelete = allEntries.result.filter(e => e.synced);
        toDelete.forEach(e => store.delete(e.id));
        tx.oncomplete = () => resolve(toDelete.length);
        tx.onerror = () => reject(tx.error);
      };
      allEntries.onerror = () => reject(allEntries.error);
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return 0;
  }
};

export const unsubscribeFromPushNotifications = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
    }
  } catch (error) {
    console.error('Unsubscribe failed:', error);
  }
};

export const showLocalNotification = async (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232563eb" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">P</text></svg>',
        badge: '/data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232563eb" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">P</text></svg>',
        ...options
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }
};

export const isInstallable = () => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

export const isOnMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         navigator.standalone === true;
};

// IndexedDB helpers for offline support
export const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PulseHR', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingEntries')) {
        db.createObjectStore('pendingEntries', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingNotifications')) {
        db.createObjectStore('pendingNotifications', { keyPath: 'id' });
      }
    };
  });
};

export const savePendingEntry = async (entry) => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingEntries'], 'readwrite');
      const store = transaction.objectStore('pendingEntries');
      const request = store.add({ ...entry, id: `${Date.now()}-${Math.random()}` });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Failed to save pending entry:', error);
  }
};

export const requestBackgroundSync = async (tag) => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered for:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
};