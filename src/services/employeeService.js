/**
 * src/services/employeeService.js
 * ===============================
 * Business logic per employee management
 */

import { employeesApi } from '@/api/employeesApi';

export const employeeService = {
  async listEmployees(companyId, query) {
    const result = await employeesApi.list({
      company_id: companyId,
      ...query,
    });
    return result.status === 200 ? result.data : [];
  },

  async getEmployee(id) {
    const result = await employeesApi.get(id);
    return result.status === 200 ? result.data : null;
  },

  async createEmployee(data) {
    return employeesApi.create(data);
  },

  async updateEmployee(id, data) {
    return employeesApi.update(id, data);
  },

  async deleteEmployee(id) {
    return employeesApi.delete(id);
  },

  async importEmployees(file) {
    return employeesApi.import(file);
  },

  async exportEmployees(format = 'csv') {
    return employeesApi.export(format);
  },
};