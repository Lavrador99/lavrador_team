import { api } from './axios';
import {
  WorkoutDto, CreateWorkoutRequest, UpdateWorkoutRequest,
  WorkoutLogDto, CreateWorkoutLogRequest, CreateUserRequest,
  WorkoutBlock,
} from '@libs/types';

export const workoutsApi = {
  create: async (body: CreateWorkoutRequest): Promise<WorkoutDto> => {
    const { data } = await api.post('/workouts', body);
    return data;
  },

  getByProgram: async (programId: string): Promise<WorkoutDto[]> => {
    const { data } = await api.get(`/workouts/program/${programId}`);
    return data;
  },

  getByClient: async (clientId: string): Promise<WorkoutDto[]> => {
    const { data } = await api.get(`/workouts/client/${clientId}`);
    return data;
  },

  getMy: async (): Promise<WorkoutDto[]> => {
    const { data } = await api.get('/workouts/my');
    return data;
  },

  getById: async (id: string): Promise<WorkoutDto> => {
    const { data } = await api.get(`/workouts/${id}`);
    return data;
  },

  update: async (id: string, body: UpdateWorkoutRequest): Promise<WorkoutDto> => {
    const { data } = await api.patch(`/workouts/${id}`, body);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/workouts/${id}`);
  },

  previewDuration: async (blocks: WorkoutBlock[]) => {
    const { data } = await api.post('/workouts/duration-preview', { blocks });
    return data as { totalMin: number; warning?: string; breakdown: { label: string; minutes: number }[] };
  },

  // Logs
  createLog: async (body: CreateWorkoutLogRequest): Promise<WorkoutLogDto> => {
    const { data } = await api.post('/workouts/logs', body);
    return data;
  },

  getLogsByWorkout: async (workoutId: string): Promise<WorkoutLogDto[]> => {
    const { data } = await api.get(`/workouts/${workoutId}/logs`);
    return data;
  },

  getMyLogs: async (): Promise<WorkoutLogDto[]> => {
    const { data } = await api.get('/workouts/logs/my');
    return data;
  },
};

export const adminApi = {
  createUser: async (body: CreateUserRequest) => {
    const { data } = await api.post('/auth/users', body);
    return data;
  },
};
