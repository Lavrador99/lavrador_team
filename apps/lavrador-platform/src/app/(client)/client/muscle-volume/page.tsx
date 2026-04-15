'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { workoutsApi } from '../../../../lib/api/workouts.api';

const MUSCLE_PT: Record<string, string> = {
  chest: 'Peito', back: 'Costas', shoulders: 'Ombros', biceps: 'Bíceps',
  triceps: 'Tríceps', legs: 'Pernas', glutes: 'Glúteos', core: 'Core',
  hamstrings: 'Isquiotibiais', quadriceps: 'Quadríceps', calves: 'Gémeos',
  forearms: 'Antebraços', trapezius: 'Trapézio',
};

const WEEK_OPTIONS = [2, 4, 8, 12];

const COLOR_MAP: Record<string, string> = {
  chest: '#60a5fa', back: '#84d4d3', shoulders: '#fb923c', biceps: '#c084fc',
  triceps: '#f97316', legs: '#34d399', glutes: '#f472b6', core: '#93c5fd',
  hamstrings: '#10b981', quadriceps: '#facc15', calves: '#f87171', forearms: '#94a3b8',
  trapezius: '#a78bfa',
};

interface MuscleCard { muscle: string; sets: number; pct: number }

export default function MuscleVolumePage() {
  const [weeks, setWeeks] = useState(4);

  const { data, isLoading } = useSWR(
    ['muscle-volume', weeks],
    () => workoutsApi.getMyMuscleVolume(weeks),
  );

  const cards: MuscleCard[] = data?.cards ?? [];
  const maxSets = cards[0]?.sets ?? 1;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-1">Análise</div>
        <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">Volume Muscular</h1>
        <p className="text-xs text-zinc-500 mt-1">Distribuição de séries por grupo</p>
      </div>

      {/* ── Week selector ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        {WEEK_OPTIONS.map((w) => (
          <button
            key={w}
            onClick={() => setWeeks(w)}
            className={`font-bold text-xs px-4 py-2 rounded-xl transition-colors ${
              weeks === w
                ? 'text-black'
                : 'bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white'
            }`}
            style={weeks === w ? { background: '#c8f542' } : {}}
          >
            {w}sem
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-sm text-zinc-500 text-center">A calcular...</div>
      ) : !cards.length ? (
        <div className="py-20 text-sm text-zinc-500 text-center">Sem dados para o período seleccionado.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map((c, idx) => {
            const color = COLOR_MAP[c.muscle] ?? '#84d4d3';
            const label = MUSCLE_PT[c.muscle] ?? c.muscle;
            const barW = (c.sets / maxSets) * 100;
            return (
              <div key={c.muscle} className="bg-zinc-900 rounded-2xl px-4 py-3.5 border border-zinc-800/60">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-sm font-semibold text-white">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-[Manrope] font-black text-base text-white">{c.sets}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">séries</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-lg ml-1">Top</span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${barW}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
