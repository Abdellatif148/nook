import { api } from './client';

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  updateProfile: (data: any) => api.patch('/profile', data),
};
