/**
 * src/api/leaveApi.ts
 * ===================
 * API Leave Requests
 * 
 * TODO MIGRATION: Endpoint futuri
 * GET /api/leave/requests
 * POST /api/leave/requests
 * PATCH /api/leave/requests/:id/approve
 * PATCH /api/leave/requests/:id/reject
 * GET /api/leave/balances
 */

import { apiClient } from './client';

export const leaveApi = {
  async listRequests(filters?: any) {
    const result = await apiClient.get('/entities/LeaveRequest', { params: filters });
    return result.data || [];
  },

  async createRequest(data: any) {
    const result = await apiClient.post('/entities/LeaveRequest', data);
    return result.data;
  },

  async approveRequest(id: string) {
    // TODO MIGRATION: PATCH /api/leave/requests/:id/approve
    const result = await apiClient.patch(`/entities/LeaveRequest/${id}`, {
      status: 'approved',
    });
    return result.data;
  },

  async rejectRequest(id: string, reason?: string) {
    // TODO MIGRATION: PATCH /api/leave/requests/:id/reject
    const result = await apiClient.patch(`/entities/LeaveRequest/${id}`, {
      status: 'rejected',
      rejection_reason: reason,
    });
    return result.data;
  },

  async getBalance(employeeId: string) {
    // TODO MIGRATION: GET /api/leave/balances/:employeeId
    const result = await apiClient.get('/entities/LeaveBalance', {
      params: { employee_id: employeeId },
    });
    return result.data?.[0] || null;
  },

  async updateBalance(id: string, data: any) {
    // TODO MIGRATION: PATCH /api/leave/balances/:id
    const result = await apiClient.patch(`/entities/LeaveBalance/${id}`, data);
    return result.data;
  },
};