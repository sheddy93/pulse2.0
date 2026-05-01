import { useEffect } from 'react';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  showLocalNotification
} from '@/lib/pwa-utils';

export default function NotificationManager({ user }) {
  useEffect(() => {
    const initPWA = async () => {
      await registerServiceWorker();
      const hasPermission = await requestNotificationPermission();
      
      if (hasPermission && user) {
        const subscription = await subscribeToPushNotifications();
        
        if (subscription) {
          try {
            // TODO: Replace with service call
            console.log('Push subscription registered:', subscription);
          } catch (error) {
            console.error('Failed to register push subscription:', error);
          }
        }
      }
    };

    initPWA();
  }, [user]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'LEAVE_APPROVED') {
          showLocalNotification('Feria Approvata! 🎉', {
            body: `La tua richiesta di ferie dal ${event.data.startDate} al ${event.data.endDate} è stata approvata`,
            tag: 'leave-notification',
            requireInteraction: true
          });
        }
        if (event.data.type === 'OVERTIME_APPROVED') {
          showLocalNotification('Straordinario Approvato! ✅', {
            body: `La tua richiesta di straordinario del ${event.data.date} è stata approvata`,
            tag: 'overtime-notification',
            requireInteraction: true
          });
        }
      });
    }
  }, []);

  return null;
}