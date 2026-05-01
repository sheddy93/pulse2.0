import { restClient } from './restClient';

export const employeesService = {
  async list(companyId: string) {
    const { data } = await restClient.get('/employees', { params: { company_id: companyId } });
    return data;
  },

  async get(id: string) {
    const { data } = await restClient.get(`/employees/${id}`);
    return data;
  },

  async create(payload: any) {
    const { data } = await restClient.post('/employees', payload);
    return data;
  },

  async update(id: string, payload: any) {
    const { data } = await restClient.patch(`/employees/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await restClient.delete(`/employees/${id}`);
    return data;
  },

  async filter(companyId: string, filters?: any) {
    const { data } = await restClient.get(`/employees/company/${companyId}`, { params: filters });
    return data;
  },
};