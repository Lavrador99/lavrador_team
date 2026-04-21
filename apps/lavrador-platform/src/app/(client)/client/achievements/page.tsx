'use client';
import useSWR from 'swr';
import { AchievementDto } from '@libs/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json());

const ALL_ACHIEVEMENTS: { type: AchievementDto['type']; name: string; icon: string; description: string }[] = [
  { type: 'FIRST_WORKOUT',     name: 'Primeiro treino',   icon: '🎯', description: 'Completaste o teu primeiro treino!' },
  { type: 'STREAK_3',          name: 'Streak de 3 dias',  icon: '🔥', description: '3 dias seguidos de treino!' },
  { type: 'STREAK_7',          name: 'Semana perfeita',   icon: '⚡', description: '7 dias seguidos de treino!' },
  { type: 'STREAK_30',         name: 'Mês de fogo',       icon: '🏆', description: '30 dias seguidos de treino!' },
  { type: 'WORKOUTS_10',       name: '10 Treinos',        icon: '💪', description: 'Completaste 10 treinos no total.' },
  { type: 'WORKOUTS_50',       name: '50 Treinos',        icon: '🌟', description: 'Completaste 50 treinos no total.' },
  { type: 'WORKOUTS_100',      name: '100 Treinos',       icon: '🎖️', description: 'Lenda! 100 treinos completados.' },
  { type: 'FIRST_PR',          name: 'Primeiro recorde',  icon: '📈', description: 'Bateste o teu primeiro recorde pessoal!' },
  { type: 'PRS_5',             name: '5 Recordes',        icon: '🏅', description: 'Bateste 5 recordes pessoais!' },
  { type: 'CONSISTENCY_MONTH', name: 'Consistência',      icon: '📅', description: '20+ treinos num mês. Incrível!' },
];

export default function AchievementsPage() {
  const { data: earned = [] } = useSWR<AchievementDto[]>(
    `${API}/api/achievements/my`,
    fetcher,
  );

  const earnedSet = new Set(earned.map((a) => a.type));

  return (
    <div>
      <div className="mb-6">
        <p className="font-label text-xs text-outline uppercase tracking-widest mb-1">Perfil</p>
        <h1 className="font-headline font-black text-2xl text-on-surface">Conquistas</h1>
        <p className="font-label text-sm text-secondary mt-1">
          {earned.length} de {ALL_ACHIEVEMENTS.length} desbloqueadas
        </p>
      </div>

      {earned.length > 0 && (
        <div className="mb-6 p-4 bg-primary-fixed rounded-xl border border-primary/20">
          <p className="font-label text-xs text-primary uppercase tracking-widest mb-3">Mais recente</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{earned[0].icon}</span>
            <div>
              <div className="font-headline font-bold text-on-surface">{earned[0].name}</div>
              <div className="font-label text-xs text-secondary mt-0.5">{earned[0].description}</div>
              <div className="font-label text-xs text-outline mt-1">
                {new Date(earned[0].earnedAt).toLocaleDateString('pt-PT')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_ACHIEVEMENTS.map((a) => {
          const isEarned = earnedSet.has(a.type);
          const earnedData = earned.find((e) => e.type === a.type);
          return (
            <div
              key={a.type}
              className={`rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all ${
                isEarned
                  ? 'bg-surface-container-lowest shadow-sm border border-primary/20'
                  : 'bg-surface-container-highest opacity-40'
              }`}
            >
              <span className={`text-3xl ${!isEarned ? 'grayscale' : ''}`}>{a.icon}</span>
              <div className="font-headline font-bold text-xs text-on-surface">{a.name}</div>
              <div className="font-label text-xs text-secondary leading-tight">{a.description}</div>
              {earnedData && (
                <div className="font-label text-xs text-primary mt-1">
                  {new Date(earnedData.earnedAt).toLocaleDateString('pt-PT')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
