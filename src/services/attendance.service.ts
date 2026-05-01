import { restClient } from './restClient';

export const attendanceService = {
  async checkIn(payload: any) {
    const { data } = await restClient.post('/attendance/check-in', payload);
    return data;
  },

  async checkOut(payload: any) {
    const { data } = await restClient.post('/attendance/check-out', payload);
    return data;
  },

  async listEntries(companyId: string) {
    const { data } = await restClient.get('/attendance/entries', { params: { company_id: companyId } });
    return data;
  },

  async getByEmployee(employeeId: string) {
    const { data } = await restClient.get(`/attendance/employee/${employeeId}`);
    return data;
  },

  async getByDate(companyId: string, date: string) {
    const { data } = await restClient.get('/attendance/date', { params: { company_id: companyId, date } });
    return data;
  },

  async deleteEntry(id: string) {
    const { data } = await restClient.delete(`/attendance/${id}`);
    return data;
  },
};