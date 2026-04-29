'use client';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { workoutsApi } from '../../../../lib/api/workouts.api';
import { statsApi } from '../../../../lib/api/stats.api';
import { recordsApi, PersonalRecord } from '../../../../lib/api/records.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: '20 Dias', weeks: 3 },
  { label: '3 Meses', weeks: 13 },
  { label: '1 Ano',   weeks: 52 },
] as const;

const MUSCLE_PT: Record<string, string> = {
  peitoral:      'Peito',
  dorsais:       'Costas',
  deltoides:     'Ombros',
  biceps:        'Bíceps',
  triceps:       'Tríceps',
  quadriceps:    'Quadríceps',
  isquiotibiais: 'Isquiotibiais',
  gluteos:       'Glúteos',
  core:          'Core',
  trapezio:      'Trapézio',
  gastrocnemios: 'Gémeos',
  antebraco:     'Antebraço',
  adutores:      'Adutores',
};

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({ scores }: { scores: number[] }) {
  const labels = ['FORÇA', 'HIPERT.', 'RESIST.', 'MOBIL.', 'POTÊNCIA'];
  const cx = 76, cy = 76, r = 54;
  const n = labels.length;
  const angles = labels.map((_, i) => (i * 2 * Math.PI) / n);
  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const pts = angles.map((a, i) => toXY(a, r * Math.max(0.05, (scores[i] ?? 50) / 100)));
  const dataPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 152 152" className="w-full h-full">
      {gridLevels.map((lvl) => {
        const gPts = angles.map((a) => toXY(a, r * lvl));
        const d = gPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={lvl} d={d} fill="none" stroke="#27273a" strokeWidth="0.8" />;
      })}
      {angles.map((a, i) => {
        const end = toXY(a, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="#27273a" strokeWidth="0.8" />;
      })}
      <path d={dataPath} fill="#84d4d3" fillOpacity="0.2" stroke="#84d4d3" strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill="#84d4d3" />)}
      {angles.map((a, i) => {
        const lp = toXY(a, r + 15);
        return (
          <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="6" fill="#52525b" fontWeight="700" fontFamily="monospace"
          >
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Body Silhouette ──────────────────────────────────────────────────────────

const FRONT_MAP: Record<string, Array<{ cx: number; cy: number; rx: number; ry: number }>> = {
  peitoral:   [{ cx: 50, cy: 35, rx: 17, ry: 9 }],
  deltoides:  [{ cx: 28, cy: 29, rx: 9,  ry: 8 }, { cx: 72, cy: 29, rx: 9, ry: 8 }],
  biceps:     [{ cx: 22, cy: 48, rx: 7,  ry: 11 }, { cx: 78, cy: 48, rx: 7, ry: 11 }],
  core:       [{ cx: 50, cy: 52, rx: 13, ry: 10 }],
  quadriceps: [{ cx: 37, cy: 72, rx: 11, ry: 16 }, { cx: 63, cy: 72, rx: 11, ry: 16 }],
};

const BACK_MAP: Record<string, Array<{ cx: number; cy: number; rx: number; ry: number }>> = {
  dorsais:       [{ cx: 50, cy: 33, rx: 20, ry: 12 }],
  trapezio:      [{ cx: 50, cy: 24, rx: 15, ry: 7 }],
  isquiotibiais: [{ cx: 37, cy: 73, rx: 10, ry: 15 }, { cx: 63, cy: 73, rx: 10, ry: 15 }],
  gluteos:       [{ cx: 39, cy: 58, rx: 11, ry: 9 },  { cx: 61, cy: 58, rx: 11, ry: 9 }],
  triceps:       [{ cx: 23, cy: 46, rx: 7,  ry: 10 }, { cx: 77, cy: 46, rx: 7, ry: 10 }],
  gastrocnemios: [{ cx: 38, cy: 88, rx: 7,  ry: 9 },  { cx: 62, cy: 88, rx: 7, ry: 9 }],
  antebraco:     [{ cx: 19, cy: 62, rx: 6,  ry: 10 }, { cx: 81, cy: 62, rx: 6, ry: 10 }],
};

function BodySilhouette({ view, topMuscle, activeMuscles }: {
  view: 'front' | 'back';
  topMuscle: string;
  activeMuscles: string[];
}) {
  const map = view === 'front' ? FRONT_MAP : BACK_MAP;
  const getStyle = (muscle: string) => {
    if (muscle === topMuscle) return { fill: '#84d4d3', opacity: 0.85 };
    if (activeMuscles.includes(muscle)) return { fill: '#2d6e6c', opacity: 0.7 };
    return null;
  };

  return (
    <svg viewBox="0 0 100 115" className="w-full h-full">
      {/* Head */}
      <ellipse cx="50" cy="9" rx="10" ry="10" fill="#161622" stroke="#2a2a3a" strokeWidth="0.8" />
      {/* Neck */}
      <rect x="46" y="18" width="8" height="6" fill="#161622" stroke="#2a2a3a" strokeWidth="0.5" rx="2" />
      {/* Torso */}
      <path d="M31 24 L19 60 L26 63 L26 79 L74 79 L74 63 L81 60 L69 24 Q60 21 50 21 Q40 21 31 24Z"
        fill="#161622" stroke="#2a2a3a" strokeWidth="0.8" />
      {/* Left arm */}
      <path d="M31 24 L19 60 L17 82 L25 82 L29 60 L35 25Z"
        fill="#161622" stroke="#2a2a3a" strokeWidth="0.8" />
      {/* Right arm */}
      <path d="M69 24 L81 60 L83 82 L75 82 L71 60 L65 25Z"
        fill="#161622" stroke="#2a2a3a" strokeWidth="0.8" />
      {/* Left leg */}
      <path d="M26 79 L22 102 L22 110 L37 110 L39 102 L43 79Z"
        fill="#161622" stroke="#2a2a3a" strokeWidth="0.8" />
      {/* Right leg */}
      <path d="M74 79 L78 102 L78 110 L63 110 L61 102 L57 79Z"
        fill="#161622" stroke="#2a2a3a" strokeWidth="0.8" />
      {/* Muscle overlays */}
      {Object.entries(map).map(([muscle, ellipses]) => {
        const style = getStyle(muscle);
        if (!style) return null;
        return ellipses.map((e, i) => (
          <ellipse key={`${muscle}-${i}`} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
            fill={style.fill} fillOpacity={style.opacity} />
        ));
      })}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLoad(notes?: string): number {
  if (!notes) return 0;
  const m = notes.match(/(\d+(?:\.\d+)?)kg\s*×/);
  return m ? parseFloat(m[1]) : 0;
}

function fmtBig(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function strengthBadge(kg: number) {
  if (kg >= 160) return { label: 'AVANÇADO',  cls: 'text-[#84d4d3] bg-[#84d4d3]/10', pct: 90, top: 8 };
  if (kg >= 120) return { label: 'AVANÇADO',  cls: 'text-[#84d4d3] bg-[#84d4d3]/10', pct: 78, top: 14 };
  if (kg >= 80)  return { label: 'INTERM.',   cls: 'text-yellow-400 bg-yellow-400/10', pct: 55, top: 33 };
  if (kg >= 40)  return { label: 'BÁSICO',    cls: 'text-orange-400 bg-orange-400/10', pct: 30, top: 55 };
  return           { label: 'INICIANTE', cls: 'text-zinc-400 bg-zinc-800',           pct: 15, top: 70 };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MuscleVolumePage() {
  const [weeks, setWeeks] = useState(3);

  const { data: volume,   isLoading } = useSWR(['muscle-vol', weeks], () => workoutsApi.getMyMuscleVolume(weeks));
  const { data: stats  }              = useSWR('my-stats',             statsApi.getMy);
  const { data: calendar }            = useSWR('my-calendar',          workoutsApi.getMyCalendar);
  const { data: records }             = useSWR('my-records-best',      recordsApi.getMyBest);

  const cards = volume?.cards ?? [];
  const maxSets = cards[0]?.sets ?? 1;
  const totalSets = cards.reduce((a, c) => a + c.sets, 0);
  const primaryMuscle = cards[0]?.muscle ?? '';
  const activeMuscles = cards.slice(0, 4).map(c => c.muscle);

  // Last 7 days calendar
  const last7 = useMemo(() => {
    const calSet = new Set((calendar ?? []).map(c => c.date.split('T')[0]));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      return {
        label: d.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3).toUpperCase(),
        active: calSet.has(key),
        today: i === 6,
      };
    });
  }, [calendar]);

  // Radar scores derived from available data
  const radarScores = useMemo(() => {
    const vol = stats?.totalVolumeKg ?? 0;
    const streak = stats?.workoutStreak ?? 0;
    const att = stats?.attendanceRate ?? 0;
    const workouts = stats?.totalWorkoutLogs ?? 0;
    return [
      Math.min(100, 25 + Math.min(65, vol / 3000 * 65)),        // força
      Math.min(100, 20 + Math.min(70, totalSets / 150 * 70)),   // hipertrofia
      Math.min(100, 15 + (att * 0.55) + Math.min(25, streak)),  // resistência
      30,                                                          // mobilidade (sem dados)
      Math.min(100, 20 + Math.min(60, workouts / 50 * 60)),     // potência
    ];
  }, [stats, totalSets]);

  // Exercise leaderboard: top 5 WEIGHT_KG records
  const leaderboard = useMemo((): PersonalRecord[] => {
    if (!records?.length) return [];
    return records
      .filter(r => r.type === 'WEIGHT_KG')
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [records]);

  // Big 3 strength lifts
  const findLift = (keywords: string[]) =>
    records?.find(r => r.type === 'WEIGHT_KG' && keywords.some(k => r.exerciseName.toLowerCase().includes(k)));

  const bigLifts = [
    { key: 'SQUAT',    record: findLift(['squat', 'agachamento']) },
    { key: 'BENCH',    record: findLift(['bench', 'supino']) },
    { key: 'DEADLIFT', record: findLift(['deadlift', 'peso morto', 'terra']) },
  ];
  const hasLifts = bigLifts.some(l => l.record);

  return (
    <div className="pb-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Analytics Dashboard</div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">Volume Analytics</h1>
          <div className="flex gap-1 flex-shrink-0 bg-zinc-900 border border-zinc-800/60 rounded-xl p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.weeks}
                onClick={() => setWeeks(p.weeks)}
                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                  weeks === p.weeks
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-sm text-zinc-600 text-center">A calcular...</div>
      )}

      {!isLoading && (
        <>
          {/* ── Row 1: Activity Breakdown + Muscle Engagement ───────────── */}
          <div className="grid grid-cols-2 gap-3 mb-3">

            {/* Activity Breakdown */}
            <div className="bg-zinc-900 rounded-2xl p-3.5 border border-zinc-800/60 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Actividade</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded-md">7 dias</div>
              </div>
              {/* Week dots */}
              <div className="flex justify-between">
                {last7.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase">{d.label}</div>
                    <div
                      className={`w-4 h-4 rounded-full transition-colors ${
                        d.active
                          ? 'bg-[#84d4d3]'
                          : d.today
                          ? 'border border-zinc-600'
                          : 'bg-zinc-800'
                      }`}
                    />
                  </div>
                ))}
              </div>
              {/* Stats */}
              <div className="border-t border-zinc-800/50 pt-2.5 space-y-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Consistência</div>
                  <div className="font-[Manrope] font-black text-xl text-white leading-none mt-0.5">
                    {stats?.attendanceRate ?? 0}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Active Streak</div>
                  <div className="font-[Manrope] font-black text-base text-white leading-none mt-0.5">
                    {stats?.workoutStreak ?? 0}
                    <span className="text-xs font-bold text-zinc-500 ml-1">dias</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Muscle Engagement */}
            <div className="bg-zinc-900 rounded-2xl p-3.5 border border-zinc-800/60 flex flex-col">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Músculo</div>
              <div className="flex gap-1 flex-1">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex-1" style={{ maxHeight: 100 }}>
                    <BodySilhouette view="front" topMuscle={primaryMuscle} activeMuscles={activeMuscles} />
                  </div>
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mt-1">Frente</div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex-1" style={{ maxHeight: 100 }}>
                    <BodySilhouette view="back" topMuscle={primaryMuscle} activeMuscles={activeMuscles} />
                  </div>
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mt-1">Costas</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 justify-center flex-wrap">
                {[
                  { label: 'Primário',    cls: 'bg-[#84d4d3]' },
                  { label: 'Secundário',  cls: 'bg-[#2d6e6c]' },
                ].map(({ label, cls }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${cls}`} />
                    <span className="text-[10px] font-bold text-zinc-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 2: Training Distribution + Sets per Muscle ──────────── */}
          <div className="grid grid-cols-2 gap-3 mb-3">

            {/* Training Distribution */}
            <div className="bg-zinc-900 rounded-2xl p-3.5 border border-zinc-800/60">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-white leading-tight">Distribuição<br />de Treino</p>
                <div className="w-7 h-7 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-sm text-zinc-400">radar</span>
                </div>
              </div>
              <div className="w-full mx-auto" style={{ aspectRatio: '1', maxHeight: 128 }}>
                <RadarChart scores={radarScores} />
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-1">
                {[
                  { label: 'TREINOS',   value: stats?.totalWorkoutLogs ?? 0 },
                  { label: 'VOLUME KG', value: fmtBig(stats?.totalVolumeKg ?? 0) },
                  { label: 'SÉRIES',    value: totalSets },
                  { label: 'PRESENÇA',  value: `${stats?.attendanceRate ?? 0}%` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</div>
                    <div className="font-[Manrope] font-black text-lg text-white leading-none mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sets per Muscle Group */}
            <div className="bg-zinc-900 rounded-2xl p-3.5 border border-zinc-800/60">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Séries / Grupo</div>
              {cards.length === 0 ? (
                <div className="py-8 text-[10px] text-zinc-600 text-center">Sem dados</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {cards.slice(0, 6).map((c) => {
                    const label = (MUSCLE_PT[c.muscle] ?? c.muscle).toUpperCase();
                    const barW = (c.sets / maxSets) * 100;
                    return (
                      <div key={c.muscle}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-[10px] font-bold tracking-wider text-zinc-400 truncate">{label}</div>
                          <div className="text-[10px] font-black text-zinc-300 ml-1 flex-shrink-0">{c.sets} SÉRIES</div>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${barW}%`, background: '#84d4d3' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Exercise Leaderboard ─────────────────────────────────────── */}
          {leaderboard.length > 0 && (
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/60 mb-3">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Exercise Leaderboard</div>
              {/* Header */}
              <div className="flex items-center px-1 mb-1.5">
                <div className="w-7 mr-2" />
                <div className="flex-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Exercício</div>
                <div className="w-14 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Carga</div>
                <div className="w-14 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">1RM est.</div>
                <div className="w-6" />
              </div>
              {/* Rows */}
              {leaderboard.map((r, i) => {
                const load = parseLoad(r.notes);
                const daysAgo = Math.floor((Date.now() - new Date(r.recordedAt).getTime()) / 86400000);
                const trend = daysAgo < 14 ? 'trending_up' : daysAgo < 60 ? 'trending_flat' : 'trending_down';
                const trendColor = daysAgo < 14 ? 'text-[#84d4d3]' : daysAgo < 60 ? 'text-zinc-500' : 'text-red-400';
                return (
                  <div key={r.id} className="flex items-center py-2.5 border-t border-zinc-800/40 px-1">
                    <div className="w-7 mr-2 font-[Manrope] font-black text-xs text-zinc-600 flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate leading-tight">{r.exerciseName}</div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">
                        {daysAgo === 0 ? 'hoje' : daysAgo === 1 ? 'ontem' : `há ${daysAgo}d`}
                      </div>
                    </div>
                    <div className="w-14 text-right flex-shrink-0">
                      <span className="text-sm font-bold text-white">{load > 0 ? `${load} kg` : '—'}</span>
                    </div>
                    <div className="w-14 text-right flex-shrink-0">
                      <span className="text-sm font-[Manrope] font-black text-[#84d4d3]">{Math.round(r.value)} kg</span>
                    </div>
                    <div className="w-6 text-right flex-shrink-0">
                      <span className={`material-symbols-outlined text-base ${trendColor}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}>{trend}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Global Strength Level ────────────────────────────────────── */}
          {hasLifts && (
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/60">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Nível de Força Global</div>
              <div className="grid grid-cols-3 gap-2">
                {bigLifts.map(({ key, record }) => {
                  if (!record) return (
                    <div key={key} className="rounded-xl bg-zinc-800/40 border border-zinc-800/40 p-2.5 flex flex-col items-center justify-center min-h-[90px]">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{key}</div>
                      <div className="font-[Manrope] font-black text-xl text-zinc-700">—</div>
                    </div>
                  );
                  const kg = parseLoad(record.notes) || Math.round(record.value * 0.87);
                  const lvl = strengthBadge(kg);
                  return (
                    <div key={key} className="rounded-xl bg-zinc-800/40 border border-zinc-800/40 p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{key}</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${lvl.cls}`}>
                          {lvl.label}
                        </span>
                      </div>
                      <div className="font-[Manrope] font-black text-xl text-white leading-none mb-0.5">
                        {kg}<span className="text-[10px] font-bold text-zinc-500 ml-0.5">kg</span>
                      </div>
                      <div className="text-[10px] text-zinc-600 mb-1.5">Top {lvl.top}% grupo etário</div>
                      <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${lvl.pct}%`, background: '#84d4d3' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {cards.length === 0 && (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-zinc-700 block mb-3">fitness_center</span>
              <p className="text-sm text-zinc-600">Regista treinos para ver a análise de volume.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
