/**
 * Documents API Module
 * ===================
 * Endpoints per gestione documenti aziendali.
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 */

import api from '../api';

export const documentsApi = {
  // Document operations - no /api prefix since BASE_URL includes it
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/documents/${query ? '?' + query : ''}`);
  },
  upload: (formData) => api.formData('/documents/', formData),
  download: (id) => api.get(`/documents/${id}/download/`),
  acknowledge: (id) => api.post(`/documents/${id}/acknowledge/`),
};