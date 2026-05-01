/**
 * src/api/client.ts
 * =================
 * Client API universale che supporta Base44 e REST
 * 
 * Usa VITE_API_MODE per switchare tra adapter
 * - base44: usa Base44 SDK (current)
 * - rest: userà NestJS REST API (future)
 * 
 * TODO MIGRATION: In produzione, migrare a rest mode
 */

import { base44Adapter } from './adapters/base44Adapter';
import { restAdapter } from './adapters/restAdapter';

const API_MODE = (import.meta.env.VITE_API_MODE || 'base44') as 'base44' | 'rest';

// Seleziona adapter
const adapter = API_MODE === 'rest' ? restAdapter : base44Adapter;

export const apiClient = {
  get: adapter.get,
  post: adapter.post,
  patch: adapter.patch,
  delete: adapter.delete,
  put: adapter.put,
  uploadFile: adapter.uploadFile,
  getMode: () => API_MODE,
};

export default apiClient;