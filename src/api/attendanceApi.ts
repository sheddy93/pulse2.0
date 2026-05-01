/**
 * src/api/attendanceApi.ts
 * ========================
 * Attendance API module - check-in, check-out, reviews
 */

import { apiClient } from './client';

const ENTITY = 'AttendanceEntry';

export const attendanceApi = {
  checkIn: (data: any) =>
    apiClient.invoke('checkIn', data),

  checkOut: (data: any) =>
    apiClient.invoke('checkOut', data),

  breakStart: (data: any) =>
    apiClient.invoke('breakStart', data),

  breakEnd: (data: any) =>
    apiClient.invoke('breakEnd', data),

  getEntries: (query?: any) =>
    apiClient.list(ENTITY, query),

  getSummary: (employeeId: string, date: string) =>
    apiClient.invoke('getAttendanceSummary', { employeeId, date }),

  getDayReviews: (query?: any) =>
    apiClient.list('AttendanceDayReview', query),

  approveDayReview: (id: string, notes: string) =>
    apiClient.invoke('approveDayReview', { id, notes }),

  rejectDayReview: (id: string, reason: string) =>
    apiClient.invoke('rejectDayReview', { id, reason }),
};

export default attendanceApi;