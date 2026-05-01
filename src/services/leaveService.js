/**
 * src/services/leaveService.js
 * =============================
 * Leave request management
 */

import { apiClient } from '@/api/client';

export const leaveService = {
  async listRequests(companyId, query = {}) {
    const result = await apiClient.getLeaveRequests(companyId, query);
    return result.data || result || [];
  },

  async createRequest(data) {
    return apiClient.createLeaveRequest(data);
  },

  async approveRequest(id, notes = '') {
    return apiClient.approveLeaveRequest(id, notes);
  },

  async rejectRequest(id, reason = '') {
    return apiClient.rejectLeaveRequest(id, reason);
  },

  async getBalance(employeeId, year = null) {
    const y = year || new Date().getFullYear();
    const result = await apiClient.getLeaveBalance(employeeId);
    return result.data || result || {};
  },

  async getCalendar(companyId, month) {
    return apiClient.getPath(`/leave/calendar?company_id=${companyId}&month=${month}`);
  },
};