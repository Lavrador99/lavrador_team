import { api } from './axios';
import { UserDto } from '@libs/types';

export const authApi = {
  getMe: async (): Promise<UserDto> => {
    const { data } = await api.get('/users/me');
    return data;
  },

  login: async (creds: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', creds);
    return data as { accessToken: string };
  },

  register: async (body: { email: string; password: string; name: string }) => {
    const { data } = await api.post('/auth/register', body);
    return data as { accessToken: string };
  },

  refresh: async () => {
    const { data } = await api.post('/auth/refresh');
    return data as { accessToken: string };
  },

  logout: async () => {
    await api.post('/auth/logout');
  },
};
