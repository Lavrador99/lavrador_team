import { api } from './axios';
import { WorkoutBlock } from '@libs/types';

export interface WorkoutTemplateDto {
  id: string;
  name: string;
  description?: string | null;
  tags: string[];
  blocks: WorkoutBlock[];
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
}

export const workoutTemplatesApi = {
  getAll: async (): Promise<WorkoutTemplateDto[]> => {
    const { data } = await api.get('/workout-templates');
    return data;
  },

  getById: async (id: string): Promise<WorkoutTemplateDto> => {
    const { data } = await api.get(`/workout-templates/${id}`);
    return data;
  },

  create: async (body: {
    name: string;
    description?: string;
    tags?: string[];
    blocks: WorkoutBlock[];
    isPublic?: boolean;
  }): Promise<WorkoutTemplateDto> => {
    const { data } = await api.post('/workout-templates', body);
    return data;
  },

  update: async (id: string, body: Partial<WorkoutTemplateDto>): Promise<WorkoutTemplateDto> => {
    const { data } = await api.patch(`/workout-templates/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workout-templates/${id}`);
  },
};
