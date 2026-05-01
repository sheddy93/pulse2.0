/**
 * src/services/attendanceService.js
 * ==================================
 * Attendance tracking service
 */

import { apiClient } from '@/api/client';

export const attendanceService = {
  async checkIn(employeeId, data) {
    return apiClient.checkIn(employeeId, data);
  },

  async checkOut(employeeId, data) {
    return apiClient.checkOut(employeeId, data);
  },

  async getTodayEntries(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    const result = await apiClient.getAttendanceEntries(employeeId, today);
    return result.data || result || [];
  },

  async getEntriesForDate(employeeId, date) {
    const result = await apiClient.getAttendanceEntries(employeeId, date);
    return result.data || result || [];
  },

  async getSummary(employeeId, date) {
    const result = await apiClient.getAttendanceSummary(employeeId, date);
    return result.data || result || {};
  },

  async getMonthEntries(employeeId) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
    
    return apiClient.getPath(
      `/attendance/entries?employee_id=${employeeId}&start=${monthStart}&end=${monthEnd}`
    );
  },
};