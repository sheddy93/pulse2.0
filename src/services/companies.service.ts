import { restClient } from './restClient';

export const companiesService = {
  async list() {
    const { data } = await restClient.get('/companies');
    return data;
  },

  async get(id: string) {
    const { data } = await restClient.get(`/companies/${id}`);
    return data;
  },

  async create(payload: any) {
    const { data } = await restClient.post('/companies', payload);
    return data;
  },

  async update(id: string, payload: any) {
    const { data } = await restClient.patch(`/companies/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await restClient.delete(`/companies/${id}`);
    return data;
  },

  async getByOwner(ownerId: string) {
    const { data } = await restClient.get(`/companies/owner/${ownerId}`);
    return data;
  },
};