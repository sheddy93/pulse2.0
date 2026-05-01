import { restClient } from './restClient';

export const documentsService = {
  async list(companyId: string) {
    const { data } = await restClient.get('/documents', { params: { company_id: companyId } });
    return data;
  },

  async get(id: string) {
    const { data } = await restClient.get(`/documents/${id}`);
    return data;
  },

  async create(payload: any) {
    const { data } = await restClient.post('/documents', payload);
    return data;
  },

  async update(id: string, payload: any) {
    const { data } = await restClient.patch(`/documents/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await restClient.delete(`/documents/${id}`);
    return data;
  },

  async getByEmployee(employeeId: string) {
    const { data } = await restClient.get(`/documents/employee/${employeeId}`);
    return data;
  },
};