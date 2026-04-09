'use client';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { workoutsApi } from '../../../../../lib/api/workouts.api';

interface RawEntry {
  date: string;
  sets: { setNumber: number; reps: number; load?: number; rpe?: number; completed: boolean }[];
}

interface ComputedEntry {
  date: string;
  maxLoad: number | null;
  totalReps: number;
  estimated1RM: number | null;
  volume: number;
}

function processEntries(raw: RawEntry[]): ComputedEntry[] {
  return raw.map((e) => {
    const completedSets = e.sets.filter((s) => s.completed);
    let maxLoad: number | null = null;
    let best1RM: number | null = null;
    let totalReps = 0;
    let volume = 0;
    for (const s of completedSets) {
      totalReps += s.reps;
      if (s.load) {
        volume += s.load * s.reps;
        if (maxLoad === null || s.load > maxLoad) maxLoad = s.load;
        if (s.reps >= 2) {
          const rm = Math.round(s.load * (1 + s.reps / 30));
          if (best1RM === null || rm > best1RM) best1RM = rm;
        }
      }
    }
    return { date: e.date, maxLoad, totalReps, estimated1RM: best1RM, volume: Math.round(volume) };
  });
}

export default function ExerciseHistoryPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const router = useRouter();
  const name = decodeURIComponent(exerciseId);

  const { data: rawHistory = [], isLoading } = useSWR<RawEntry[]>(
    ['exercise-history', name],
    () => workoutsApi.getMyExerciseHistory(exerciseId),
  );

  const history = processEntries(rawHistory);

  if (isLoading) {
    return <div className="py-20 font-mono text-sm text-muted text-center">A carregar histórico...</div>;
  }

  return (
    <div>
      <button onClick={() => router.back()} className="font-mono text-xs text-muted mb-4 flex items-center gap-1 hover:text-white transition-colors">
        ← Voltar
      </button>
      <h1 className="font-syne font-black text-xl text-white mb-1">{name}</h1>
      <p className="font-mono text-xs text-muted mb-6">// Histórico de desempenho</p>

      {!history.length ? (
        <div className="py-20 font-mono text-sm text-muted text-center">Sem dados de histórico.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Sessões', val: String(history.length), color: '#42a5f5' },
              {
                label: 'Melhor 1RM est.',
                val: Math.max(...history.map((e) => e.estimated1RM ?? 0)) + ' kg',
                color: '#c8f542',
              },
              {
                label: 'Melhor carga',
                val: Math.max(...history.map((e) => e.maxLoad ?? 0)) + ' kg',
                color: '#f5a442',
              },
              {
                label: 'Volume total',
                val: history.reduce((s, e) => s + e.volume, 0).toLocaleString('pt-PT') + ' kg',
                color: '#a855f7',
              },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-panel border border-border rounded-xl p-4" style={{ borderTopColor: color, borderTopWidth: 2 }}>
                <div className="font-syne font-black text-xl" style={{ color }}>{val}</div>
                <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* History table */}
          <h2 className="font-syne font-bold text-sm text-white mb-3">Histórico de sessões</h2>
          <div className="flex flex-col gap-2">
            {[...history].reverse().map((e, i) => (
              <div key={i} className="bg-panel border border-border rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-mono text-xs text-muted">
                    {new Date(e.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  {e.maxLoad && (
                    <div className="font-sans text-sm text-white mt-0.5">{e.maxLoad} kg</div>
                  )}
                </div>
                <div className="text-right">
                  {e.estimated1RM && (
                    <div className="font-syne font-black text-accent text-sm">~{e.estimated1RM} kg 1RM</div>
                  )}
                  <div className="font-mono text-[10px] text-muted">{e.totalReps} reps · {e.volume} vol</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
