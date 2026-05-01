import apiClient from './api';

export const attendanceService = {
  clockIn: (data: any) => apiClient.post('/attendance/clock-in', data),
  clockOut: (data: any) => apiClient.post('/attendance/clock-out', data),
  getTodayAttendance: (employeeId: string) => apiClient.get(`/attendance/today/${employeeId}`),
  getEmployeeAttendance: (employeeId: string, daysBack = 30) =>
    apiClient.get(`/attendance/employee/${employeeId}`, { params: { daysBack } }),
  getCompanyAttendance: (date: string) => apiClient.get(`/attendance/company/date/${date}`),
};