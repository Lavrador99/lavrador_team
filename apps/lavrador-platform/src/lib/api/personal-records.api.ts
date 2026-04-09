import { api } from './axios';
import { PersonalRecordDto, CreatePersonalRecordRequest } from '@libs/types';

export const personalRecordsApi = {
  create: async (body: CreatePersonalRecordRequest): Promise<PersonalRecordDto> => {
    const { data } = await api.post('/personal-records', body);
    return data;
  },

  getByClient: async (clientId: string): Promise<PersonalRecordDto[]> => {
    const { data } = await api.get(`/personal-records/client/${clientId}`);
    return data;
  },

  getBestByClient: async (clientId: string): Promise<PersonalRecordDto[]> => {
    const { data } = await api.get(`/personal-records/client/${clientId}/best`);
    return data;
  },

  getHistory: async (clientId: string, exerciseName: string): Promise<PersonalRecordDto[]> => {
    const { data } = await api.get(`/personal-records/client/${clientId}/history`, {
      params: { exercise: exerciseName },
    });
    return data;
  },

  // Client: own records
  getMyBest: async (): Promise<PersonalRecordDto[]> => {
    const { data } = await api.get('/personal-records/my/best');
    return data;
  },

  getMyHistory: async (exerciseName: string): Promise<PersonalRecordDto[]> => {
    const { data } = await api.get('/personal-records/my/history', {
      params: { exercise: exerciseName },
    });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/personal-records/${id}`);
  },
};
