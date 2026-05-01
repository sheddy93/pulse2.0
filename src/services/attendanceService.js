/**
 * src/services/attendanceService.js
 * =================================
 * Business logic per attendance tracking
 */

import { attendanceApi } from '@/api/attendanceApi';

export const attendanceService = {
  async checkIn(latitude, longitude) {
    return attendanceApi.checkIn({
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  },

  async checkOut(latitude, longitude) {
    return attendanceApi.checkOut({
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  },

  async breakStart() {
    return attendanceApi.breakStart({
      timestamp: new Date().toISOString(),
    });
  },

  async breakEnd() {
    return attendanceApi.breakEnd({
      timestamp: new Date().toISOString(),
    });
  },

  async getDailyEntries(employeeId, date) {
    const result = await attendanceApi.getEntries({
      employee_id: employeeId,
      date,
    });
    return result.status === 200 ? result.data : [];
  },

  async getTodayEntries(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    return this.getDailyEntries(employeeId, today);
  },

  async getSummary(employeeId, date) {
    return attendanceApi.getSummary(employeeId, date);
  },

  async approveDayReview(id, notes) {
    return attendanceApi.approveDayReview(id, notes);
  },

  async rejectDayReview(id, reason) {
    return attendanceApi.rejectDayReview(id, reason);
  },
};