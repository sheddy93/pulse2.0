import { restClient } from './restClient';

export const leaveService = {
  async listRequests(companyId: string) {
    const { data } = await restClient.get('/leave/requests', { params: { company_id: companyId } });
    return data;
  },

  async getRequest(id: string) {
    const { data } = await restClient.get(`/leave/requests/${id}`);
    return data;
  },

  async createRequest(payload: any) {
    const { data } = await restClient.post('/leave/requests', payload);
    return data;
  },

  async updateRequest(id: string, payload: any) {
    const { data } = await restClient.patch(`/leave/requests/${id}`, payload);
    return data;
  },

  async deleteRequest(id: string) {
    const { data } = await restClient.delete(`/leave/requests/${id}`);
    return data;
  },

  async getBalance(employeeId: string) {
    const { data } = await restClient.get(`/leave/balance/${employeeId}`);
    return data;
  },

  async updateBalance(employeeId: string, payload: any) {
    const { data } = await restClient.patch(`/leave/balance/${employeeId}`, payload);
    return data;
  },
};