'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';

/**
 * Hook per gestione notifiche
 * @returns {Object} { notifications, loading, error, unreadCount, markAsRead, markAllAsRead, refetch }
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Recupera la lista delle notifiche
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/notifications/');
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Segna una singola notifica come letta
   * @param {number} id - ID della notifica
   */
  const markAsRead = useCallback(async (id) => {
    try {
      await apiRequest(`/notifications/${id}/mark-read/`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  /**
   * Segna tutte le notifiche come lette
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await apiRequest('/notifications/mark-all-read/', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  /**
   * Elimina una notifica
   * @param {number} id - ID della notifica
   */
  const deleteNotification = useCallback(async (id) => {
    try {
      await apiRequest(`/notifications/${id}/`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  /**
   * Elimina tutte le notifiche
   */
  const clearAllNotifications = useCallback(async () => {
    try {
      await apiRequest('/notifications/clear-all/', { method: 'POST' });
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  }, []);

  // Calcola il conteggio delle notifiche non lette
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refetch: fetchNotifications,
  };
}

/**
 * Hook semplificato per solo conteggio non lette
 * @returns {Object} { unreadCount, loading, error, refetch }
 */
export function useUnreadCount() {
  const { unreadCount, loading, error, refetch } = useNotifications();
  return { unreadCount, loading, error, refetch };
}

/**
 * Hook per una singola notifica
 * @param {number} id - ID della notifica
 * @returns {Object} { notification, loading, error }
 */
export function useNotification(id) {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNotification() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest(`/notifications/${id}/`);
        setNotification(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNotification();
  }, [id]);

  return { notification, loading, error };
}

export default useNotifications;
