/**
 * src/services/employeeService.js
 * ===============================
 * Business logic per employee management - REST-based
 */

import { apiClient } from '@/api/client';

export const employeeService = {
  async listEmployees(companyId, query = {}) {
    return apiClient.listEmployees(companyId, query);
  },

  async getEmployee(id) {
    return apiClient.getEmployee(id);
  },

  async createEmployee(data) {
    return apiClient.createEmployee(data);
  },

  async updateEmployee(id, data) {
    return apiClient.updateEmployee(id, data);
  },

  async deleteEmployee(id) {
    return apiClient.deleteEmployee(id);
  },

  async createNewEmployee(companyId, data) {
    return this.createEmployee({
      company_id: companyId,
      ...data,
    });
  },

  async fetchDepartments(companyId) {
    return [];
  },
};

// Legacy function aliases for backward compatibility
export const fetchEmployee = (id) => employeeService.getEmployee(id);
export const updateEmployeeData = (id, data) => employeeService.updateEmployee(id, data);
export const deleteEmployeeData = (id) => employeeService.deleteEmployee(id);