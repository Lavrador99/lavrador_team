'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkoutDto, WorkoutBlock, WorkoutLogEntry, SetType, ExerciseDto } from '@libs/types';
import { workoutsApi } from '../../../../../../lib/api/workouts.api';
import { exercisesApi } from '../../../../../../lib/api/exercises.api';
import { cacheWorkout, getCachedWorkout, queuePendingLog, flushPendingLogs, getPendingCount } from '../../../../../../lib/db/workoutDb';
import { QuickSubstituteModal } from '../../../../../../components/workout/QuickSubstituteModal';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SetState {
  reps: string;
  load: string;
  rpe: string;
  completed: boolean;
  setType: SetType;
}

type BlockSets = Record<string, SetState[]>;

const SET_TYPE_OPTIONS: { value: SetType; label: string; cls: string }[] = [
  { value: 'NORMAL',  label: 'N', cls: 'text-zinc-400' },
  { value: 'WARMUP',  label: 'W', cls: 'text-blue-400' },
  { value: 'DROP',    label: 'D', cls: 'text-orange-400' },
  { value: 'FAILURE', label: 'F', cls: 'text-red-400' },
];

const QUOTES = [
  '"A distância entre quem és e quem queres ser é o que fazes."',
  '"Consistência é a ponte entre os objetivos e a realidade."',
  '"Cada série conta. Cada repetição importa."',
  '"O progresso acontece fora da zona de conforto."',
];

function calc1RM(load: string, reps: string): number | null {
  const l = parseFloat(load), r = parseInt(reps);
  if (!l || !r || r < 2) return null;
  return Math.round(l * (1 + r / 30));
}

