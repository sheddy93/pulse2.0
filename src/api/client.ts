/**
 * src/api/client.ts
 * =================
 * API client REST per tutte le chiamate backend
 */

import restAdapter from './adapters/restAdapter';

export const apiClient = restAdapter;
export const API_MODE = 'rest';

export default apiClient;