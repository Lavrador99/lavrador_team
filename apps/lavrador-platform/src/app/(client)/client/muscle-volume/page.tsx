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

interface MuscleCard { muscle: string; sets: number; pct: number }

export default function MuscleVolumePage() {
  const [weeks, setWeeks] = useState(4);

  const { data, isLoading } = useSWR(
    ['muscle-volume', weeks],
    () => workoutsApi.getMyMuscleVolume(weeks),
  );

  const cards: MuscleCard[] = data?.cards ?? [];
  const maxSets = cards[0]?.sets ?? 1;

  const COLOR_MAP: Record<string, string> = {
    chest: '#42a5f5', back: '#c8f542', shoulders: '#f5a442', biceps: '#a855f7',
    triceps: '#ff8c5a', legs: '#34d399', glutes: '#f472b6', core: '#60a5fa',
    hamstrings: '#34d399', quadriceps: '#fbbf24', calves: '#fb7185', forearms: '#94a3b8',
    trapezius: '#a78bfa',
  };

  return (
    <div>
      <h1 className="font-syne font-black text-2xl text-white mb-2">Volume Muscular</h1>

      {/* Week selector */}
      <div className="flex gap-2 mb-6">
        {WEEK_OPTIONS.map((w) => (
          <button
            key={w}
            onClick={() => setWeeks(w)}
            className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              weeks === w
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted hover:border-muted hover:text-white'
            }`}
          >
            {w}sem
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 font-mono text-sm text-muted text-center">A calcular...</div>
      ) : !cards.length ? (
        <div className="py-20 font-mono text-sm text-muted text-center">Sem dados para o período seleccionado.</div>
      ) : (
        <>
          {/* Muscle cards with progress bar */}
          <div className="flex flex-col gap-3 mb-6">
            {cards.map((c) => {
              const color = COLOR_MAP[c.muscle] ?? '#888899';
              const label = MUSCLE_PT[c.muscle] ?? c.muscle;
              return (
                <div key={c.muscle} className="bg-panel border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-sm font-medium text-white">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-syne font-black text-sm" style={{ color }}>{c.sets}</span>
                      <span className="font-mono text-[10px] text-muted">séries</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1e1e28] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(c.sets / maxSets) * 100}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
