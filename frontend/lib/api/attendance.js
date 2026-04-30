/**
 * Attendance API Module
 * ====================
 * Endpoints per gestione presenze (check-in/check-out).
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 */

import api from '../api';

export const attendanceApi = {
  // Time tracking - no /api prefix since BASE_URL includes it
  checkIn: (data = {}) => api.post('/time/check-in/', data),
  checkOut: (data = {}) => api.post('/time/check-out/', data),
  today: () => api.get('/time/today/'),
  history: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/time/history/${query ? '?' + query : ''}`);
  },
  overview: () => api.get('/time/company/overview/'),
};