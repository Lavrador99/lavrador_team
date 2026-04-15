import useSWR from 'swr';
import { clientsApi, sessionsApi } from '../api/clients.api';
import { UserDto, SessionDto } from '@libs/types';

export function useClients() {
  return useSWR<UserDto[]>('clients-all', clientsApi.getAll);
}

export function useClientDetail(clientId: string | null) {
  return useSWR(clientId ? `client-${clientId}` : null, () => clientsApi.getDetail(clientId!));
}

export function useSessions(params?: { clientId?: string; from?: string; to?: string }, key?: unknown) {
  return useSWR<SessionDto[]>(
    key !== undefined ? key : ['sessions', JSON.stringify(params)],
    () => sessionsApi.getAll(params ?? {}),
  );
}
