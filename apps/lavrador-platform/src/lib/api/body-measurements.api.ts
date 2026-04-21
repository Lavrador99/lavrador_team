import { api } from './axios';

export interface BodyMeasurementDto {
  id: string;
  clientId: string;
  recordedAt: string;
  peso?: number;
  altura?: number;
  pctGordura?: number;
  massaMagra?: number;
  cc?: number;
  cq?: number;
  cBraco?: number;
  cCoxa?: number;
  fcRep?: number;
  pas?: number;
  pad?: number;
  notes?: string;
}

export type CreateBodyMeasurementRequest = Omit<BodyMeasurementDto, 'id'>;

export const bodyMeasurementsApi = {
  create: async (dto: CreateBodyMeasurementRequest): Promise<BodyMeasurementDto> => {
    const { data } = await api.post('/body-measurements', dto);
    return data;
  },

  getByClient: async (clientId: string): Promise<BodyMeasurementDto[]> => {
    const { data } = await api.get(`/body-measurements/client/${clientId}`);
    return data;
  },

  getMy: async (): Promise<BodyMeasurementDto[]> => {
    const { data } = await api.get('/body-measurements/my');
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/body-measurements/${id}`);
  },
};
