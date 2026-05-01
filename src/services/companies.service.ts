import apiClient from './api';

export const companiesService = {
  create: (data: any) => apiClient.post('/companies', data),
  getAll: (skip = 0, take = 50) => apiClient.get('/companies', { params: { skip, take } }),
  getById: (id: string) => apiClient.get(`/companies/${id}`),
  update: (id: string, data: any) => apiClient.put(`/companies/${id}`, data),
  delete: (id: string) => apiClient.delete(`/companies/${id}`),
};