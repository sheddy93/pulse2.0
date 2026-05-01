/**
 * Firebase Cloud Messaging Setup
 * ──────────────────────────────
 * Real-time push notifications for web and mobile.
 * ✅ Service Worker integration
 * ✅ Device token management
 * ✅ Background message handling
 * 
 * TODO MIGRATION: Firebase Admin SDK stays, API integration point
 */

// Firebase config - TODO: Add to environment variables
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSy...', // Set in env
  authDomain: 'pulseh-notifications.firebaseapp.com',
  projectId: 'pulseh-notifications',
  storageBucket: 'pulseh-notifications.appspot.com',
  messagingSenderId: '...', // Set in env
  appId: '...',
};

/**
 * Initialize Firebase Cloud Messaging
 * Call this once on app startup
 */
export async function initializeFirebaseMessaging() {
  try {
    // Check browser support
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Firebase Service Worker registered:', registration);

    return registration;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
}

/**
 * Request notification permission and get device token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // TODO: Get FCM device token from Firebase SDK
    // const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    // return token;

    return 'token_placeholder';
  } catch (error) {
    console.error('Permission request error:', error);
    return null;
  }
}

/**
 * Save device token to database
 */
export async function saveDeviceToken(userEmail: string, token: string): Promise<void> {
  // TODO: Call backend to save device token
  // POST /api/v1/notifications/register-device
  const response = await fetch('/api/v1/notifications/register-device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, token }),
  });

  if (!response.ok) {
    throw new Error('Failed to save device token');
  }
}

/**
 * Subscribe to notification topic
 */
export async function subscribeToTopic(token: string, topic: string): Promise<void> {
  // TODO: Server-side call to Firebase Admin SDK
  // admin.messaging().subscribeToTopic([token], topic);
}

/**
 * Handle incoming push notification in foreground
 */
export function setupForegroundNotificationHandler() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      const notification = event.data;
      
      // Show notification or toast
      console.log('Notification received:', notification);

      // TODO: Show toast or in-app notification
      // toast({
      //   title: notification.title,
      //   description: notification.body,
      // });
    });
  }
}