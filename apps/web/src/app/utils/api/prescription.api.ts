import { api } from './axios';
import {
  AssessmentDto,
  ProgramDto,
  CreateAssessmentRequest,
  GenerateProgramRequest,
  UpdateExerciseSelectionsRequest,
} from '@libs/types';

export const assessmentsApi = {
  create: async (body: CreateAssessmentRequest): Promise<AssessmentDto> => {
    const { data } = await api.post('/assessments', body);
    return data;
  },
  getByClient: async (clientId: string): Promise<AssessmentDto[]> => {
    const { data } = await api.get(`/assessments/client/${clientId}`);
    return data;
  },
  getById: async (id: string): Promise<AssessmentDto> => {
    const { data } = await api.get(`/assessments/${id}`);
    return data;
  },
};

export const programsApi = {
  generate: async (body: GenerateProgramRequest): Promise<ProgramDto> => {
    const { data } = await api.post('/programs/generate', body);
    return data;
  },
  getById: async (id: string): Promise<ProgramDto> => {
    const { data } = await api.get(`/programs/${id}`);
    return data;
  },
  getByClient: async (clientId: string): Promise<ProgramDto[]> => {
    const { data } = await api.get(`/programs/client/${clientId}`);
    return data;
  },
  updateSelections: async (id: string, body: UpdateExerciseSelectionsRequest): Promise<ProgramDto> => {
    const { data } = await api.patch(`/programs/${id}/exercises`, body);
    return data;
  },
  archive: async (id: string): Promise<void> => {
    await api.patch(`/programs/${id}/archive`);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/programs/${id}`);
  },
  exportJson: (id: string): string => `/api/programs/${id}/export`,
};
