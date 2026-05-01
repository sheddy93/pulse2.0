/**
 * Firebase Messaging Service Worker
 * ────────────────────────────────
 * Handles push notifications in background.
 * ✅ Receives FCM messages
 * ✅ Shows notifications
 * ✅ Handles notification clicks
 */

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js');

// Initialize Firebase (TODO: Use real config from env)
firebase.initializeApp({
  projectId: 'pulseh-notifications',
  messagingSenderId: '...',
});

const messaging = firebase.messaging();

/**
 * Handle background message
 */
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-192.png',
    badge: '/badge-72.png',
    data: payload.data,
    tag: payload.data.action_type, // Group similar notifications
    requireInteraction: payload.data.priority === 'high', // Keep notification until user interacts
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);

  const actionUrl = event.notification.data.action_url || '/';

  event.notification.close();

  // Open app and navigate to action URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === actionUrl && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});

/**
 * Handle notification close
 */
self.addEventListener('notificationclose', (event) => {
  console.log('Notification dismissed:', event.notification);
  // TODO: Track dismissal for analytics
});
