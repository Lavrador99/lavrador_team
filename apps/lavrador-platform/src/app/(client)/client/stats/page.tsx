'use client';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { DarkPageHeader, StatGrid } from '../../../../components/client';
import { useMyStats } from '../../../../lib/hooks/useStats';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json());

interface WeeklyBucket {
  week: string;
  volume: number;
  workouts: number;
  avgRpe: number | null;
}

function WeeklyVolumeChart({ data }: { data: WeeklyBucket[] }) {
  const maxVol = Math.max(...data.map((d) => d.volume), 1);
  return (
    <div className="bg-zinc-900 rounded-2xl px-5 py-4 border border-zinc-800/60 mb-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">
        Volume semanal (kg·reps)
      </div>
      <div className="flex items-end gap-1 h-20">
        {data.map((d, i) => {
          const h =
            maxVol > 0
              ? Math.max((d.volume / maxVol) * 100, d.volume > 0 ? 4 : 0)
              : 0;
          const isLast = i === data.length - 1;
          return (
            <div
              key={d.week}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className={`w-full rounded-t transition-all ${
                  isLast ? 'bg-[#c8f542]' : 'bg-zinc-700'
                }`}
                style={{ height: `${h}%`, minHeight: d.volume > 0 ? 4 : 0 }}
                title={`${d.week}: ${d.volume.toLocaleString()} kg·reps`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => (
          <div
            key={d.week}
            className={`flex-1 text-center text-[8px] font-bold truncate ${
              i === data.length - 1 ? 'text-[#c8f542]' : 'text-zinc-600'
            }`}
          >
            {d.week}
          </div>
        ))}
      </div>
      {data.length > 1 &&
        (() => {
          const prev = data[data.length - 2].volume;
          const curr = data[data.length - 1].volume;
          const pct =
            prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
          if (pct === null) return null;
          return (
            <div
              className={`mt-2 text-xs font-bold ${
                pct >= 0 ? 'text-[#c8f542]' : 'text-red-400'
              }`}
            >
              {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}% vs semana anterior
            </div>
          );
        })()}
    </div>
  );
}

const STAT_LINKS = [
  {
    path: '/client/my-records',
    icon: 'emoji_events',
    label: 'Records pessoais',
    sub: 'Máximos de carga e performance',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    path: '/client/muscle-volume',
    icon: 'fitness_center',
    label: 'Volume muscular',
    sub: 'Séries por grupo muscular (semanas)',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    path: '/client/body-measurements',
    icon: 'straighten',
    label: 'Medidas corporais',
    sub: 'Evolução de peso e perímetros',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    path: '/client/calendar',
    icon: 'calendar_month',
    label: 'Calendário de treinos',
    sub: 'Histórico de sessões realizadas',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
];

export default function StatsHubPage() {
  const router = useRouter();
  const { data: stats } = useMyStats();
  const { data: weeklyVolumeRaw } = useSWR<WeeklyBucket[]>(
    `${API}/api/stats/my/weekly-volume`,
    fetcher
  );
  const weeklyVolume = Array.isArray(weeklyVolumeRaw) ? weeklyVolumeRaw : [];

  return (
    <div>
      <DarkPageHeader
        eyebrow="Analytics"
        title="Os meus dados"
        subtitle="Progresso e estatísticas pessoais"
      />

      {stats && (
        <StatGrid
          stats={[
            {
              label: 'Presença',
              value: `${stats.attendanceRate}%`,
              color: 'text-[#84d4d3]',
            },
            { label: 'Sessões', value: stats.completedSessions },
            { label: 'Planos', value: stats.totalPrograms },
          ]}
        />
      )}

      {weeklyVolume.some((w) => w.volume > 0) && (
        <WeeklyVolumeChart data={weeklyVolume} />
      )}

      {/* ── Nav links ────────────────────────────────────────────────────────── */}
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">
        Módulos
      </div>
      <div className="flex flex-col gap-2">
        {STAT_LINKS.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="w-full flex items-center gap-4 bg-zinc-900 rounded-2xl px-5 py-4 border border-zinc-800/60 text-left active:scale-[0.99] transition-transform"
          >
            <div
              className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}
            >
              <span
                className={`material-symbols-outlined text-xl ${item.color}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {item.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white">
                {item.label}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">{item.sub}</div>
            </div>
            <span className="material-symbols-outlined text-zinc-700 text-base flex-shrink-0">
              chevron_right
            </span>
          </button>
        ))}
      </div>

      {/* ── Level badge ──────────────────────────────────────────────────────── */}
      {stats?.currentLevel && (
        <div className="mt-6 rounded-2xl px-5 py-4 border border-[#005050]/40 bg-[#005050]/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#84d4d3] text-xl">
              military_tech
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Nível de treino
              </div>
              <div className="font-[Manrope] font-bold text-sm text-white mt-0.5">
                {
                  {
                    INICIANTE: 'Iniciante',
                    INTERMEDIO: 'Intermédio',
                    AVANCADO: 'Avançado',
                  }[stats.currentLevel]
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
