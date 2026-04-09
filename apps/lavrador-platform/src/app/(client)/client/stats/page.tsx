'use client';
import { useRouter } from 'next/navigation';

const STAT_LINKS = [
  {
    path: '/client/my-records',
    icon: '🏆',
    label: 'Os meus recordes',
    sub: 'Máximos de carga e performance',
    color: '#c8f542',
  },
  {
    path: '/client/muscle-volume',
    icon: '💪',
    label: 'Volume muscular',
    sub: 'Séries por grupo muscular (últimas semanas)',
    color: '#f5a442',
  },
  {
    path: '/client/body-measurements',
    icon: '📏',
    label: 'Medidas corporais',
    sub: 'Evolução de peso, altura e perímetros',
    color: '#42a5f5',
  },
  {
    path: '/client/calendar',
    icon: '📅',
    label: 'Calendário de treinos',
    sub: 'Histórico de sessões realizadas',
    color: '#a855f7',
  },
];

export default function StatsHubPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-syne font-black text-2xl text-white">Os meus dados</h1>
        <p className="font-mono text-xs text-muted mt-1">// progresso e estatísticas pessoais</p>
      </div>

      <div className="flex flex-col gap-3">
        {STAT_LINKS.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="w-full flex items-center gap-4 bg-panel border border-border rounded-xl px-5 py-4 hover:border-accent/30 transition-all text-left active:scale-[0.98]"
            style={{ borderLeftColor: item.color, borderLeftWidth: 3 }}
          >
            <span className="text-2xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-syne font-bold text-sm text-white">{item.label}</div>
              <div className="font-mono text-[10px] text-muted mt-0.5">{item.sub}</div>
            </div>
            <span className="text-muted text-sm flex-shrink-0">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