function makeKey(blockId: string, exIdx: number) {
  return `${blockId}_${exIdx}`;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ─── Dark Input ────────────────────────────────────────────────────────────────

const darkInput = 'bg-zinc-800 border border-zinc-700/60 rounded-xl text-center text-sm text-white font-bold py-2 w-full focus:outline-none focus:border-[#84d4d3]/60 transition-colors';

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
  const [restMax, setRestMax] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [newPRs, setNewPRs] = useState<Record<string, number>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [showExercises, setShowExercises] = useState(false);
  const [exList, setExList] = useState<ExerciseDto[]>([]);
  const [exSearch, setExSearch] = useState('');
  const [exLoading, setExLoading] = useState(false);
  const [restSoundActive, setRestSoundActive] = useState(false);
  const [substituteTarget, setSubstituteTarget] = useState<{ blockId: string; exIdx: number; exerciseId: string; exerciseName: string } | null>(null);
  const [lastLog, setLastLog] = useState<{
    date: string;
    entries: { exerciseId?: string; exerciseName: string; sets: { reps: number; load?: number }[] }[];
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);
  const restTimerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restSoundCtxRef = useRef<any>(null);
  const restSoundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  function stopRestSound() {
    if (restSoundCtxRef.current) {
      restSoundCtxRef.current.close().catch(() => {});
      restSoundCtxRef.current = null;
    }
    if (restSoundTimeoutRef.current) {
      clearTimeout(restSoundTimeoutRef.current);
      restSoundTimeoutRef.current = null;
    }
    setRestSoundActive(false);
  }

  function playRestEndAlert() {
    stopRestSound();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      restSoundCtxRef.current = ctx;
      setRestSoundActive(true);

      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate([300, 100, 300, 100, 500, 200, 300, 100, 300]);
      }

      // Aggressive repeating pattern for 10 seconds
      const playBeep = (freq: number, start: number, dur: number, vol = 0.7) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'square';
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.05);
      };

      // Pattern: 3 bursts per cycle, 10 cycles over ~10s
      for (let i = 0; i < 10; i++) {
        const t = i * 1.0;
        playBeep(880,  t,        0.12, 0.8);
        playBeep(1100, t + 0.18, 0.12, 0.7);
        playBeep(1320, t + 0.36, 0.22, 0.6);
      }

      // Auto-stop after 10s
      restSoundTimeoutRef.current = setTimeout(() => stopRestSound(), 10500);
    } catch { /* ignore */ }
  }

  async function openExercises() {
    setShowExercises(true);
    if (exList.length === 0) {
      setExLoading(true);
      try { setExList(await exercisesApi.getAll()); } catch { /* ignore */ }
      setExLoading(false);
    }
  }

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
        getPendingCount().then(setPendingCount).catch(() => {});
      }
    }
    load();
  }, [workoutId]);

  useEffect(() => {
    function onOnline() {
      setOffline(false);
      flushPendingLogs(async (log) => { await workoutsApi.createLog(log); })
        .then(() => getPendingCount().then(setPendingCount))
        .catch(() => {});
    }
    function onOffline() { setOffline(true); }
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => { restTimerRef.current = restTimer; }, [restTimer]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && restTimerRef.current !== null && !wakeLockRef.current) {
        if ('wakeLock' in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigator as any).wakeLock.request('screen')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((lock: any) => { wakeLockRef.current = lock; })
            .catch(() => {});
        }
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    if (!workout) return;
    const init: BlockSets = {};
    for (const block of workout.blocks) {
      for (let i = 0; i < block.exercises.length; i++) {
        const ex = block.exercises[i];
        const key = makeKey(block.id, i);
        init[key] = Array.from({ length: ex.sets }, () => ({
          reps: ex.reps?.match(/\d+/)?.[0] || '',
          load: ex.load ? String(ex.load) : '',
          rpe: '',
          completed: false,
          setType: 'NORMAL',
        }));
      }
    }
    setSets(init);
  }, [workout]);

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
      releaseWakeLock();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).wakeLock.request('screen')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((lock: any) => { wakeLockRef.current = lock; })
        .catch(() => {});
    }
    restRef.current = setInterval(() => {
      setRestTimer((t) => {
        if (t === null || t <= 1) {
          clearInterval(restRef.current!);
          releaseWakeLock();
          playRestEndAlert();
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
            muscleGroup: ex.muscleGroup,
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
    const log = { workoutId: workout.id, entries, durationMin, date: new Date().toISOString() };

    releaseWakeLock();
    stopRestSound();
    setSubmitting(true);
    try {
      if (offline) {
        await queuePendingLog(log, `${workout.id}_${Date.now()}`);
        setPendingCount(await getPendingCount());
      } else {
        await workoutsApi.createLog(log);
      }
      setDone(true);
    } catch {
      await queuePendingLog(log, `${workout.id}_${Date.now()}`);
      setPendingCount(await getPendingCount());
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    const prList = Object.entries(newPRs);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #005050, #003535)' }}>
            <span className="material-symbols-outlined text-[#c8f542] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-[Manrope] font-black text-3xl text-white mb-2">Sessão concluída!</h2>
          <p className="text-sm text-zinc-500 mb-2">{formatTime(Math.round((Date.now() - startedAt) / 1000))} de treino</p>
          <p className="text-xs text-zinc-600 mb-8">
            {offline ? 'Guardado localmente. Sincroniza quando tiveres ligação.' : 'Registado com sucesso.'}
          </p>

          {prList.length > 0 && (
            <div className="bg-zinc-900 rounded-2xl p-4 mb-6 text-left border border-zinc-800/60">
              <div className="flex items-center gap-2 text-yellow-400 mb-3">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Novos PRs estimados</span>
              </div>
              {prList.map(([name, rm]) => (
                <div key={name} className="flex justify-between items-center py-2.5 border-b border-zinc-800/60 last:border-0">
                  <span className="text-sm text-zinc-300">{name}</span>
                  <span className="font-[Manrope] font-black text-[#84d4d3] text-sm">~{rm} kg</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs italic text-zinc-600 mb-8">{quote}</div>

          <button
            onClick={() => router.push('/client/my-plan')}
            className="w-full font-[Manrope] font-bold text-sm py-4 rounded-2xl text-black active:scale-95 transition-all"
            style={{ background: '#c8f542' }}
          >
            Voltar ao plano
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-sm text-zinc-500">A carregar treino...</div>;
  }
  if (!workout) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-sm text-red-400">Treino não encontrado.</div>;
  }

  function handleSubstitute(alt: { exerciseId: string; name: string; muscleGroup?: string }) {
    if (!substituteTarget || !workout) return;
    const { blockId, exIdx } = substituteTarget;
    setWorkout((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const exercises = b.exercises.map((ex, i) => {
          if (i !== exIdx) return ex;
          return { ...ex, exerciseId: alt.exerciseId, exerciseName: alt.name, muscleGroup: alt.muscleGroup };
        });
        return { ...b, exercises };
      });
      return { ...prev, blocks };
    });
    setSubstituteTarget(null);
  }

  function getPrevSets(exerciseId: string | undefined, exerciseName: string) {
    if (!lastLog) return null;
    const entry = lastLog.entries.find(
      (e) => (exerciseId && e.exerciseId === exerciseId) || e.exerciseName === exerciseName,
    );
    return entry?.sets ?? null;
  }

  // Progress: completed sets / total sets
  const totalSets = workout.blocks.reduce((acc, b) => acc + b.exercises.reduce((a, e) => a + e.sets, 0), 0);
  const doneSets = Object.values(sets).reduce((acc, arr) => acc + arr.filter((s) => s.completed).length, 0);
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="relative pb-32 bg-[#0a0a0f] min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#0a0a0f]/95 backdrop-blur-sm pt-4 pb-3 mb-2">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{workout.dayLabel ?? 'Sessão de treino'}</div>
            <h1 className="font-[Manrope] font-black text-xl text-white mt-0.5 leading-tight">{workout.name}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {offline && (
              <span className="text-[10px] font-bold uppercase text-orange-400 bg-orange-400/10 px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">wifi_off</span>
                {pendingCount > 0 ? `${pendingCount}p` : 'offline'}
              </span>
            )}
            <button
              onClick={openExercises}
              className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center active:scale-90 transition-all"
              title="Ver exercícios"
            >
              <span className="material-symbols-outlined text-base text-zinc-300">exercise</span>
            </button>
            <div className="text-right">
              <div className="font-[Manrope] font-black text-xl text-white tabular-nums">{formatTime(timer)}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest">tempo</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#84d4d3' }} />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 tabular-nums w-8 text-right">{pct}%</span>
        </div>
      </div>

      {/* ── Rest timer ──────────────────────────────────────────────────────── */}
      {(restTimer !== null || restSoundActive) && (
        <div className="fixed bottom-28 left-4 right-4 z-40">
          <div className={`border rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xl ${restSoundActive && restTimer === null ? 'bg-[#002020] border-[#84d4d3]/40' : 'bg-zinc-900 border-zinc-700/60'}`}>
            <div className="flex-1">
              {restTimer !== null ? (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#84d4d3] mb-1">Descanso</div>
                  <div className="font-[Manrope] font-black text-4xl text-white tabular-nums">{restTimer}s</div>
                  <div className="mt-2 bg-zinc-800 rounded-full h-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${((restMax - restTimer) / restMax) * 100}%`, background: '#84d4d3' }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#c8f542] mb-1">Descanso terminado!</div>
                  <div className="font-[Manrope] font-black text-xl text-white">Hora de avançar 💪</div>
                </>
              )}
            </div>
            <button
              onClick={() => {
                setRestTimer(null);
                if (restRef.current) clearInterval(restRef.current);
                releaseWakeLock();
                stopRestSound();
              }}
              className={`text-xs font-bold rounded-xl px-4 py-2.5 transition-colors ${restSoundActive && restTimer === null ? 'text-black bg-[#c8f542]' : 'text-zinc-300 bg-zinc-800 hover:text-white'}`}
            >
              {restSoundActive && restTimer === null ? 'Fechar' : 'Pular'}
            </button>
          </div>
        </div>
      )}

      {/* ── Blocks ──────────────────────────────────────────────────────────── */}
      {workout.blocks.map((block) => (
        <div key={block.id} className="mb-5">
          {/* Block header */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-zinc-500">view_agenda</span>
              {block.label ?? block.type}
            </div>
            {block.restBetweenSets && (
              <div className="text-[10px] text-zinc-400 ml-auto">{block.restBetweenSets}s descanso</div>
            )}
          </div>

          {block.exercises.map((ex, exIdx) => {
            const key = makeKey(block.id, exIdx);
            const exSets = sets[key] ?? [];
            const completedCount = exSets.filter((s) => s.completed).length;
            const allDone = completedCount === exSets.length && exSets.length > 0;
            const prevSets = getPrevSets(ex.exerciseId ?? ex.id, ex.exerciseName);

            return (
              <div key={ex.id}
                className={`rounded-2xl mb-3 overflow-hidden border transition-all ${allDone ? 'border-[#84d4d3]/20 bg-[#005050]/10' : 'border-zinc-800/60 bg-zinc-900'}`}>

                {/* Exercise header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${allDone ? 'text-[#84d4d3]' : 'text-white'}`}>
                      {ex.exerciseName}
                    </div>
                    {ex.notes && <div className="text-[11px] text-zinc-400 mt-0.5 italic truncate">{ex.notes}</div>}
                    {prevSets && prevSets.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">anterior:</span>
                        {prevSets.slice(0, 4).map((s, i) => (
                          <span key={i} className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded-md tabular-nums">
                            {s.reps}r{s.load ? ` × ${s.load}kg` : ''}
                          </span>
                        ))}
                        {prevSets.length > 4 && (
                          <span className="text-[9px] text-zinc-600">+{prevSets.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-[10px] font-bold uppercase text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg">
                      {ex.sets}× {ex.reps}
                    </span>
                    {!allDone && (
                      <button
                        onClick={() => setSubstituteTarget({ blockId: block.id, exIdx, exerciseId: ex.exerciseId ?? ex.id, exerciseName: ex.exerciseName })}
                        className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center active:scale-90 transition-all"
                        title="Substituir exercício"
                      >
                        <span className="material-symbols-outlined text-sm text-zinc-400">swap_horiz</span>
                      </button>
                    )}
                    {allDone && (
                      <span className="material-symbols-outlined text-[#84d4d3] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                </div>

                {/* Sets */}
                <div className="px-4 pb-4 space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-[24px_40px_1fr_1fr_40px_36px] gap-1.5 mb-1.5">
                    {['T', '#', 'Reps', 'Kg', 'RPE', ''].map((h, i) => (
                      <div key={i} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-center">{h}</div>
                    ))}
                  </div>

                  {exSets.map((set, sIdx) => {
                    const rm = set.completed ? calc1RM(set.load, set.reps) : null;
                    const typeOption = SET_TYPE_OPTIONS.find(o => o.value === set.setType);
                    return (
                      <div key={sIdx}
                        className={`grid grid-cols-[24px_40px_1fr_1fr_40px_36px] gap-1.5 items-center transition-opacity ${set.completed ? 'opacity-100' : 'opacity-50'}`}>

                        {/* Type */}
                        <div className="flex justify-center">
                          <select
                            value={set.setType}
                            onChange={(e) => updateSet(key, sIdx, 'setType', e.target.value as SetType)}
                            className={`bg-transparent border-0 text-[10px] font-bold text-center outline-none w-6 cursor-pointer ${typeOption?.cls ?? 'text-zinc-400'}`}
                          >
                            {SET_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Number + 1RM */}
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[11px] font-bold text-zinc-400">{sIdx + 1}</span>
                          {rm && <span className="text-[9px] text-[#84d4d3] leading-none">~{rm}</span>}
                        </div>

                        {/* Reps */}
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(key, sIdx, 'reps', e.target.value)}
                          className={darkInput}
                          placeholder="—"
                          min={0}
                        />

                        {/* Load */}
                        <input
                          type="number"
                          value={set.load}
                          onChange={(e) => updateSet(key, sIdx, 'load', e.target.value)}
                          className={darkInput}
                          placeholder="—"
                          min={0}
                          step={0.5}
                        />

                        {/* RPE */}
                        <input
                          type="number"
                          value={set.rpe}
                          onChange={(e) => updateSet(key, sIdx, 'rpe', e.target.value)}
                          className={darkInput}
                          placeholder="—"
                          min={1}
                          max={10}
                        />

                        {/* Complete */}
                        <button
                          onClick={() => toggleComplete(block, exIdx, sIdx)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                            set.completed
                              ? 'bg-[#005050] border border-[#84d4d3]/30'
                              : 'bg-zinc-800 border border-zinc-700/60'
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
              </div>
            );
          })}
        </div>
      ))}

      {/* ── Motivational quote ──────────────────────────────────────────────── */}
      <div className="text-center px-6 py-4 mb-4">
        <p className="text-xs italic text-zinc-700 leading-relaxed">{quote}</p>
      </div>

      {/* ── Finish button ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-20 left-4 right-4 z-30">
        <button
          onClick={handleFinish}
          disabled={submitting}
          className="w-full font-[Manrope] font-bold text-base py-4 rounded-2xl shadow-2xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-black"
          style={{ background: '#c8f542' }}
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
          {submitting ? 'A guardar...' : 'Terminar treino'}
        </button>
      </div>

      {/* ── Quick substitute modal ──────────────────────────────────────────── */}
      {substituteTarget && (
        <QuickSubstituteModal
          exerciseId={substituteTarget.exerciseId}
          exerciseName={substituteTarget.exerciseName}
          onSelect={handleSubstitute}
          onClose={() => setSubstituteTarget(null)}
        />
      )}

      {/* ── Exercises panel overlay ─────────────────────────────────────────── */}
      {showExercises && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-zinc-800/60">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Biblioteca</div>
              <h2 className="font-[Manrope] font-black text-xl text-white">Exercícios</h2>
            </div>
            <button
              onClick={() => setShowExercises(false)}
              className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined text-white text-xl">close</span>
            </button>
          </div>
          {/* Search */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5">
              <span className="material-symbols-outlined text-zinc-400 text-base">search</span>
              <input
                type="text"
                value={exSearch}
                onChange={(e) => setExSearch(e.target.value)}
                placeholder="Pesquisar exercício..."
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
              />
              {exSearch && (
                <button onClick={() => setExSearch('')}>
                  <span className="material-symbols-outlined text-zinc-500 text-base">cancel</span>
                </button>
              )}
            </div>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
            {exLoading ? (
              <div className="py-16 text-center text-sm text-zinc-500">A carregar...</div>
            ) : (
              exList
                .filter((ex) => !exSearch || ex.name.toLowerCase().includes(exSearch.toLowerCase()))
                .map((ex) => (
                  <div key={ex.id} className="bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800/60">
                    <div className="flex items-start gap-3">
                      {ex.gifUrl ? (
                        <img src={ex.gifUrl} alt={ex.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-zinc-600 text-xl">fitness_center</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-white truncate">{ex.name}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(ex.primaryMuscles ?? []).slice(0, 2).map((m: string) => (
                            <span key={m} className="text-[9px] font-bold uppercase text-[#84d4d3] bg-[#84d4d3]/10 px-1.5 py-0.5 rounded-lg">{m}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
            {!exLoading && exList.filter((ex) => !exSearch || ex.name.toLowerCase().includes(exSearch.toLowerCase())).length === 0 && (
              <div className="py-16 text-center text-sm text-zinc-500">Nenhum exercício encontrado.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
