import { api } from './axios';
import { DashboardStats, ClientStats, SessionsDistribution } from '@libs/types';

export const statsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/stats/dashboard');
    return data;
  },

  getMy: async (): Promise<ClientStats> => {
    const { data } = await api.get('/stats/my');
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

  getInsights: async (): Promise<{
    inactiveClients: { clientId: string; name: string; lastWorkoutDate: string | null; daysSince: number | null }[];
    weeklyLoad: { day: string; sessions: number }[];
    expiringPrograms: { programId: string; programName: string; clientId: string; clientName: string; daysLeft: number; endDate: string }[];
    topStreaks: { clientId: string; name: string; streak: number; totalWorkouts: number }[];
    upcomingSessionsCount: number;
  }> => {
    const { data } = await api.get('/stats/insights');
    return data;
  },

  getChurnRisk: async () => {
    const { data } = await api.get('/stats/churn-risk');
    return data as { clientId: string; clientName: string; recentAdherencePct: number; previousAdherencePct: number; dropPct: number }[];
  },
};
