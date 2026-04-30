/**
 * Notifications API Module
 * ========================
 * Endpoints per gestione notifiche utente.
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 */

import api from '../api';

export const notificationsApi = {
  // Notification operations - no /api prefix since BASE_URL includes it
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/notifications/${query ? '?' + query : ''}`);
  },
  unreadCount: () => api.get('/notifications/unread-count/'),
  markRead: (id) => api.post(`/notifications/${id}/mark-read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
};