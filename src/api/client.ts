/**
 * src/api/client.ts
 * =================
 * API client unificato che supporta sia Base44 che REST
 * Commuta tra adapter basato su VITE_API_MODE
 */

import base44Adapter from './adapters/base44Adapter';
import restAdapter from './adapters/restAdapter';

const apiMode = import.meta.env.VITE_API_MODE || 'base44';

export const apiClient = apiMode === 'base44' ? base44Adapter : restAdapter;
export const API_MODE = apiMode;

export default apiClient;