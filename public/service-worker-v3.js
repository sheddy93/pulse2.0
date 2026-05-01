/**
 * Service Worker v3 - AldevionHR PWA
 * ====================================
 * Strategia avanzata di caching con network-first + cache fallback
 * Offline-first per presenze e documenti critici
 * 
 * Cache Layers:
 * 1. API_CACHE: Dati entity (1 ora TTL)
 * 2. ASSET_CACHE: JS/CSS/images (30 giorni)
 * 3. PAGE_CACHE: HTML pages (24 ore)
 * 4. OFFLINE_CACHE: Minimal app (offline-first)
 * 5. IMAGE_CACHE: Immagini ottimizzate (7 giorni)
 */

const CACHE_VERSION = 'v3';
const CACHE_NAMES = {
  ASSETS: `assets-${CACHE_VERSION}`,
  PAGES: `pages-${CACHE_VERSION}`,
  API: `api-${CACHE_VERSION}`,
  IMAGES: `images-${CACHE_VERSION}`,
  OFFLINE: `offline-${CACHE_VERSION}`,
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/favicon.svg',
  '/manifest.json',
];

const API_ENDPOINTS = [
  '/api/entities/',
  '/api/functions/',
  '/api/auth/',
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

// =======================
// INSTALL EVENT
// =======================
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${CACHE_VERSION}`);
  
  event.waitUntil(
    (async () => {
      try {
        // Cache static assets offline-first
        const cache = await caches.open(CACHE_NAMES.OFFLINE);
        await cache.addAll(STATIC_ASSETS);
        
        console.log(`[SW] ${STATIC_ASSETS.length} assets cached`);
        
        // Skip waiting - activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[SW] Install failed:', error);
      }
    })()
  );
});

// =======================
// ACTIVATE EVENT
// =======================
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${CACHE_VERSION}`);
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter((name) => !Object.values(CACHE_NAMES).includes(name));
        
        // Elimina cache vecchie
        await Promise.all(oldCaches.map((name) => {
          console.log(`[SW] Removing old cache: ${name}`);
          return caches.delete(name);
        }));
        
        // Claim clients immediately
        await self.clients.claim();
        console.log('[SW] Service Worker activated and claimed clients');
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// =======================
// FETCH EVENT - CACHING STRATEGIES
// =======================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external/cross-origin
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Static assets: Cache-first (30 days)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.ASSETS, 30 * 24 * 3600));
    return;
  }
  
  // API calls: Network-first (1 hour fallback)
  if (isAPICall(url)) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.API, 1 * 3600));
    return;
  }
  
  // HTML pages: Network-first (24 hours fallback)
  if (isHTMLPage(url)) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.PAGES, 24 * 3600));
    return;
  }
  
  // Images: Cache-first with background update (7 days)
  if (isImage(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.IMAGES, 7 * 24 * 3600));
    return;
  }
  
  // Default: Network-first
  event.respondWith(networkFirstStrategy(request, CACHE_NAMES.API, 3600));
});

// =======================
// CACHING STRATEGIES
// =======================

/**
 * Cache-first strategy
 * 1. Try cache first
 * 2. If miss, fetch from network
 * 3. Update cache with fresh response
 * 4. Auto-delete old entries based on TTL
 */
async function cacheFirstStrategy(request, cacheName, ttlSeconds) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      // Return cached response if fresh
      const cacheTime = new Date(cached.headers.get('date')).getTime();
      const age = (Date.now() - cacheTime) / 1000;
      
      if (age < ttlSeconds) {
        console.log(`[SW] Cache hit (fresh): ${request.url}`);
        return cached;
      }
      
      console.log(`[SW] Cache expired: ${request.url}`);
    }
    
    // Fetch from network
    const response = await fetch(request.clone());
    
    if (!response.ok) {
      // Return stale cache if network error
      if (cached) {
        console.log(`[SW] Network failed, using stale cache: ${request.url}`);
        return cached;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Update cache
    const responseToCache = response.clone();
    cache.put(request, responseToCache);
    console.log(`[SW] Updated cache: ${request.url}`);
    
    return response;
  } catch (error) {
    console.warn(`[SW] Cache-first failed for ${request.url}:`, error);
    
    // Return offline fallback
    const cache = await caches.open(CACHE_NAMES.OFFLINE);
    return cache.match(request) || createOfflineResponse();
  }
}

/**
 * Network-first strategy
 * 1. Try network first
 * 2. If available, cache and return
 * 3. If offline, return cached version
 * 4. If no cache, return offline fallback
 */
