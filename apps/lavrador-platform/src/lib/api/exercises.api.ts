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

  updateMedia: async (id: string, media: { videoUrl?: string | null; gifUrl?: string | null }): Promise<ExerciseDto> => {
    const { data } = await api.patch(`/exercises/${id}`, media);
    return data;
  },

  uploadFile: async (id: string, file: File, onProgress?: (pct: number) => void): Promise<ExerciseDto> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`/exercises/${id}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/exercises/${id}`);
  },
};
