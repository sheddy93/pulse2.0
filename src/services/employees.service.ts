import apiClient from './api';

export const employeesService = {
  create: (data: any) => apiClient.post('/employees', data),
  getAll: (skip = 0, take = 50) => apiClient.get('/employees', { params: { skip, take } }),
  getById: (id: string) => apiClient.get(`/employees/${id}`),
  update: (id: string, data: any) => apiClient.put(`/employees/${id}`, data),
  delete: (id: string) => apiClient.delete(`/employees/${id}`),
  search: (query: string) => apiClient.get('/employees/search', { params: { q: query } }),
};