import { api } from './axios';

export interface SuggestionRequest {
  clientId:  string;
  level:     string;
  objective: string;
  flags:     string[];
  equipment: string[];
  pattern?:  string;
}

export interface ExerciseSuggestion {
  exerciseId:    string;
  name:          string;
  pattern:       string;
  primaryMuscles:string[];
  score:         number;
  origin:        'PT_PREFERENCE' | 'ACSM_DEFAULT' | 'CORRECTIVE';
  notes?:        string;
}

export interface SuggestionResult {
  prescription: {
    objective: string;
    sets:      { min: number; max: number };
    reps:      { min: number; max: number } | 'AMRAP';
    percentRM: { min: number; max: number };
    rirTarget: number;
    restBetweenSetsSeconds: { min: number; max: number };
    weeklySetsPerPattern:   { min: number; optimal: number };
    tempo:     string;
    notes:     string;
  };
  frequencyRecommendation: string;
  suggestions:        ExerciseSuggestion[];
  correctiveExercises:ExerciseSuggestion[];
  warnings:           string[];
  systemStatus: {
    threshold:       number;
    currentWorkouts: number;
    learningActive:  boolean;
    message:         string;
  };
}

export const suggestionApi = {
  suggest: async (body: SuggestionRequest): Promise<SuggestionResult> => {
    const { data } = await api.post('/suggestions', body);
    return data;
  },

  recordChoose: async (body: {
    exerciseId: string; level: string; pattern: string;
    objective: string; chosen: boolean;
  }) => {
    await api.post('/suggestions/feedback/choose', body);
  },

  recordSubstitution: async (body: {
    fromExId: string; toExId: string; level: string;
    pattern: string; objective: string; reason?: string;
  }) => {
    await api.post('/suggestions/feedback/substitute', body);
  },

  getLearningStatus: async () => {
    const { data } = await api.get('/suggestions/learning-status');
    return data;
  },

  validate: async (body: {
    sets: number; reps: number; percentRM: number; objective: string;
  }) => {
    const { data } = await api.post('/suggestions/validate', body);
    return data;
  },
};
