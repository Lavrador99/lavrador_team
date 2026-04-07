import { api } from './axios';

export interface HabitDto {
  id: string;
  clientId: string;
  name: string;
  icon?: string | null;
  frequency: string;
  isActive: boolean;
  createdAt: string;
  logs: HabitLogDto[];
}

export interface HabitLogDto {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export interface HabitAdherence {
  adherencePct: number;
  totalHabits: number;
  completedThisWeek: number;
}

export const habitsApi = {
  getMy: async (): Promise<HabitDto[]> => {
    const { data } = await api.get('/habits/my');
    return data;
  },

  getMyAdherence: async (): Promise<HabitAdherence> => {
    const { data } = await api.get('/habits/my/adherence');
    return data;
  },

  log: async (habitId: string, date: string, completed = true): Promise<HabitLogDto> => {
    const { data } = await api.post(`/habits/${habitId}/log`, { date, completed });
    return data;
  },

  // ADMIN
  getByClient: async (clientId: string): Promise<HabitDto[]> => {
    const { data } = await api.get(`/habits/client/${clientId}`);
    return data;
  },

  getAdherence: async (clientId: string): Promise<HabitAdherence> => {
    const { data } = await api.get(`/habits/client/${clientId}/adherence`);
    return data;
  },

  createForClient: async (clientId: string, body: { name: string; icon?: string; frequency?: string }): Promise<HabitDto> => {
    const { data } = await api.post(`/habits/client/${clientId}`, body);
    return data;
  },

  update: async (id: string, body: { name?: string; icon?: string; isActive?: boolean }): Promise<HabitDto> => {
    const { data } = await api.patch(`/habits/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/habits/${id}`);
  },
};
