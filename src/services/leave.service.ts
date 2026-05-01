import apiClient from './api';

export const leaveService = {
  createRequest: (data: any) => apiClient.post('/leave/request', data),
  getEmployeeRequests: (employeeId: string) => apiClient.get(`/leave/employee/${employeeId}`),
  getPendingRequests: () => apiClient.get('/leave/pending'),
  approveRequest: (id: string) => apiClient.put(`/leave/${id}/approve`, {}),
  rejectRequest: (id: string, rejectedReason: string) =>
    apiClient.put(`/leave/${id}/reject`, { rejectedReason }),
  getLeaveBalance: (employeeId: string) => apiClient.get(`/leave/balance/${employeeId}`),
};