/**
 * src/api/companiesApi.ts
 * =======================
 * API Companies - usa adapter per Base44/REST
 * 
 * TODO MIGRATION: Endpoint futuri
 * GET /api/companies
 * POST /api/companies
 * GET /api/companies/:id
 * PATCH /api/companies/:id
 * DELETE /api/companies/:id
 */

import { apiClient } from './client';

export const companiesApi = {
  async list(filters?: any) {
    const result = await apiClient.get('/entities/Company', { params: filters });
    return result.data || [];
  },

  async get(id: string) {
    const result = await apiClient.get(`/entities/Company/${id}`);
    return result.data?.[0] || null;
  },

  async create(data: any) {
    const result = await apiClient.post('/entities/Company', data);
    return result.data;
  },

  async update(id: string, data: any) {
    const result = await apiClient.patch(`/entities/Company/${id}`, data);
    return result.data;
  },

  async delete(id: string) {
    return apiClient.delete(`/entities/Company/${id}`);
  },
};