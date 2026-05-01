/**
 * src/services/companyService.js
 * ===============================
 * Company management service
 */

import { apiClient } from '@/api/client';

export const companyService = {
  async listCompanies(query = {}) {
    const result = await apiClient.listCompanies(query);
    return result.data || result || [];
  },

  async getCompany(id) {
    const result = await apiClient.getCompany(id);
    return result.data || result || null;
  },

  async createCompany(data) {
    return apiClient.createCompany(data);
  },

  async updateCompany(id, data) {
    return apiClient.updateCompany(id, data);
  },

  async getSettings(id) {
    return apiClient.getPath(`/companies/${id}/settings`);
  },

  async updateSettings(id, settings) {
    return apiClient.patchPath(`/companies/${id}/settings`, settings);
  },
};