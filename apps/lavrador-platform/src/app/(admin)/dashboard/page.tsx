'use client';
import useSWR from 'swr';
import { statsApi } from '../../../lib/api/stats.api';
import { DashboardStats } from '@libs/types';

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      className="bg-panel border border-border rounded-xl p-5"
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      <div className="font-syne font-black text-3xl" style={{ color }}>{value}</div>
      <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-1.5">{label}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useSWR<DashboardStats>('admin-stats', statsApi.getDashboard);

  return (
    <div>
      <h1 className="font-syne font-black text-2xl text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Clientes activos" value={isLoading ? '—' : stats?.totalClients ?? 0} color="#42a5f5" />
        <StatCard label="Planos activos" value={isLoading ? '—' : stats?.activePrograms ?? 0} color="#c8f542" />
        <StatCard label="Sessões esta semana" value={isLoading ? '—' : stats?.sessionsThisWeek ?? 0} color="#f5a442" />
        <StatCard label="Sessões este mês" value={isLoading ? '—' : stats?.sessionsThisMonth ?? 0} color="#a855f7" />
        <StatCard label="Taxa comparência" value={isLoading ? '—' : `${stats?.attendanceRate ?? 0}%`} color="#ff8c5a" />
        <StatCard label="Novos clientes" value={isLoading ? '—' : stats?.newClientsThisMonth ?? 0} color="#c8f542" />
      </div>

      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <>
          <h2 className="font-syne font-bold text-sm text-white mb-3">Actividade recente</h2>
          <div className="flex flex-col gap-2">
            {stats.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-panel border border-border rounded-lg px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-sans text-sm text-white">{a.clientName}</span>
                  <span className="font-mono text-xs text-muted ml-2">{a.action}</span>
                </div>
                <span className="font-mono text-[10px] text-faint flex-shrink-0">
                  {new Date(a.date).toLocaleDateString('pt-PT')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
