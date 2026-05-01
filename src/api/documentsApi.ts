/**
 * src/api/documentsApi.ts
 * =======================
 * API Documents
 * 
 * TODO MIGRATION: Endpoint futuri
 * GET /api/documents
 * POST /api/documents
 * PATCH /api/documents/:id
 * POST /api/documents/request-upload-url
 * GET /api/documents/:id/download-url
 */

import { apiClient } from './client';

export const documentsApi = {
  async list(filters?: any) {
    const result = await apiClient.get('/entities/Document', { params: filters });
    return result.data || [];
  },

  async get(id: string) {
    const result = await apiClient.get(`/entities/Document/${id}`);
    return result.data?.[0] || null;
  },

  async create(data: any) {
    const result = await apiClient.post('/entities/Document', data);
    return result.data;
  },

  async update(id: string, data: any) {
    // TODO MIGRATION: PATCH /api/documents/:id
    const result = await apiClient.patch(`/entities/Document/${id}`, data);
    return result.data;
  },

  async delete(id: string) {
    // TODO MIGRATION: DELETE /api/documents/:id
    return apiClient.delete(`/entities/Document/${id}`);
  },

  async uploadFile(file: File) {
    // TODO MIGRATION: POST /api/documents/request-upload-url → signed URL, then upload to R2/S3
    const result = await apiClient.uploadFile(file);
    return result.data;
  },

  async getDownloadUrl(id: string) {
    // TODO MIGRATION: GET /api/documents/:id/download-url
    const doc = await this.get(id);
    return doc?.file_url || null;
  },

  async archive(id: string) {
    // TODO MIGRATION: PATCH /api/documents/:id/archive
    return this.update(id, { is_archived: true });
  },
};