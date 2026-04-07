import { useState, useEffect } from 'react';
import { DashboardStats, ClientStats } from '@libs/types';
import { statsApi } from '../utils/api/stats.api';

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statsApi.getDashboard()
      .then(setStats)
      .catch(() => setError('Erro ao carregar estatísticas'))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
};

export const useClientStats = (clientId: string) => {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    statsApi.getClient(clientId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [clientId]);

  return { stats, loading };
};

export const useMyStats = () => {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.getMy()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
};
