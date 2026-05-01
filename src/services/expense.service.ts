import apiClient from './api';

export const expenseService = {
  create: (data: any) => apiClient.post('/expenses', data),
  getEmployeeExpenses: (employeeId: string) => apiClient.get(`/expenses/employee/${employeeId}`),
  getPendingByStatus: (status: string) => apiClient.get(`/expenses/pending/${status}`),
  approve: (id: string, notes?: string) => apiClient.put(`/expenses/${id}/approve`, { notes }),
  reject: (id: string, notes: string) => apiClient.put(`/expenses/${id}/reject`, { notes }),
  markAsPaid: (id: string) => apiClient.put(`/expenses/${id}/pay`, {}),
  getCompanyTotal: (month: string) => apiClient.get('/expenses/company/total', { params: { month } }),
};