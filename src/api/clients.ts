import { api } from './client';

export const clientsApi = {
  create: (client: any) => api.post('/clients', client),
  updateBalance: (id: string, data: any) => api.patch(`/clients/${id}/balance`, data),
};
