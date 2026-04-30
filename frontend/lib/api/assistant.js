/**
 * Assistant API Module
 * ===================
 * Endpoints per Assistente Operativo e suggerimenti operativi.
 * 
 * NOTE: NEXT_PUBLIC_API_BASE_URL contains /api
 * So paths here should NOT start with /api/
 * 
 * Endpoints:
 * - chat: POST /assistant/chat/
 * - suggestions: GET /assistant/suggestions/
 * - contextAnalysis: POST /assistant/context/
 */

import api from '../api';

export const assistantApi = {
  // Assistant operations - no /api prefix since BASE_URL includes it
  chat: (message, context = {}) => api.post('/assistant/chat/', { message, context }),
  suggestions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/assistant/suggestions/${query ? '?' + query : ''}`);
  },
  contextAnalysis: (data) => api.post('/assistant/context/', data),
};