import { api } from './axios';
import {
  UserDto, SessionDto, CreateSessionRequest,
  UpdateSessionRequest, SessionFilters,
} from '@libs/types';

// ─── Assessments ──────────────────────────────────────────────────────────────

export interface AssessmentSummary {
  id: string;
  level: string;
  flags: string[];
  data: Record<string, any>;
  createdAt: string;
}

export const assessmentsApi = {
  getByClient: async (clientId: string): Promise<AssessmentSummary[]> => {
    const { data } = await api.get(`/assessments/client/${clientId}`);
    return data;
  },
};

// ─── Clients ──────────────────────────────────────────────────────────────────

export const clientsApi = {
  getAll: async (): Promise<UserDto[]> => {
    const { data } = await api.get('/users');
    return data;
  },

  getDetail: async (clientId: string) => {
    const { data } = await api.get(`/users/clients/${clientId}/detail`);
    return data;
  },
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  create: async (body: CreateSessionRequest): Promise<SessionDto> => {
    const { data } = await api.post('/sessions', body);
    return data;
  },

  getAll: async (filters: SessionFilters = {}): Promise<SessionDto[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const { data } = await api.get(`/sessions?${params.toString()}`);
    return data;
  },

  getById: async (id: string): Promise<SessionDto> => {
    const { data } = await api.get(`/sessions/${id}`);
    return data;
  },

  update: async (id: string, body: UpdateSessionRequest): Promise<SessionDto> => {
    const { data } = await api.patch(`/sessions/${id}`, body);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },

  getUpcoming: async (clientId: string): Promise<SessionDto[]> => {
    const { data } = await api.get(`/sessions/client/${clientId}/upcoming`);
    return data;
  },

  getStats: async (clientId: string) => {
    const { data } = await api.get(`/sessions/client/${clientId}/stats`);
    return data;
  },
};
