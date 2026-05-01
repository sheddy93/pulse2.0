/**
 * src/api/companiesApi.ts
 * =======================
 * Companies API module - CRUD operations
 */

import { apiClient } from './client';

const ENTITY = 'Company';

export const companiesApi = {
  list: (query?: any) =>
    apiClient.list(ENTITY, query),

  get: (id: string) =>
    apiClient.get(ENTITY, id),

  create: (data: any) =>
    apiClient.post(ENTITY, data),

  update: (id: string, data: any) =>
    apiClient.patch(ENTITY, id, data),

  delete: (id: string) =>
    apiClient.delete(ENTITY, id),

  getSettings: (companyId: string) =>
    apiClient.invoke('getCompanySettings', { companyId }),

  updateSettings: (companyId: string, settings: any) =>
    apiClient.invoke('updateCompanySettings', { companyId, settings }),
};

export default companiesApi;