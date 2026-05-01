import { useEffect } from 'react';
import { // TODO: Service integration } from '@/api/// TODO: Service integrationClient';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  showLocalNotification
} from '@/lib/pwa-utils';

export default function NotificationManager({ user }) {
  useEffect(() => {
    const initPWA = async () => {
      // Register service worker
      await registerServiceWorker();

      // Request notification permission
      const hasPermission = await requestNotificationPermission();
      
      if (hasPermission && user) {
        // Subscribe to push notifications
        const subscription = await subscribeToPushNotifications();
        
        if (subscription) {
          // Send subscription to backend
          try {
            await // TODO: Service integration.functions.invoke('registerPushSubscription', {
              subscription: {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
                  auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
                }
              },
              userEmail: user.email
            });
          } catch (error) {
            console.error('Failed to register push subscription:', error);
          }
        }
      }
    };

    initPWA();
  }, [user]);

  // Listen for notification messages from service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'LEAVE_APPROVED') {
          showLocalNotification('Feria Approvata! 🎉', {
            body: `La tua richiesta di ferie dal ${event.data.startDate} al ${event.data.endDate} è stata approvata`,
            tag: 'leave-notification',
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'Visualizza',
                icon: '👁️'
              }
            ]
          });
        }

        if (event.data.type === 'OVERTIME_APPROVED') {
          showLocalNotification('Straordinario Approvato! ✅', {
            body: `La tua richiesta di straordinario del ${event.data.date} (${event.data.hours}h) è stata approvata`,
            tag: 'overtime-notification',
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'Visualizza',
                icon: '⏱️'
              }
            ]
          });
        }

        if (event.data.type === 'LEAVE_REJECTED') {
          showLocalNotification('Feria Rifiutata', {
            body: `La tua richiesta di ferie è stata rifiutata. Motivo: ${event.data.reason}`,
            tag: 'leave-rejection',
            requireInteraction: true
          });
        }

        if (event.data.type === 'OVERTIME_REJECTED') {
          showLocalNotification('Straordinario Rifiutato', {
            body: `La tua richiesta di straordinario è stata rifiutata. Motivo: ${event.data.reason}`,
            tag: 'overtime-rejection',
            requireInteraction: true
          });
        }

        if (event.data.type === 'DOCUMENT_READY') {
          showLocalNotification('Documento Disponibile 📄', {
            body: `Il documento "${event.data.docTitle}" è pronto per il download`,
            tag: 'document-notification',
            data: {
              url: `/dashboard/employee/documents`
            }
          });
        }
      });
    }
  }, []);

  return null;
}