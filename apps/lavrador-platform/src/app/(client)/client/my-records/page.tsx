'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { PersonalRecordDto, RECORD_TYPE_LABEL, RECORD_TYPE_UNIT } from '@libs/types';
import { personalRecordsApi } from '../../../../lib/api/personal-records.api';

// ─── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES: { key: string; label: string; sub: string; types: string[]; icon: string; color: string; bg: string }[] = [
  { key: 'STRENGTH',   label: 'STRENGTH',   sub: '1RM',        types: ['WEIGHT_KG'],              icon: 'fitness_center', color: '#facc15', bg: '#facc1510' },
  { key: 'VOLUME',     label: 'VOLUME',     sub: 'MAX REPS',   types: ['REPS_MAX'],               icon: 'repeat',         color: '#84d4d3', bg: '#84d4d310' },
  { key: 'ENDURANCE',  label: 'ENDURANCE',  sub: 'DIST / TIME', types: ['DISTANCE_M','DURATION_S'], icon: 'directions_run',  color: '#fb923c', bg: '#fb923c10' },
  { key: 'ISOMETRIC',  label: 'ISOMETRIC',  sub: 'HOLD TIME',  types: ['ISOMETRIC_S'],            icon: 'timer',          color: '#c084fc', bg: '#c084fc10' },
];

const TYPE_UNIT: Record<string, string> = {
  WEIGHT_KG:   'kg',
  REPS_MAX:    'reps',
  ISOMETRIC_S: 'seg',
  DISTANCE_M:  'm',
  DURATION_S:  'seg',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function MyRecordsPage() {
  const router = useRouter();
  const { data: records = [], isLoading } = useSWR<PersonalRecordDto[]>(
    'my-best-records',
    personalRecordsApi.getMyBest,
  );

  if (isLoading) {
    return <div className="py-20 text-sm text-zinc-400 text-center">A carregar records...</div>;
  }

  if (!records.length) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-4xl text-zinc-700 mb-3 block">emoji_events</span>
        <div className="text-sm text-zinc-500">Ainda não tens records registados.</div>
      </div>
    );
  }

  // ─── Best of each type ────────────────────────────────────────────────────
  const bestByType = new Map<string, PersonalRecordDto>();
  for (const r of records) {
    const cur = bestByType.get(r.type);
    if (!cur || r.value > cur.value) bestByType.set(r.type, r);
  }

  // ─── Hall of Fame: absolute top record (weight or distance) ───────────────
  const hall = records.reduce((a, b) => (a.value >= b.value ? a : b));

  // ─── Group records by exercise for category lists ─────────────────────────
  const byExercise = new Map<string, PersonalRecordDto[]>();
  for (const r of records) {
    const list = byExercise.get(r.exerciseName) ?? [];
    list.push(r);
    byExercise.set(r.exerciseName, list);
  }

  return (
    <div className="pb-4">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="mb-6 pt-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Performance</div>
        <h1 className="font-[Manrope] font-black text-3xl text-white leading-tight tracking-tight">
          Personal<br />Records
        </h1>
      </div>

      {/* ── Hall of Fame hero ──────────────────────────────────────────────── */}
      <div
        className="rounded-3xl overflow-hidden mb-6 relative"
        style={{ background: 'linear-gradient(135deg, #002a2a 0%, #001818 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
          style={{ background: '#84d4d3', transform: 'translate(40%, -40%)' }} />
        <div className="absolute bottom-0 left-10 w-24 h-24 rounded-full opacity-10"
          style={{ background: '#c8f542', transform: 'translateY(40%)' }} />

        <div className="relative z-10 px-6 pt-5 pb-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-yellow-400/15 rounded-xl px-3 py-1.5 mb-4">
            <span className="material-symbols-outlined text-yellow-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Hall of Fame</span>
          </div>

          {/* Top record */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{hall.exerciseName}</div>
              <div className="font-[Manrope] font-black leading-none" style={{ fontSize: '4rem', color: '#c8f542' }}>
                {hall.value}
                <span className="text-2xl font-bold ml-2 opacity-70" style={{ color: '#84d4d3' }}>{TYPE_UNIT[hall.type]}</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">{fmtDate(hall.recordedAt)}</div>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#c8f542' }}>
              <span className="material-symbols-outlined text-2xl text-black" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            </div>
          </div>

          {/* Quick stats row */}
          {CATEGORIES.map((cat) => {
            const best = cat.types.map((t) => bestByType.get(t)).filter(Boolean)[0];
            if (!best) return null;
            return (
              <div key={cat.key} className="inline-flex items-center gap-1.5 mr-3 mt-4">
                <span className="material-symbols-outlined text-sm" style={{ color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                <span className="text-xs font-bold text-white">{best.value}<span className="text-[10px] font-normal text-zinc-500 ml-0.5">{TYPE_UNIT[best.type]}</span></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Category sections ─────────────────────────────────────────────── */}
      {CATEGORIES.map((cat) => {
        const catRecords = records.filter((r) => cat.types.includes(r.type));
        if (!catRecords.length) return null;

        // Group by exercise within category
        const exMap = new Map<string, PersonalRecordDto>();
        for (const r of catRecords) {
          const cur = exMap.get(r.exerciseName);
          if (!cur || r.value > cur.value) exMap.set(r.exerciseName, r);
        }
        const exList = [...exMap.values()].sort((a, b) => b.value - a.value);

        return (
          <div key={cat.key} className="mb-5">
            {/* Category header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: cat.bg, border: `1px solid ${cat.color}30` }}>
                <span className="material-symbols-outlined text-base" style={{ color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
              </div>
              <div>
                <div className="font-[Manrope] font-black text-sm text-white tracking-wider">{cat.label}</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">{cat.sub}</div>
              </div>
            </div>

            {/* Records list */}
            <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/60">
              {exList.map((r, idx) => (
                <div key={r.exerciseName}
                  className={`flex items-center gap-4 px-4 py-3.5 ${idx < exList.length - 1 ? 'border-b border-zinc-800/60' : ''}`}>
                  {/* Rank */}
                  <div className="w-5 text-center flex-shrink-0">
                    {idx === 0 ? (
                      <span className="material-symbols-outlined text-sm text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ) : (
                      <span className="text-[11px] font-bold text-zinc-600">{idx + 1}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{r.exerciseName}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{fmtDate(r.recordedAt)}</div>
                  </div>

                  {/* Value */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-[Manrope] font-black text-lg leading-none" style={{ color: cat.color }}>
                      {r.value}
                    </div>
                    <div className="text-[10px] text-zinc-500">{TYPE_UNIT[r.type]}</div>
                  </div>

                  {/* Evolution arrow */}
                  <button
                    onClick={() => router.push(`/client/exercise-history/${encodeURIComponent(r.exerciseName)}`)}
                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-zinc-400">trending_up</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

    </div>
  );
}
