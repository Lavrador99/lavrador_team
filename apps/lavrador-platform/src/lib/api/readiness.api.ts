import { ReadinessLogDto, CreateReadinessRequest } from '@libs/types';
import { api } from './axios';

export const readinessApi = {
  create: (data: CreateReadinessRequest): Promise<ReadinessLogDto> =>
    api.post('/readiness', data).then((r) => r.data),

  getMy: (limit = 30): Promise<ReadinessLogDto[]> =>
    api.get(`/readiness/my?limit=${limit}`).then((r) => r.data),

  getToday: (): Promise<ReadinessLogDto | null> =>
    api.get('/readiness/my/today').then((r) => r.data),

  getForClient: (clientId: string, limit = 10): Promise<ReadinessLogDto[]> =>
    api.get(`/readiness/client/${clientId}?limit=${limit}`).then((r) => r.data),
};
