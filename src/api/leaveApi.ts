/**
 * src/api/leaveApi.ts
 * ===================
 * Leave API module - requests, balances, approvals
 */

import { apiClient } from './client';

export const leaveApi = {
  getRequests: (query?: any) =>
    apiClient.list('LeaveRequest', query),

  createRequest: (data: any) =>
    apiClient.post('LeaveRequest', data),

  updateRequest: (id: string, data: any) =>
    apiClient.patch('LeaveRequest', id, data),

  deleteRequest: (id: string) =>
    apiClient.delete('LeaveRequest', id),

  approveRequest: (id: string, notes: string) =>
    apiClient.invoke('approveLeaveRequest', { id, notes }),

  rejectRequest: (id: string, reason: string) =>
    apiClient.invoke('rejectLeaveRequest', { id, reason }),

  getBalance: (employeeId: string, year?: number) =>
    apiClient.invoke('getLeaveBalance', { employeeId, year }),

  getCalendar: (companyId: string, month: string) =>
    apiClient.invoke('getLeaveCalendar', { companyId, month }),
};

export default leaveApi;