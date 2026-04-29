'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { statsApi } from '../../lib/api/stats.api';

export function PtInsightsPanel() {
  const { data, isLoading } = useSWR('pt-insights', statsApi.getInsights, { refreshInterval: 5 * 60 * 1000 });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5">
        <div className="h-4 bg-zinc-800 rounded animate-pulse w-32 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-zinc-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { inactiveClients, weeklyLoad, expiringPrograms, topStreaks, upcomingSessionsCount } = data;

  return (
    <div className="space-y-4">

      {/* ── Sessões esta semana ──────────────────────────────────────── */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Carga semanal</div>
          <span className="text-[11px] font-bold text-[#84d4d3]">{upcomingSessionsCount} sessões</span>
        </div>
        <div className="flex items-end gap-1.5 h-14">
          {weeklyLoad.map(({ day, sessions }) => {
            const max = Math.max(...weeklyLoad.map((d) => d.sessions), 1);
            const pct = sessions > 0 ? Math.max(15, Math.round((sessions / max) * 100)) : 4;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm transition-all" style={{ height: `${pct}%`, minHeight: 2, background: sessions > 0 ? '#84d4d3' : '#27272a' }} />
                <span className="text-[11px] text-zinc-500 font-bold">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Clientes inativos ────────────────────────────────────────── */}
      {inactiveClients.length > 0 && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-orange-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Sem treinar</div>
            <span className="ml-auto text-[11px] font-bold text-orange-400">{inactiveClients.length}</span>
          </div>
          <div className="space-y-2">
            {inactiveClients.slice(0, 5).map((c) => (
              <Link
                key={c.clientId}
                href={`/clients/${c.clientId}`}
                className="flex items-center justify-between rounded-xl bg-zinc-800/60 border border-zinc-700/40 px-3 py-2.5 hover:border-orange-400/30 transition-colors"
              >
                <span className="text-sm text-white font-semibold">{c.name}</span>
                <span className="text-[11px] font-bold text-orange-400">
                  {c.daysSince === null ? 'Nunca treinou' : `${c.daysSince}d`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Programas a expirar ──────────────────────────────────────── */}
      {expiringPrograms.length > 0 && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-yellow-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Programas a expirar</div>
          </div>
          <div className="space-y-2">
            {expiringPrograms.map((p) => (
              <Link
                key={p.programId}
                href={`/clients/${p.clientId}`}
                className="flex items-center justify-between rounded-xl bg-zinc-800/60 border border-zinc-700/40 px-3 py-2.5 hover:border-yellow-400/30 transition-colors"
              >
                <div>
                  <div className="text-sm text-white font-semibold">{p.clientName}</div>
                  <div className="text-[10px] text-zinc-500">{p.programName}</div>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${p.daysLeft <= 3 ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                  {p.daysLeft}d
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Top streaks ──────────────────────────────────────────────── */}
      {topStreaks.length > 0 && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#c8f542] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Em chama</div>
          </div>
          <div className="space-y-2">
            {topStreaks.map((c) => (
              <Link
                key={c.clientId}
                href={`/clients/${c.clientId}`}
                className="flex items-center justify-between rounded-xl bg-zinc-800/60 border border-zinc-700/40 px-3 py-2.5 hover:border-[#c8f542]/30 transition-colors"
              >
                <span className="text-sm text-white font-semibold">{c.name}</span>
                <span className="text-[11px] font-bold text-[#c8f542]">{c.streak} dias 🔥</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
