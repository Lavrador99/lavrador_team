'use client';
import { DashboardStats } from '@libs/types';
import { PageHeader, KpiCard, SectionTitle, EmptyState } from '../../../components/ui';
import { useDashboardStats } from '../../../lib/hooks/useStats';
import { PtInsightsPanel } from '../../../components/dashboard/PtInsightsPanel';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const v = (key: keyof DashboardStats, pct = false) => {
    if (isLoading) return '—';
    const raw = stats?.[key] ?? 0;
    return pct ? `${raw}%` : String(raw);
  };

  return (
    <div>
      <PageHeader
        label="Visão Geral"
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <KpiCard value={v('totalClients')}         label="Clientes activos"  icon="group"          accent="border-primary" />
        <KpiCard value={v('sessionsThisMonth')}    label="Sessões este mês"  icon="calendar_today" accent="border-tertiary" />
        <KpiCard value={v('newClientsThisMonth')}  label="Novos clientes"    icon="person_add"     accent="border-primary"  sub="mês" />
        <KpiCard value={v('attendanceRate', true)} label="Taxa de presença"  icon="verified"       accent="border-tertiary" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity feed — 2/3 */}
        <div className="xl:col-span-2">
          <SectionTitle>Actividade recente</SectionTitle>
          {!stats?.recentActivity?.length ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
              <EmptyState icon="history" title="Sem actividade recente" size="section" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-4 bg-surface-container-lowest rounded-xl px-5 py-3.5 shadow-sm">
                  <div className="w-8 h-8 rounded-full kinetic-gradient flex items-center justify-center font-headline font-black text-on-primary text-sm flex-shrink-0">
                    {a.clientName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-sm font-semibold text-on-surface">{a.clientName}</span>
                    <span className="font-label text-xs text-secondary ml-2">{a.action}</span>
                  </div>
                  <span className="label-category flex-shrink-0 text-secondary">
                    {new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar — 1/3 */}
        <div className="flex flex-col gap-6">
          {/* PT Insights */}
          <PtInsightsPanel />

          {/* Weekly forecast */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="label-category mb-1">Previsão semanal</p>
            <div className="flex items-end gap-2 mt-2">
              <span className="font-headline font-black text-3xl text-on-surface">
                {isLoading ? '—' : stats?.sessionsThisWeek ?? 0}
              </span>
              <span className="text-sm text-secondary mb-1">sessões esta semana</span>
            </div>
            <div className="mt-4 flex gap-1">
              {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((d, i) => {
                const today = new Date().getDay();
                const dayIdx = i === 6 ? 0 : i + 1;
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={`w-full rounded-lg transition-all ${
                      dayIdx === today  ? 'h-8 kinetic-gradient' :
                      dayIdx < today    ? 'h-5 bg-primary-fixed/40' :
                                          'h-3 bg-surface-container-high'
                    }`} />
                    <span className="label-category" style={{ fontSize: '9px' }}>{d[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active programs */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="label-category mb-3">Planos activos</p>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl kinetic-gradient flex items-center justify-center flex-shrink-0">
                <span className="font-headline font-black text-on-primary text-2xl">
                  {isLoading ? '—' : stats?.activePrograms ?? 0}
                </span>
              </div>
              <div>
                <div className="font-headline font-bold text-sm text-on-surface">Programas em curso</div>
                <div className="label-category mt-0.5">Clientes com plano ativo</div>
              </div>
            </div>
          </div>

          {/* Sessions split */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="label-category mb-3">Sessões</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Esta semana', value: v('sessionsThisWeek'),  accent: 'text-primary' },
                { label: 'Este mês',    value: v('sessionsThisMonth'), accent: 'text-tertiary' },
              ].map(({ label, value, accent }) => (
                <div key={label} className="bg-surface-container rounded-xl p-3">
                  <div className={`font-headline font-black text-2xl ${accent}`}>{value}</div>
                  <div className="label-category mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
