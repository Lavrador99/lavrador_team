import { AchievementDto } from '@libs/types';
import { api } from './axios';

export const achievementsApi = {
  getMy: (): Promise<AchievementDto[]> =>
    api.get('/achievements/my').then((r) => r.data),

  getForClient: (clientId: string): Promise<AchievementDto[]> =>
    api.get(`/achievements/client/${clientId}`).then((r) => r.data),
};
