'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { statsApi } from '../../../../lib/api/stats.api';
import { sessionsApi } from '../../../../lib/api/clients.api';
import { ClientStats, SessionDto } from '@libs/types';
import { useEffect, useState } from 'react';

const MOTIVATIONAL = [
  'Cada repetição conta.',
  'Consistência bate intensidade.',
  'O progresso é inevitável.',
  'Mais forte do que ontem.',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getTodayLabel() {
  return new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Micro components ─────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex-1 bg-zinc-900 rounded-2xl px-4 py-3.5 border border-zinc-800/60">
      <div className="font-black text-2xl text-white font-[Manrope]">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">{label}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-3">{children}</h2>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading } = useSWR<ClientStats>('my-stats', statsApi.getMy);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionDto[]>([]);
  const quote = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];

  useEffect(() => {
    if (!stats?.clientId) return;
    sessionsApi.getUpcoming(stats.clientId)
      .then(setUpcomingSessions)
      .catch(() => {});
  }, [stats?.clientId]);

  const nextSession = upcomingSessions[0];
  const clientName = stats?.clientName?.split(' ')[0] ?? 'Atleta';

  return (
    <div className="pb-4">

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div className="mb-6 pt-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-1">{getTodayLabel()}</div>
        <h1 className="font-[Manrope] font-black text-3xl text-white leading-tight">
          {getGreeting()},<br />{clientName}.
        </h1>
      </div>

      {/* ── Start Workout hero ────────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/client/my-plan')}
        className="w-full relative overflow-hidden rounded-2xl mb-5 text-left active:scale-[0.98] transition-transform"
        style={{ background: 'linear-gradient(135deg, #005050 0%, #003535 100%)' }}
      >
        <div className="relative z-10 px-5 py-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#84d4d3] mb-2">Treino de hoje</div>
          <div className="font-[Manrope] font-black text-xl text-white mb-1">
            {stats?.activeProgram ?? 'O teu plano'}
          </div>
          <div className="text-xs text-teal-200/70 mb-4">{quote}</div>
          <div className="inline-flex items-center gap-2 bg-[#c8f542] text-black font-bold text-xs px-4 py-2.5 rounded-xl">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            Iniciar treino
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#84d4d3', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 right-8 w-20 h-20 rounded-full opacity-10" style={{ background: '#c8f542', transform: 'translateY(40%)' }} />
      </button>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <StatPill
          value={isLoading ? '—' : stats?.totalWorkoutLogs ?? 0}
          label="Treinos"
        />
        <StatPill
          value={isLoading ? '—' : stats?.workoutStreak != null ? `${stats.workoutStreak}d` : '—'}
          label="Streak"
        />
        <StatPill
          value={isLoading ? '—' : `${stats?.attendanceRate ?? 0}%`}
          label="Presença"
        />
      </div>

      {/* ── Next session ──────────────────────────────────────────────────── */}
      {nextSession && (
        <div className="mb-6">
          <SectionTitle>Próxima sessão</SectionTitle>
          <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800/60 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#005050]/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#84d4d3] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white capitalize">
                {new Date(nextSession.scheduledAt).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'short' })}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {new Date(nextSession.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                {' · '}{nextSession.duration} min
                {nextSession.notes && ` · ${nextSession.notes}`}
              </div>
            </div>
            <div className="flex-shrink-0 text-xs font-bold text-[#84d4d3] bg-[#005050]/20 px-2.5 py-1 rounded-lg">
              {nextSession.type === 'TRAINING' ? 'Treino' : nextSession.type === 'ASSESSMENT' ? 'Avaliação' : 'Acompanham.'}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent logs ───────────────────────────────────────────────────── */}
      {stats?.recentWorkoutLogs && stats.recentWorkoutLogs.length > 0 && (
        <div className="mb-6">
          <SectionTitle>Histórico recente</SectionTitle>
          <div className="flex flex-col gap-2">
            {stats.recentWorkoutLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800/60">
                <div className="w-2 h-2 rounded-full bg-[#84d4d3] flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-white capitalize">
                    {new Date(log.date).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </div>
                </div>
                {log.durationMin && (
                  <div className="text-xs text-zinc-400">{log.durationMin} min</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick links ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        <SectionTitle>Acesso rápido</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/client/my-records', icon: 'emoji_events', label: 'Records pessoais', color: 'text-yellow-400' },
            { href: '/client/habits',     icon: 'task_alt',      label: 'Hábitos diários',  color: 'text-[#84d4d3]' },
            { href: '/client/stats',      icon: 'insights',      label: 'Analytics',         color: 'text-purple-400' },
          ].map(({ href, icon, label, color }) => (
            <button key={href} onClick={() => router.push(href)}
              className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800/60 text-left flex items-center gap-3 active:scale-95 transition-transform">
              <span className={`material-symbols-outlined text-xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              <span className="text-sm text-white font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
