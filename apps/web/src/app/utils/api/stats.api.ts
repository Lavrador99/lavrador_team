import { api } from './axios';
import { DashboardStats, ClientStats, SessionsDistribution } from '@libs/types';

export const statsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/stats/dashboard');
    return data;
  },

  getClient: async (clientId: string): Promise<ClientStats> => {
    const { data } = await api.get(`/stats/client/${clientId}`);
    return data;
  },

  getSessionsDistribution: async (): Promise<SessionsDistribution> => {
    const { data } = await api.get('/stats/sessions');
    return data;
  },

  getClientsActivity: async () => {
    const { data } = await api.get('/stats/clients/activity');
    return data;
  },
};
