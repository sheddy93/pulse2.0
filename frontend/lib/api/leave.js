/**
 * Leave API Module
 * ================
 * Endpoints per gestione ferie e permessi.
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 */

import api from '../api';

export const leaveApi = {
  // Leave operations - no /api prefix since BASE_URL includes it
  types: () => api.get('/leave/types/'),
  balances: () => api.get('/leave/balances/'),
  requests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/leave/requests/${query ? '?' + query : ''}`);
  },
  create: (data) => api.post('/leave/requests/', data),
  approve: (id, data) => api.post(`/leave/requests/${id}/approve/`, data),
  reject: (id, data) => api.post(`/leave/requests/${id}/reject/`, data),
  calendar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/leave/calendar/${query ? '?' + query : ''}`);
  },
};