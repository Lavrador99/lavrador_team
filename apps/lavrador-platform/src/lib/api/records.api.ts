import { api } from './axios';

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  type: string;
  value: number; // estimated 1RM for WEIGHT_KG
  notes?: string;
  recordedAt: string;
}

export const recordsApi = {
  getMyBest: async (): Promise<PersonalRecord[]> => {
    const { data } = await api.get('/personal-records/my/best');
    return data;
  },
};
