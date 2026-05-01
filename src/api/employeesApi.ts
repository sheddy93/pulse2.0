/**
 * src/api/employeesApi.ts
 * =======================
 * API Employees - usa adapter
 * 
 * TODO MIGRATION: Endpoint futuri
 * GET /api/employees
 * POST /api/employees
 * GET /api/employees/:id
 * PATCH /api/employees/:id
 * DELETE /api/employees/:id
 * POST /api/employees/import-csv
 * GET /api/employees/export
 */

import { apiClient } from './client';

export const employeesApi = {
  async list(filters?: any) {
    const result = await apiClient.get('/entities/EmployeeProfile', { params: filters });
    return result.data || [];
  },

  async get(id: string) {
    const result = await apiClient.get(`/entities/EmployeeProfile/${id}`);
    return result.data?.[0] || null;
  },

  async create(data: any) {
    const result = await apiClient.post('/entities/EmployeeProfile', data);
    return result.data;
  },

  async update(id: string, data: any) {
    const result = await apiClient.patch(`/entities/EmployeeProfile/${id}`, data);
    return result.data;
  },

  async delete(id: string) {
    return apiClient.delete(`/entities/EmployeeProfile/${id}`);
  },

  async importCsv(file: File) {
    // TODO MIGRATION: Sarà endpoint POST /api/employees/import-csv
    const result = await apiClient.uploadFile(file, 'employees-import');
    return result.data;
  },
};