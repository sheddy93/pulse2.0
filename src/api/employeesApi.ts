/**
 * src/api/employeesApi.ts
 * =======================
 * Employees API module - CRUD operations
 */

import { apiClient } from './client';

const ENTITY = 'Employee';

export const employeesApi = {
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

  import: (file: File) =>
    apiClient.uploadFile(file).then(({ data }: any) => ({
      data: data,
      status: 200,
    })),

  export: (format: 'csv' | 'excel' = 'csv') =>
    apiClient.invoke('exportEmployees', { format }),
};

export default employeesApi;