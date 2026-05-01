/**
 * src/services/leaveService.js
 * ============================
 * Business logic per leave management
 */

import { leaveApi } from '@/api/leaveApi';

export const leaveService = {
  async getRequests(query) {
    const result = await leaveApi.getRequests(query);
    return result.status === 200 ? result.data : [];
  },

  async createRequest(data) {
    return leaveApi.createRequest(data);
  },

  async updateRequest(id, data) {
    return leaveApi.updateRequest(id, data);
  },

  async deleteRequest(id) {
    return leaveApi.deleteRequest(id);
  },

  async approveRequest(id, notes = '') {
    return leaveApi.approveRequest(id, notes);
  },

  async rejectRequest(id, reason) {
    return leaveApi.rejectRequest(id, reason);
  },

  async getBalance(employeeId, year) {
    return leaveApi.getBalance(employeeId, year);
  },

  async getLeaveBalance(employeeId, year) {
    const result = await leaveApi.getBalance(employeeId, year);
    return result.status === 200 ? result.data : null;
  },

  async getCalendar(companyId, month) {
    return leaveApi.getCalendar(companyId, month);
  },
};