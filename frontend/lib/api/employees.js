/**
 * Employees API Module
 * ===================
 * Endpoints per gestione dipendenti.
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 */

import api from '../api';

export const employeesApi = {
  // Employee operations - no /api prefix since BASE_URL includes it
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/employees/${query ? '?' + query : ''}`);
  },
  get: (id) => api.get(`/employees/${id}/`),
  create: (data) => api.post('/employees/', data),
  update: (id, data) => api.put(`/employees/${id}/`, data),
  delete: (id) => api.delete(`/employees/${id}/`),
};