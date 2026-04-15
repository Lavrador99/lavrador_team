import useSWR from 'swr';
import { statsApi } from '../api/stats.api';
import { DashboardStats, ClientStats } from '@libs/types';

export function useDashboardStats() {
  return useSWR<DashboardStats>('admin-stats', statsApi.getDashboard);
}

export function useMyStats() {
  return useSWR<ClientStats>('my-stats', statsApi.getMy);
}

export function useClientStats(clientId: string | null) {
  return useSWR(clientId ? `stats-${clientId}` : null, () => statsApi.getClient(clientId!));
}
