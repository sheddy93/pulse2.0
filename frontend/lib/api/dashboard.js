/**
 * Dashboard API Module
 * ===================
 * Endpoints per dashboard summary per ogni ruolo.
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 */

import api from '../api';

export const dashboardApi = {
  // Dashboard summaries - no /api prefix since BASE_URL includes it
  company: () => api.get('/dashboard/company/summary/'),
  consultant: () => api.get('/dashboard/consultant/summary/'),
  employee: () => api.get('/dashboard/employee/summary/'),
  admin: () => api.get('/dashboard/admin/summary/'),
};