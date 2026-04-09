'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkoutDto, WorkoutBlock, WorkoutLogEntry, SetType } from '@libs/types';
import { workoutsApi } from '../../../../../../lib/api/workouts.api';
import { cacheWorkout, getCachedWorkout, queuePendingLog, flushPendingLogs } from '../../../../../../lib/db/workoutDb';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SetState {
  reps: string;
  load: string;
  rpe: string;
  completed: boolean;
  setType: SetType;
}

type BlockSets = Record<string, SetState[]>; // blockId+exIdx → sets

const SET_TYPE_OPTIONS: { value: SetType; label: string; color: string }[] = [
  { value: 'NORMAL',  label: 'N', color: '#888899' },
  { value: 'WARMUP',  label: 'W', color: '#42a5f5' },
  { value: 'DROP',    label: 'D', color: '#f5a442' },
  { value: 'FAILURE', label: 'F', color: '#ff6b6b' },
];

function calc1RM(load: string, reps: string): number | null {
  const l = parseFloat(load), r = parseInt(reps);
  if (!l || !r || r < 2) return null;
  return Math.round(l * (1 + r / 30));
}

function makeKey(blockId: string, exIdx: number) {
  return `${blockId}_${exIdx}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutLoggerPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const router = useRouter();

  const [workout, setWorkout] = useState<WorkoutDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [sets, setSets] = useState<BlockSets>({});
  const [startedAt] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [newPRs, setNewPRs] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load workout (online → cache, offline → cached) ───────────────────────
  useEffect(() => {
    async function load() {
      try {
        const w = await workoutsApi.getById(workoutId);
        setWorkout(w);
        await cacheWorkout(w);
      } catch {
        const cached = await getCachedWorkout(workoutId);
        if (cached) { setWorkout(cached); setOffline(true); }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workoutId]);

  // ── Flush pending logs when back online ───────────────────────────────────
  useEffect(() => {
    function onOnline() {
      setOffline(false);
      flushPendingLogs(async (log) => { await workoutsApi.createLog(log); }).catch(() => {});
    }
    function onOffline() { setOffline(true); }
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── Workout elapsed timer ─────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Init sets state from workout ──────────────────────────────────────────
  useEffect(() => {
    if (!workout) return;
    const init: BlockSets = {};
    for (const block of workout.blocks) {
      for (let i = 0; i < block.exercises.length; i++) {
        const ex = block.exercises[i];
        const key = makeKey(block.id, i);
        init[key] = Array.from({ length: ex.sets }, () => ({
          reps: ex.reps?.replace(/[^0-9]/g, '') || '',
          load: ex.load ? String(ex.load) : '',
          rpe: '',
          completed: false,
          setType: 'NORMAL',
        }));
      }
    }
    setSets(init);
  }, [workout]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function startRestTimer(seconds: number) {
    if (restRef.current) clearInterval(restRef.current);
    setRestTimer(seconds);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
    restRef.current = setInterval(() => {
      setRestTimer((t) => {
        if (t === null || t <= 1) {
          clearInterval(restRef.current!);
          if (typeof navigator.vibrate === 'function') navigator.vibrate([100, 50, 100]);
          return null;
        }
        return t - 1;
      });
    }, 1000);
  }

  function updateSet(key: string, setIdx: number, field: keyof SetState, value: SetState[keyof SetState]) {
    setSets((prev) => {
      const next = { ...prev };
      const arr = [...(next[key] ?? [])];
      arr[setIdx] = { ...arr[setIdx], [field]: value };
      next[key] = arr;
      return next;
    });
  }

  function toggleComplete(block: WorkoutBlock, exIdx: number, setIdx: number) {
    const key = makeKey(block.id, exIdx);
    const set = sets[key]?.[setIdx];
    if (!set) return;
    const nowCompleted = !set.completed;
    updateSet(key, setIdx, 'completed', nowCompleted);
    if (nowCompleted) {
      if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
      const rest = block.exercises[exIdx].restAfterSet ?? block.restBetweenSets ?? 0;
      if (rest > 0) startRestTimer(rest);
    }
  }

  const buildEntries = useCallback((): WorkoutLogEntry[] => {
    if (!workout) return [];
    const entries: WorkoutLogEntry[] = [];
    for (const block of workout.blocks) {
      for (let i = 0; i < block.exercises.length; i++) {
        const ex = block.exercises[i];
        const key = makeKey(block.id, i);
        const blockSets = sets[key] ?? [];
        if (blockSets.some((s) => s.completed)) {
          entries.push({
            blockId: block.id,
            exerciseId: ex.exerciseId ?? ex.id,
            exerciseName: ex.exerciseName,
            sets: blockSets
              .filter((s) => s.completed)
              .map((s, idx) => ({
                setNumber: idx + 1,
                reps: parseInt(s.reps) || 0,
                load: s.load ? parseFloat(s.load) : undefined,
                rpe: s.rpe ? parseFloat(s.rpe) : undefined,
                completed: true,
                setType: s.setType,
              })),
          });
        }
      }
    }
    return entries;
  }, [workout, sets]);

  async function handleFinish() {
    if (!workout) return;
    const entries = buildEntries();
    if (!entries.length) { router.back(); return; }

    // Compute new PRs (Epley)
    const prs: Record<string, number> = {};
    for (const entry of entries) {
      let best = 0;
      for (const s of entry.sets) {
        const est = s.load && s.reps >= 2 ? Math.round(s.load * (1 + s.reps / 30)) : 0;
        if (est > best) best = est;
      }
      if (best > 0) prs[entry.exerciseName] = best;
    }
    setNewPRs(prs);

    const durationMin = Math.round((Date.now() - startedAt) / 60000);
    const log = {
      workoutId: workout.id,
      entries,
      durationMin,
      date: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (offline) {
        await queuePendingLog(log, `${workout.id}_${Date.now()}`);
      } else {
        await workoutsApi.createLog(log);
      }
      setDone(true);
    } catch {
      await queuePendingLog(log, `${workout.id}_${Date.now()}`);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    const prList = Object.entries(newPRs);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="font-syne font-black text-2xl text-accent mb-2">Treino concluído!</h2>
          <p className="font-mono text-xs text-muted mb-6">
            {offline ? 'Guardado localmente. Será sincronizado quando tiveres ligação.' : 'Registado com sucesso.'}
          </p>
          {prList.length > 0 && (
            <div className="bg-panel border border-border rounded-xl p-4 mb-6 text-left">
              <div className="font-mono text-[10px] text-accent tracking-widest uppercase mb-3">Novos PRs estimados</div>
              {prList.map(([name, rm]) => (
                <div key={name} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                  <span className="font-sans text-sm text-white">{name}</span>
                  <span className="font-syne font-black text-accent text-sm">~{rm} kg</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/client/my-plan')}
            className="w-full bg-accent text-dark font-syne font-black text-sm py-3 rounded-xl"
          >
            Voltar ao plano
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="py-20 font-mono text-sm text-muted text-center">A carregar treino...</div>;
  }
  if (!workout) {
    return <div className="py-20 font-mono text-sm text-red-400 text-center">Treino não encontrado.</div>;
  }

  return (
    <div className="relative pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-black text-xl text-white">{workout.name}</h1>
          <div className="font-mono text-xs text-muted mt-0.5">{formatTime(timer)}</div>
        </div>
        <div className="flex items-center gap-2">
          {offline && (
            <span className="font-mono text-[10px] text-orange-400 border border-orange-400/30 bg-orange-400/5 px-2 py-0.5 rounded">offline</span>
          )}
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="bg-accent text-dark font-syne font-black text-xs px-5 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {submitting ? '...' : 'Concluir'}
          </button>
        </div>
      </div>

      {/* Rest timer banner */}
      {restTimer !== null && (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="bg-panel border border-border rounded-2xl px-6 py-3 flex items-center gap-4 pointer-events-auto shadow-xl">
            <span className="font-mono text-sm text-accent font-bold">Descanso {restTimer}s</span>
            <button
              onClick={() => { setRestTimer(null); if (restRef.current) clearInterval(restRef.current); }}
              className="font-mono text-[10px] text-muted hover:text-white transition-colors"
            >
              pular
            </button>
          </div>
        </div>
      )}

      {/* Blocks */}
      {workout.blocks.map((block) => (
        <div key={block.id} className="mb-6">
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-3">{block.type}</div>
          {block.exercises.map((ex, exIdx) => {
            const key = makeKey(block.id, exIdx);
            const exSets = sets[key] ?? [];
            return (
              <div key={ex.id} className="bg-panel border border-border rounded-xl mb-3 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="font-sans font-semibold text-sm text-white">{ex.exerciseName}</div>
                    {ex.notes && <div className="font-mono text-[10px] text-faint mt-0.5">{ex.notes}</div>}
                  </div>
                  <div className="font-mono text-xs text-muted">{ex.sets}× {ex.reps}</div>
                </div>

                {/* Set rows */}
                <div className="px-4 py-3 space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[28px_1fr_80px_80px_44px_44px] gap-1 mb-1">
                    {['Tipo', 'Série', 'Reps', 'Carga', 'RPE', ''].map((h, i) => (
                      <div key={i} className="font-mono text-[9px] text-faint tracking-widest uppercase text-center first:col-span-1">{h}</div>
                    ))}
                  </div>
                  {exSets.map((set, sIdx) => {
                    const rm = set.completed ? calc1RM(set.load, set.reps) : null;
                    return (
                      <div
                        key={sIdx}
                        className={`grid grid-cols-[28px_1fr_80px_80px_44px_44px] gap-1 items-center transition-opacity ${set.completed ? 'opacity-100' : 'opacity-70'}`}
                      >
                        {/* Type toggle */}
                        <div className="flex justify-center">
                          <select
                            value={set.setType}
                            onChange={(e) => updateSet(key, sIdx, 'setType', e.target.value as SetType)}
                            className="bg-transparent border-0 text-[10px] font-mono text-center outline-none w-7 cursor-pointer"
                            style={{ color: SET_TYPE_OPTIONS.find(o => o.value === set.setType)?.color ?? '#888899' }}
                          >
                            {SET_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value} style={{ color: o.color, background: '#111118' }}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Set number + 1RM badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-muted w-5 text-center">{sIdx + 1}</span>
                          {rm && <span className="font-mono text-[9px] text-accent bg-accent/10 border border-accent/20 rounded px-1">~{rm}kg</span>}
                        </div>

                        {/* Reps */}
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(key, sIdx, 'reps', e.target.value)}
                          className="bg-[#0d0d13] border border-border rounded-lg text-center text-sm text-white font-mono py-1.5 w-full focus:outline-none focus:border-accent"
                          placeholder="reps"
                          min={0}
                        />

                        {/* Load */}
                        <input
                          type="number"
                          value={set.load}
                          onChange={(e) => updateSet(key, sIdx, 'load', e.target.value)}
                          className="bg-[#0d0d13] border border-border rounded-lg text-center text-sm text-white font-mono py-1.5 w-full focus:outline-none focus:border-accent"
                          placeholder="kg"
                          min={0}
                          step={0.5}
                        />

                        {/* RPE */}
                        <input
                          type="number"
                          value={set.rpe}
                          onChange={(e) => updateSet(key, sIdx, 'rpe', e.target.value)}
                          className="bg-[#0d0d13] border border-border rounded-lg text-center text-sm text-white font-mono py-1.5 w-full focus:outline-none focus:border-accent"
                          placeholder="—"
                          min={1}
                          max={10}
                        />

                        {/* Complete button */}
                        <button
                          onClick={() => toggleComplete(block, exIdx, sIdx)}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                            set.completed
                              ? 'bg-accent border-accent text-dark font-black text-base'
                              : 'border-border text-faint hover:border-muted'
                          }`}
                        >
                          {set.completed ? '✓' : '○'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Finish button at bottom */}
      <div className="fixed bottom-24 right-4 z-30">
        <button
          onClick={handleFinish}
          disabled={submitting}
          className="bg-accent text-dark font-syne font-black text-sm px-6 py-3 rounded-2xl shadow-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {submitting ? '...' : 'Concluir treino'}
        </button>
      </div>
    </div>
  );
}
