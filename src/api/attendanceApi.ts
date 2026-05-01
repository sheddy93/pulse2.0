/**
 * src/api/attendanceApi.ts
 * ========================
 * API Attendance
 * 
 * TODO MIGRATION: Endpoint futuri
 * POST /api/attendance/check-in
 * POST /api/attendance/check-out
 * GET /api/attendance/entries
 * GET /api/attendance/today
 * GET /api/attendance/summary
 * PATCH /api/attendance/day-reviews/:id/approve
 */

import { apiClient } from './client';

export const attendanceApi = {
  async checkIn(data: any) {
    // TODO MIGRATION: POST /api/attendance/check-in
    const result = await apiClient.post('/entities/TimeEntry', data);
    return result.data;
  },

  async checkOut(data: any) {
    // TODO MIGRATION: POST /api/attendance/check-out
    const result = await apiClient.post('/entities/TimeEntry', data);
    return result.data;
  },

  async listEntries(filters?: any) {
    const result = await apiClient.get('/entities/TimeEntry', { params: filters });
    return result.data || [];
  },

  async getTodayEntries(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.listEntries({
      employee_id: employeeId,
      entry_date: today,
    });
  },

  async listDayReviews(filters?: any) {
    const result = await apiClient.get('/entities/AttendanceDayReview', { params: filters });
    return result.data || [];
  },

  async approveDayReview(id: string) {
    // TODO MIGRATION: PATCH /api/attendance/day-reviews/:id/approve
    const result = await apiClient.patch(`/entities/AttendanceDayReview/${id}`, {
      status: 'approved',
    });
    return result.data;
  },

  async rejectDayReview(id: string, reason?: string) {
    // TODO MIGRATION: PATCH /api/attendance/day-reviews/:id/reject
    const result = await apiClient.patch(`/entities/AttendanceDayReview/${id}`, {
      status: 'rejected',
      rejection_reason: reason,
    });
    return result.data;
  },
};