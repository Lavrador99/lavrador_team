'use client';
import { useRouter } from 'next/navigation';
import { DarkPageHeader, StatGrid } from '../../../../components/client';
import { useMyStats } from '../../../../lib/hooks/useStats';

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

  return (
    <div>
      <DarkPageHeader eyebrow="Analytics" title="Os meus dados" subtitle="Progresso e estatísticas pessoais" />

      {stats && (
        <StatGrid stats={[
          { label: 'Presença', value: `${stats.attendanceRate}%`, color: 'text-[#84d4d3]' },
          { label: 'Sessões',  value: stats.completedSessions },
          { label: 'Planos',   value: stats.totalPrograms },
        ]} />
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
                    iniciante: 'Iniciante',
                    intermedio: 'Intermédio',
                    avancado: 'Avançado',
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
