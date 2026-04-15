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

  if (isLoading) return <div className="py-20 text-sm text-zinc-500 text-center">A carregar histórico...</div>;

  const best1RM = history.length ? Math.max(...history.map((e) => e.estimated1RM ?? 0)) : 0;
  const bestLoad = history.length ? Math.max(...history.map((e) => e.maxLoad ?? 0)) : 0;
  const totalVol = history.reduce((s, e) => s + e.volume, 0);

  const summary = [
    { label: 'Sessões',      value: String(history.length),                     color: 'text-blue-400' },
    { label: 'Melhor 1RM',   value: best1RM ? `${best1RM} kg`   : '—',          color: 'text-[#84d4d3]' },
    { label: 'Melhor carga', value: bestLoad ? `${bestLoad} kg` : '—',          color: 'text-orange-400' },
    { label: 'Vol. total',   value: `${totalVol.toLocaleString('pt-PT')} kg`,   color: 'text-purple-400' },
  ];

  return (
    <div>
      {/* ── Back ──────────────────────────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-white transition-colors mb-5"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Voltar
      </button>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Histórico</div>
        <h1 className="font-[Manrope] font-black text-xl text-white leading-tight">{name}</h1>
      </div>

      {!history.length ? (
        <div className="py-20 text-sm text-zinc-500 text-center">Sem dados de histórico.</div>
      ) : (
        <>
          {/* ── Summary cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {summary.map(({ label, value, color }) => (
              <div key={label} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/60">
                <div className={`font-[Manrope] font-black text-xl ${color}`}>{value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* ── 1RM bar chart ────────────────────────────────────────────────── */}
          {history.some((e) => e.estimated1RM) && (
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/60 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Progressão 1RM estimado</p>
              <div className="flex items-end gap-1 h-16">
                {history.slice(-10).map((e, i) => {
                  const h = e.estimated1RM ? (e.estimated1RM / best1RM) * 100 : 4;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{ height: `${h}%`, background: '#84d4d3', opacity: 0.4 + (i / 10) * 0.6 }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Session history ──────────────────────────────────────────────── */}
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">Sessões</div>
          <div className="flex flex-col gap-2">
            {[...history].reverse().map((e, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800/60 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-zinc-500">
                    {new Date(e.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  {e.maxLoad && (
                    <div className="text-sm text-white mt-0.5 font-semibold">{e.maxLoad} kg</div>
                  )}
                </div>
                <div className="text-right">
                  {e.estimated1RM && (
                    <div className="font-[Manrope] font-black text-[#84d4d3] text-sm">~{e.estimated1RM} kg 1RM</div>
                  )}
                  <div className="text-xs text-zinc-600 mt-0.5">{e.totalReps} reps · {e.volume.toLocaleString()} vol</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
