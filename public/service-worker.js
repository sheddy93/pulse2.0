const CACHE_NAME = 'pulsehr-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.log('Static cache incomplete, continuing with partial cache');
      });
    })
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls (handle separately)
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses (except login/auth)
          if (response.ok && !url.pathname.includes('/auth')) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline - cached data unavailable', { status: 503 });
          });
        })
    );
    return;
  }

  // For HTML/JS/CSS: network first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // For images and fonts: cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request);
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nuova notifica da PulseHR',
      icon: '/data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232563eb" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">P</text></svg>',
      badge: '/data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232563eb" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">P</text></svg>',
      tag: data.tag || 'pulsehr-notification',
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/',
        type: data.type || 'default'
      }
    };

    if (data.actions) {
      options.actions = data.actions;
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'PulseHR', options)
    );
  } catch (error) {
    console.log('Push event parse error:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if the app is already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncAttendance() {
  try {
    const db = await openIndexedDB();
    const pendingEntries = await getPendingEntries(db);
    
    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });

        if (response.ok) {
          await removePendingEntry(db, entry.id);
        }
      } catch (error) {
        console.log('Sync failed for entry:', entry.id);
      }
    }
  } catch (error) {
    console.log('Attendance sync error:', error);
  }
}

async function syncNotifications() {
  // Sync notification read status
  try {
    const db = await openIndexedDB();
    const updates = await getPendingNotificationUpdates(db);
    
    for (const update of updates) {
      try {
        await fetch(`/api/notifications/${update.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_read: true })
        });
        
        await removePendingNotificationUpdate(db, update.id);
      } catch (error) {
        console.log('Notification sync failed:', error);
      }
    }
  } catch (error) {
    console.log('Notification sync error:', error);
  }
}

function openIndexedDB() {
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
}

async function getPendingEntries(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingEntries'], 'readonly');
    const store = transaction.objectStore('pendingEntries');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingEntry(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingEntries'], 'readwrite');
    const store = transaction.objectStore('pendingEntries');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getPendingNotificationUpdates(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingNotifications'], 'readonly');
    const store = transaction.objectStore('pendingNotifications');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingNotificationUpdate(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingNotifications'], 'readwrite');
    const store = transaction.objectStore('pendingNotifications');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
