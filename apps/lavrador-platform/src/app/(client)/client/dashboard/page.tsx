'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { statsApi } from '../../../../lib/api/stats.api';
import { sessionsApi } from '../../../../lib/api/clients.api';
import { ClientStats, SessionDto } from '@libs/types';
import { useEffect, useState } from 'react';

const SESSION_TYPE_LABEL: Record<string, string> = {
  TRAINING: 'Treino', ASSESSMENT: 'Avaliação', FOLLOWUP: 'Acompanhamento',
};
const SESSION_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: '#42a5f5', COMPLETED: '#c8f542', CANCELLED: '#ff3b3b', NO_SHOW: '#ff8c5a',
};
const LEVEL_LABEL: Record<string, string> = {
  INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado',
  iniciante: 'Iniciante', intermedio: 'Intermédio', avancado: 'Avançado',
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading: loadingStats } = useSWR<ClientStats>('my-stats', statsApi.getMy);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionDto[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!stats?.clientId) return;
    sessionsApi.getUpcoming(stats.clientId)
      .then(setUpcomingSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [stats?.clientId]);

  const kpis = [
    { label: 'Treinos registados', val: stats?.totalWorkoutLogs ?? '—', color: '#c8f542' },
    {
      label: 'Streak actual',
      val: stats?.workoutStreak != null ? `${stats.workoutStreak} ${stats.workoutStreak === 1 ? 'dia' : 'dias'}` : '—',
      color: '#f5a442',
    },
    { label: 'Taxa comparência', val: stats ? `${stats.attendanceRate}%` : '—', color: '#42a5f5' },
    {
      label: 'Nível actual',
      val: stats ? (LEVEL_LABEL[stats.currentLevel] ?? stats.currentLevel) : '—',
      color: '#a855f7',
    },
  ];

  return (
    <div>
      {/* Quick action */}
      <button
        onClick={() => router.push('/client/my-plan')}
        className="w-full flex items-center gap-4 bg-accent/[0.06] border border-accent/20 rounded-xl px-5 py-4 mb-5 hover:bg-accent/10 hover:border-accent/40 transition-all text-left"
      >
        <span className="text-2xl text-accent">▦</span>
        <div>
          <div className="font-syne font-bold text-sm text-white">Ver o meu plano de treino</div>
          <div className="font-mono text-[10px] text-accent mt-0.5 tracking-wide">Inicia o treino de hoje →</div>
        </div>
      </button>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {kpis.map(({ label, val, color }) => (
          <div
            key={label}
            className="bg-panel border border-border rounded-xl p-4"
            style={{ borderTopColor: color, borderTopWidth: 2 }}
          >
            <div className="font-syne font-black text-2xl" style={{ color }}>
              {loadingStats ? '—' : val}
            </div>
            <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Active program */}
      {stats?.activeProgram && (
        <div className="bg-panel border border-border rounded-xl p-4 mb-5">
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-1">Plano activo</div>
          <div className="font-syne font-bold text-base text-white">{stats.activeProgram}</div>
        </div>
      )}

      {/* Recent workout logs */}
      {stats?.recentWorkoutLogs && stats.recentWorkoutLogs.length > 0 && (
        <>
          <h2 className="font-syne font-bold text-sm text-white mb-3">Treinos recentes</h2>
          <div className="flex flex-col gap-2 mb-6">
            {stats.recentWorkoutLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 bg-panel border border-border rounded-lg px-3.5 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-sans text-xs text-white capitalize">
                    {new Date(log.date).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </div>
                  {log.durationMin && (
                    <div className="font-mono text-[10px] text-faint mt-0.5">{log.durationMin} min</div>
                  )}
                </div>
                <div className="font-mono text-[10px] text-muted flex-shrink-0">
                  {formatDistanceToNow(new Date(log.date), { addSuffix: true, locale: pt })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upcoming sessions */}
      <h2 className="font-syne font-bold text-sm text-white mb-3">Próximas sessões</h2>
      {loadingSessions || loadingStats ? (
        <div className="font-mono text-xs text-faint py-4">A carregar...</div>
      ) : upcomingSessions.length === 0 ? (
        <div className="font-mono text-xs text-faint py-4">Sem sessões agendadas.</div>
      ) : (
        <div className="flex flex-col gap-2 mb-6">
          {upcomingSessions.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-start gap-3 bg-panel border border-border rounded-xl px-4 py-3.5">
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: SESSION_STATUS_COLOR[s.status] ?? '#444' }}
              />
              <div className="flex-1">
                <div className="font-syne font-bold text-sm text-white mb-0.5">
                  {SESSION_TYPE_LABEL[s.type] ?? s.type}
                </div>
                <div className="font-mono text-[11px] text-muted capitalize">
                  {new Date(s.scheduledAt).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}
                  {' · '}
                  {new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {s.duration} min
                </div>
                {s.notes && <div className="font-mono text-[10px] text-faint mt-1">{s.notes}</div>}
              </div>
              <div className="font-mono text-[10px] text-[#42a5f5] flex-shrink-0 text-right">
                {formatDistanceToNow(new Date(s.scheduledAt), { addSuffix: true, locale: pt })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assessment history */}
      {stats?.assessmentHistory && stats.assessmentHistory.length > 0 && (
        <>
          <h2 className="font-syne font-bold text-sm text-white mb-3">Histórico de avaliações</h2>
          <div className="flex flex-col gap-2">
            {stats.assessmentHistory.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-panel border border-border rounded-lg px-3.5 py-2.5 flex-wrap">
                <div className="font-syne font-bold text-xs text-purple-400 min-w-[90px]">
                  {LEVEL_LABEL[a.level] ?? a.level}
                </div>
                <div className="font-mono text-[11px] text-muted flex-1">
                  {new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                {a.flags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {a.flags.map((f) => (
                      <span key={f} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-orange-500/8 text-orange-400 border border-orange-500/20">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
