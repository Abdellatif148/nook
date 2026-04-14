import { api } from './client';

export const sessionsApi = {
  start: (session: any) => api.post('/sessions/start', session),
  end: (id: string, data: any) => api.post(`/sessions/${id}/end`, data),
  addExtras: (id: string, extras: any) => api.post(`/sessions/${id}/extras`, extras),
};
