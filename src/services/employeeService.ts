/**
 * src/services/employeeService.ts
 * ===============================
 * Business logic per employee management
 */

import { employeesApi } from '@/api/employeesApi';

export const employeeService = {
  async listEmployees(companyId: string, query?: any) {
    const result = await employeesApi.list({
      company_id: companyId,
      ...query,
    });
    return result.status === 200 ? result.data : [];
  },

  async getEmployee(id: string) {
    const result = await employeesApi.get(id);
    return result.status === 200 ? result.data : null;
  },

  async createEmployee(data: any) {
    return employeesApi.create(data);
  },

  async updateEmployee(id: string, data: any) {
    return employeesApi.update(id, data);
  },

  async deleteEmployee(id: string) {
    return employeesApi.delete(id);
  },

  async importEmployees(file: File) {
    return employeesApi.import(file);
  },

  async exportEmployees(format: 'csv' | 'excel' = 'csv') {
    return employeesApi.export(format);
  },
};