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

  // Exercise history
  getExerciseHistory: async (clientId: string, exerciseId: string) => {
    const { data } = await api.get(`/workouts/history/client/${clientId}/exercise/${exerciseId}`);
    return data as { date: string; sets: { setNumber: number; reps: number; load?: number; rpe?: number; completed: boolean }[] }[];
  },

  getMyExerciseHistory: async (exerciseId: string) => {
    const { data } = await api.get(`/workouts/history/my/exercise/${exerciseId}`);
    return data as { date: string; sets: { setNumber: number; reps: number; load?: number; rpe?: number; completed: boolean }[] }[];
  },

  // Calendar
  getCalendarByClient: async (clientId: string) => {
    const { data } = await api.get(`/workouts/calendar/client/${clientId}`);
    return data as { id: string; date: string; workoutName: string | null; durationMin: number | null }[];
  },

  getMyCalendar: async () => {
    const { data } = await api.get('/workouts/calendar/my');
    return data as { id: string; date: string; workoutName: string | null; durationMin: number | null }[];
  },

  // Muscle volume
  getMuscleVolumeByClient: async (clientId: string, weeks = 4) => {
    const { data } = await api.get(`/workouts/muscle-volume/client/${clientId}?weeks=${weeks}`);
    return data as { cards: { muscle: string; sets: number; pct: number }[]; weekly: ({ week: string } & Record<string, number | string>)[] };
  },

  getMyMuscleVolume: async (weeks = 4) => {
    const { data } = await api.get(`/workouts/muscle-volume/my?weeks=${weeks}`);
    return data as { cards: { muscle: string; sets: number; pct: number }[]; weekly: ({ week: string } & Record<string, number | string>)[] };
  },
};

export const adminApi = {
  createUser: async (body: CreateUserRequest) => {
    const { data } = await api.post('/auth/users', body);
    return data;
  },
};
