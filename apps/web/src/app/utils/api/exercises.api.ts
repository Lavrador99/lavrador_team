import { api } from './axios';
import { ExerciseDto } from '@libs/types';

export interface ExerciseFilters {
  pattern?: string;
  level?: string;
  equipment?: string;
  muscle?: string;
  search?: string;
}

export const exercisesApi = {
  getAll: async (filters: ExerciseFilters = {}): Promise<ExerciseDto[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const { data } = await api.get(`/exercises?${params.toString()}`);
    return data;
  },

  getById: async (id: string): Promise<ExerciseDto> => {
    const { data } = await api.get(`/exercises/${id}`);
    return data;
  },

  create: async (body: Partial<ExerciseDto>): Promise<ExerciseDto> => {
    const { data } = await api.post('/exercises', body);
    return data;
  },

  update: async (id: string, body: Partial<ExerciseDto>): Promise<ExerciseDto> => {
    const { data } = await api.patch(`/exercises/${id}`, body);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/exercises/${id}`);
  },
};
