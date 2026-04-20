'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkoutDto, WorkoutBlock, WorkoutLogEntry, SetType } from '@libs/types';
import { workoutsApi } from '../../../../../../../lib/api/workouts.api';
import { cacheWorkout, getCachedWorkout, queuePendingLog, getPendingCount } from '../../../../../../../lib/db/workoutDb';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetState {
  reps: string;
  load: string;
  rpe: string;
  completed: boolean;
  setType: SetType;
}

type ExerciseKey = string; // `${blockId}_${exIdx}`
type BlockSets = Record<ExerciseKey, SetState[]>;

interface FlatExercise {
  blockId: string;
  blockType: string;
  blockLabel: string;
  exIdx: number;
  exerciseId?: string;
  exerciseName: string;
  sets: number;
  reps: string;
  load?: number;
  notes?: string;
  restAfterSet: number;
  restAfterBlock: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeKey(blockId: string, exIdx: number): ExerciseKey {
  return `${blockId}_${exIdx}`;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function flattenExercises(workout: WorkoutDto): FlatExercise[] {
  const flat: FlatExercise[] = [];
  for (const block of workout.blocks) {
    for (let i = 0; i < block.exercises.length; i++) {
      const ex = block.exercises[i];
      flat.push({
        blockId: block.id,
        blockType: block.type,
        blockLabel: block.label ?? block.type,
        exIdx: i,
        exerciseId: ex.exerciseId ?? ex.id,
        exerciseName: ex.exerciseName,
        sets: ex.sets,
        reps: ex.reps,
        load: ex.load,
        notes: ex.notes,
        restAfterSet: ex.restAfterSet ?? block.restBetweenSets ?? 60,
        restAfterBlock: block.restAfterBlock ?? 0,
      });
    }
  }
  return flat;
}

const SET_TYPE_OPTIONS: { value: SetType; label: string; cls: string }[] = [
  { value: 'NORMAL',  label: 'N', cls: 'text-zinc-400' },
  { value: 'WARMUP',  label: 'W', cls: 'text-blue-400' },
  { value: 'DROP',    label: 'D', cls: 'text-orange-400' },
  { value: 'FAILURE', label: 'F', cls: 'text-red-400' },
];

const darkInput = 'bg-zinc-800 border border-zinc-700/60 rounded-xl text-center text-sm text-white font-bold py-3 w-full focus:outline-none focus:border-[#84d4d3]/60 transition-colors';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidedWorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const router = useRouter();

  const [workout, setWorkout] = useState<WorkoutDto | null>(null);
  const [flat, setFlat] = useState<FlatExercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sets, setSets] = useState<BlockSets>({});
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [timer, setTimer] = useState(0);
  const [startedAt] = useState(Date.now());
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restMax, setRestMax] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [lastLog, setLastLog] = useState<{ entries: { exerciseId?: string; exerciseName: string; sets: { reps: number; load?: number }[] }[] } | null>(null);

  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);
  const restSoundCtxRef = useRef<AudioContext | null>(null);

  // ── Load workout ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const w = await workoutsApi.getById(workoutId);
        setWorkout(w);
        await cacheWorkout(w);
        workoutsApi.getLastLog(workoutId).then(setLastLog).catch(() => {});
      } catch {
        const cached = await getCachedWorkout(workoutId);
        if (cached) { setWorkout(cached); setOffline(true); }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workoutId]);

  // ── Flatten exercises and init sets ────────────────────────────────────────

  useEffect(() => {
    if (!workout) return;
    const exercises = flattenExercises(workout);
    setFlat(exercises);

    const init: BlockSets = {};
    for (const ex of exercises) {
      const key = makeKey(ex.blockId, ex.exIdx);
      init[key] = Array.from({ length: ex.sets }, () => ({
        reps: ex.reps?.replace(/[^0-9]/g, '') || '',
        load: ex.load ? String(ex.load) : '',
        rpe: '',
        completed: false,
        setType: 'NORMAL',
      }));
    }
    setSets(init);
  }, [workout]);

  // ── Timer ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Online/offline ──────────────────────────────────────────────────────────

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function releaseWakeLock() {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }

  function startRestTimer(seconds: number) {
    if (restRef.current) clearInterval(restRef.current);
    setRestMax(seconds);
    setRestTimer(seconds);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
    if ('wakeLock' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).wakeLock.request('screen').then((lock: any) => { wakeLockRef.current = lock; }).catch(() => {});
    }
    restRef.current = setInterval(() => {
      setRestTimer((t) => {
        if (t === null || t <= 1) {
          clearInterval(restRef.current!);
          releaseWakeLock();
          if (typeof navigator.vibrate === 'function') navigator.vibrate([300, 100, 300]);
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

  function toggleSet(key: string, setIdx: number, restSeconds: number) {
    setSets((prev) => {
      const next = { ...prev };
      const arr = [...(next[key] ?? [])];
      const nowCompleted = !arr[setIdx].completed;
      arr[setIdx] = { ...arr[setIdx], completed: nowCompleted };
      next[key] = arr;
      if (nowCompleted) {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
        startRestTimer(restSeconds);
      }
      return next;
    });
  }

  function getPrevSets(ex: FlatExercise) {
    if (!lastLog) return null;
    return lastLog.entries.find(
      (e) => (ex.exerciseId && e.exerciseId === ex.exerciseId) || e.exerciseName === ex.exerciseName,
    )?.sets ?? null;
  }

  // ── Build log entries ───────────────────────────────────────────────────────

  const buildEntries = useCallback((): WorkoutLogEntry[] => {
    if (!workout) return [];
    const entries: WorkoutLogEntry[] = [];
    for (const ex of flat) {
      const key = makeKey(ex.blockId, ex.exIdx);
      const blockSets = sets[key] ?? [];
      if (blockSets.some((s) => s.completed)) {
        entries.push({
          blockId: ex.blockId,
          exerciseId: ex.exerciseId,
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
    return entries;
  }, [workout, flat, sets]);

  // ── Finish ──────────────────────────────────────────────────────────────────

  async function handleFinish() {
    if (!workout) return;
    const entries = buildEntries();
    const durationMin = Math.round((Date.now() - startedAt) / 60000);
    const log = { workoutId: workout.id, entries, durationMin, date: new Date().toISOString() };

    releaseWakeLock();
    setSubmitting(true);
    try {
      if (offline || !entries.length) {
        if (entries.length) await queuePendingLog(log, `${workout.id}_${Date.now()}`);
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

  // ── Navigation ──────────────────────────────────────────────────────────────

  const isFirst = currentIdx === 0;
  const isLast  = currentIdx === flat.length - 1;

  function goNext() {
    if (isLast) return;
    setCurrentIdx((i) => i + 1);
    setRestTimer(null);
    if (restRef.current) clearInterval(restRef.current);
  }

  function goPrev() {
    if (isFirst) return;
    setCurrentIdx((i) => i - 1);
    setRestTimer(null);
    if (restRef.current) clearInterval(restRef.current);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-sm text-zinc-500">A carregar treino...</div>;
  }
  if (!workout || flat.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-sm text-red-400">Treino não encontrado.</div>;
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #005050, #003535)' }}>
            <span className="material-symbols-outlined text-[#c8f542] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-[Manrope] font-black text-3xl text-white mb-2">Sessão concluída!</h2>
          <p className="text-sm text-zinc-500 mb-8">{formatTime(Math.round((Date.now() - startedAt) / 1000))} de treino</p>
          <button onClick={() => router.push('/client/my-plan')}
            className="w-full font-[Manrope] font-bold text-sm py-4 rounded-2xl text-black active:scale-95 transition-all"
            style={{ background: '#c8f542' }}>
            Voltar ao plano
          </button>
        </div>
      </div>
    );
  }

  const current = flat[currentIdx];
  const key = makeKey(current.blockId, current.exIdx);
  const exSets = sets[key] ?? [];
  const completedSets = exSets.filter((s) => s.completed).length;
  const allDone = completedSets === exSets.length && exSets.length > 0;
  const prevSets = getPrevSets(current);

  const totalExercises = flat.length;
  const totalCompleted = flat.filter((ex) => {
    const k = makeKey(ex.blockId, ex.exIdx);
    const s = sets[k] ?? [];
    return s.length > 0 && s.every((st) => st.completed);
  }).length;
  const progressPct = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col pb-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">arrow_back</span>
          </button>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{workout.name}</div>
            <div className="font-[Manrope] font-black text-xl text-white tabular-nums">{formatTime(timer)}</div>
          </div>
          {offline && (
            <span className="text-[10px] font-bold uppercase text-orange-400 bg-orange-400/10 px-2 py-1 rounded-lg">offline</span>
          )}
          {!offline && <div className="w-9" />}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: '#84d4d3' }} />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 tabular-nums">{currentIdx + 1}/{totalExercises}</span>
        </div>
      </div>

      {/* ── Exercise card ───────────────────────────────────────────────────── */}
      <div className="flex-1 px-4">

        {/* Block badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 bg-zinc-800/80 px-2.5 py-1 rounded-lg">
            {current.blockLabel}
          </span>
        </div>

        {/* Exercise name */}
        <div className={`rounded-2xl border p-5 mb-4 ${allDone ? 'border-[#84d4d3]/30 bg-[#005050]/10' : 'border-zinc-800/60 bg-zinc-900'}`}>
          <div className={`font-[Manrope] font-black text-2xl mb-1 ${allDone ? 'text-[#84d4d3]' : 'text-white'}`}>
            {current.exerciseName}
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-[11px] font-bold uppercase text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg">
              {current.sets}× {current.reps}
            </span>
            {current.load && (
              <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">
                {current.load} kg referência
              </span>
            )}
            <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">
              {current.restAfterSet}s descanso
            </span>
          </div>
          {current.notes && (
            <div className="text-[11px] text-zinc-400 italic border-t border-zinc-800/60 pt-2">{current.notes}</div>
          )}

          {/* Previous session */}
          {prevSets && prevSets.length > 0 && (
            <div className="border-t border-zinc-800/60 pt-2 mt-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Sessão anterior</div>
              <div className="flex flex-wrap gap-1.5">
                {prevSets.map((s, i) => (
                  <span key={i} className="text-[11px] text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg tabular-nums">
                    {s.reps}r{s.load ? ` × ${s.load}kg` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sets */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-[28px_44px_1fr_1fr_44px_40px] gap-2 px-1">
            {['T', '#', 'Reps', 'Kg', 'RPE', ''].map((h, i) => (
              <div key={i} className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-center">{h}</div>
            ))}
          </div>

          {exSets.map((set, sIdx) => {
            const typeOption = SET_TYPE_OPTIONS.find((o) => o.value === set.setType);
            return (
              <div key={sIdx}
                className={`grid grid-cols-[28px_44px_1fr_1fr_44px_40px] gap-2 items-center transition-opacity ${set.completed ? 'opacity-100' : 'opacity-60'}`}>

                <div className="flex justify-center">
                  <select
                    value={set.setType}
                    onChange={(e) => updateSet(key, sIdx, 'setType', e.target.value as SetType)}
                    className={`bg-transparent border-0 text-[10px] font-bold text-center outline-none w-7 cursor-pointer ${typeOption?.cls ?? 'text-zinc-400'}`}
                  >
                    {SET_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <span className="text-sm font-bold text-zinc-400">{sIdx + 1}</span>
                </div>

                <input type="number" value={set.reps}
                  onChange={(e) => updateSet(key, sIdx, 'reps', e.target.value)}
                  className={darkInput} placeholder="—" min={0} />

                <input type="number" value={set.load}
                  onChange={(e) => updateSet(key, sIdx, 'load', e.target.value)}
                  className={darkInput} placeholder="—" min={0} step={0.5} />

                <input type="number" value={set.rpe}
                  onChange={(e) => updateSet(key, sIdx, 'rpe', e.target.value)}
                  className={darkInput} placeholder="—" min={1} max={10} />

                <button
                  onClick={() => toggleSet(key, sIdx, current.restAfterSet)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                    set.completed ? 'bg-[#005050] border border-[#84d4d3]/30' : 'bg-zinc-800 border border-zinc-700/60'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-base ${set.completed ? 'text-[#84d4d3]' : 'text-zinc-600'}`}
                    style={{ fontVariationSettings: set.completed ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {set.completed ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Rest timer */}
        {restTimer !== null && (
          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900 px-5 py-4 mb-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#84d4d3] mb-1">Descanso</div>
              <div className="font-[Manrope] font-black text-4xl text-white tabular-nums">{restTimer}s</div>
              <div className="mt-2 bg-zinc-800 rounded-full h-1 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${((restMax - restTimer) / restMax) * 100}%`, background: '#84d4d3' }} />
              </div>
            </div>
            <button
              onClick={() => { setRestTimer(null); if (restRef.current) clearInterval(restRef.current); releaseWakeLock(); }}
              className="text-xs font-bold rounded-xl px-4 py-2.5 text-zinc-300 bg-zinc-800"
            >
              Pular
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation footer ───────────────────────────────────────────────── */}
      <div className="px-4 flex gap-3">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex-1 py-4 rounded-2xl font-[Manrope] font-bold text-sm text-zinc-300 bg-zinc-800 border border-zinc-700/60 disabled:opacity-30 active:scale-95 transition-all"
        >
          ← Anterior
        </button>

        {isLast ? (
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="flex-2 flex-grow-[2] py-4 rounded-2xl font-[Manrope] font-bold text-sm text-black active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#c8f542' }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
            {submitting ? 'A guardar...' : 'Terminar treino'}
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex-2 flex-grow-[2] py-4 rounded-2xl font-[Manrope] font-bold text-sm text-black active:scale-95 transition-all"
            style={{ background: allDone ? '#c8f542' : '#1a1a2e', color: allDone ? 'black' : '#84d4d3', border: allDone ? 'none' : '1px solid rgba(132,212,211,0.3)' }}
          >
            {allDone ? 'Próximo →' : 'Avançar →'}
          </button>
        )}
      </div>
    </div>
  );
}
