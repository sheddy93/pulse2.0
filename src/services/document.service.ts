import apiClient from './api';

export const documentService = {
  create: (data: any) => apiClient.post('/documents', data),
  getByCompany: () => apiClient.get('/documents/company'),
  getByEmployee: (employeeId: string) => apiClient.get(`/documents/employee/${employeeId}`),
  getExpiring: () => apiClient.get('/documents/expiring'),
  sign: (id: string, signatureUrl: string) => apiClient.put(`/documents/${id}/sign`, { signatureUrl }),
  updateStatus: (id: string, status: string) => apiClient.put(`/documents/${id}/status`, { status }),
};