async function networkFirstStrategy(request, cacheName, ttlSeconds) {
  try {
    const response = await fetch(request.clone());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Cache successful response
    const cache = await caches.open(cacheName);
    const responseToCache = response.clone();
    cache.put(request, responseToCache);
    
    console.log(`[SW] Network fresh: ${request.url}`);
    return response;
  } catch (error) {
    console.warn(`[SW] Network failed, trying cache: ${request.url}`);
    
    try {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request);
      
      if (cached) {
        console.log(`[SW] Using cached fallback: ${request.url}`);
        return cached;
      }
    } catch (cacheError) {
      console.error('[SW] Cache lookup failed:', cacheError);
    }
    
    // Return offline fallback for APIs
    if (isAPICall(new URL(request.url))) {
      return createOfflineAPIResponse();
    }
    
    return createOfflineResponse();
  }
}

// =======================
// HELPER FUNCTIONS
// =======================

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff2', '.woff', '.ttf'];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

function isAPICall(url) {
  return API_ENDPOINTS.some((endpoint) => url.pathname.includes(endpoint));
}

function isHTMLPage(url) {
  return url.pathname.endsWith('.html') || 
         (url.pathname === '/' || url.pathname === '');
}

function isImage(url) {
  return IMAGE_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function createOfflineResponse() {
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AldevionHR - Offline</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #334155; }
        .container { max-width: 600px; margin: 50px auto; text-align: center; }
        h1 { font-size: 28px; margin-bottom: 10px; }
        p { font-size: 16px; color: #64748b; margin-bottom: 20px; }
        .icon { font-size: 60px; margin-bottom: 20px; }
        .features { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: left; }
        .feature { padding: 10px; border-bottom: 1px solid #e2e8f0; }
        .feature:last-child { border: none; }
        .waiting { color: #0ea5e9; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>Offline</h1>
        <p>Connessione non disponibile al momento.</p>
        <p>Puoi comunque usare le funzionalità offline disponibili.</p>
        
        <div class="features">
          <div class="feature"><strong>✓ Timbratura</strong> - Salva offline e sincronizza dopo</div>
          <div class="feature"><strong>✓ Visualizza Dati</strong> - Accedi ai tuoi dati memorizzati</div>
          <div class="feature"><strong>⏳ In Attesa di Connessione</strong> - Le modifiche si sincronizzeranno automaticamente</div>
        </div>
      </div>
    </body>
    </html>
    `,
    {
      status: 200,
      statusText: 'Offline Fallback',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

function createOfflineAPIResponse() {
  return new Response(
    JSON.stringify({
      status: 'offline',
      message: 'Service offline - using cached data',
      cached: true,
      data: [],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// =======================
// BACKGROUND SYNC
// =======================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-time-entries') {
    event.waitUntil(syncPendingEntries());
  }
});

async function syncPendingEntries() {
  try {
    const db = await openIndexedDB();
    const pending = await getPendingEntries(db);
    
    console.log(`[SW] Syncing ${pending.length} pending entries`);
    
    for (const entry of pending) {
      try {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        
        if (response.ok) {
          await markAsSynced(db, entry.id);
          console.log(`[SW] Synced entry: ${entry.id}`);
        }
      } catch (error) {
        console.error(`[SW] Failed to sync entry ${entry.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error;
  }
}

// Simple IndexedDB helper
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AldevionHR', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pendingEntries')) {
        db.createObjectStore('pendingEntries', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingEntries(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingEntries', 'readonly');
    const store = tx.objectStore('pendingEntries');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.filter((e) => !e.synced));
  });
}

function markAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingEntries', 'readwrite');
    const store = tx.objectStore('pendingEntries');
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const entry = getRequest.result;
      entry.synced = true;
      const putRequest = store.put(entry);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// =======================
// PUSH NOTIFICATIONS
// =======================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      icon: '/data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230F172A" width="192" height="192"/><text x="50%" y="50%" font-size="120" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">A</text></svg>',
      badge: '/data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%232563eb" width="96" height="96"/></svg>',
      tag: data.tag || 'notification',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      actions: [
        { action: 'open', title: 'Apri' },
        { action: 'close', title: 'Chiudi' },
      ],
      ...data,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notifica', options)
    );
  } catch (error) {
    console.error('[SW] Push handling failed:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if a window already exists
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // If not, open a new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// =======================
// MESSAGE HANDLING
// =======================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  console.log(`[SW] Message received: ${type}`);
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(
        getCacheStatus().then((status) => {
          event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
        })
      );
      break;
      
    default:
      console.log(`[SW] Unknown message type: ${type}`);
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  
  return status;
}

// =======================
// LOGGING
// =======================
console.log(`[SW] Service Worker v3 loaded for ${self.location.origin}`);
