/**
 * Firebase Cloud Messaging Integration
 * Gestisce notifiche push con fallback offline
 */
import { base44 } from '@/api/base44Client';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'pulseh-notifications.firebaseapp.com',
  projectId: 'pulseh-notifications',
  storageBucket: 'pulseh-notifications.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messaging = null;
let registration = null;

/**
 * Inizializza Firebase Cloud Messaging
 */
export async function initializeFirebaseMessaging() {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return null;
    }

    // Registra service worker
    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('Firebase SW registered:', registration);

    // Richiedi permesso notifiche
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    }

    return registration;
  } catch (error) {
    console.error('Firebase messaging init error:', error);
    return null;
  }
}

/**
 * Registra device token
 */
export async function registerDeviceToken(userEmail) {
  try {
    if (!registration || !navigator.serviceWorker.controller) {
      console.log('Service Worker not ready');
      return null;
    }

    // Genera token via service worker
    const swReg = await navigator.serviceWorker.ready;
    const subscription = await swReg.pushManager.getSubscription();

    if (!subscription) {
      console.log('Push subscription not available');
      return null;
    }

    // Invia token al backend
    const endpoint = subscription.endpoint;
    const p256dh = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh'))));
    const auth = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))));

    await base44.functions.invoke('registerPushSubscription', {
      userEmail,
      endpoint,
      p256dh,
      auth
    });

    console.log('Device token registered');
    return subscription;
  } catch (error) {
    console.error('Device token registration error:', error);
    return null;
  }
}

/**
 * Ascolta messaggi in foreground
 */
export function setupForegroundNotificationHandler(callback) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'notification') {
        callback(event.data.notification);
      }
    });
  }
}

/**
 * Mostra notifica locale
 */
export function showLocalNotification(title, options = {}) {
  if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        icon: '/logo.png',
        badge: '/badge.png',
        ...options
      });
    });
  }
}

/**
 * Sottoscrivi a topic
 */
export async function subscribeToTopic(topic) {
  try {
    const swReg = await navigator.serviceWorker.ready;
    const subscription = await swReg.pushManager.getSubscription();

    if (!subscription) return false;

    await base44.functions.invoke('subscribeToTopic', {
      topic,
      endpoint: subscription.endpoint
    });

    return true;
  } catch (error) {
    console.error('Topic subscription error:', error);
    return false;
  }
}

/**
 * Controlla online/offline e sincronizza
 */
export async function setupOfflineSyncHandler() {
  window.addEventListener('online', async () => {
    console.log('Device online - syncing notifications');
    try {
      await base44.functions.invoke('syncOfflineNotifications', {});
    } catch (error) {
      console.error('Sync error:', error);
    }
  });
}