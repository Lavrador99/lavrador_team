'use client';
import useSWR from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json());

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  streak: number;
  totalWorkouts: number;
  totalVolumeKg: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { data: rawData, isLoading } = useSWR<LeaderboardEntry[]>(
    `${API}/api/stats/leaderboard`,
    fetcher
  );
  const data: LeaderboardEntry[] = Array.isArray(rawData) ? rawData : [];

  return (
    <div>
      <div className="mb-6">
        <p className="font-label text-xs text-outline uppercase tracking-widest mb-1">
          Comunidade
        </p>
        <h1 className="font-headline font-black text-2xl text-on-surface">
          Leaderboard
        </h1>
        <p className="font-label text-sm text-secondary mt-1">
          Top 20 em streak de treino
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-secondary font-label text-sm">
          A carregar...
        </div>
      ) : (
        <div className="space-y-2">
          {(data as LeaderboardEntry[]).map((entry) => {
            const medal = MEDALS[entry.rank - 1] ?? null;
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all ${
                  isTop3
                    ? 'bg-surface-container-lowest shadow-sm border border-primary/20'
                    : 'bg-surface-container-highest'
                }`}
              >
                <div
                  className={`w-8 text-center font-headline font-black text-lg ${
                    isTop3 ? 'text-primary' : 'text-outline'
                  }`}
                >
                  {medal ?? `#${entry.rank}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-headline font-bold text-sm text-on-surface truncate">
                    {entry.displayName}
                  </div>
                  <div className="font-label text-xs text-secondary mt-0.5">
                    {entry.totalWorkouts} treinos ·{' '}
                    {entry.totalVolumeKg.toLocaleString()} kg
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-base">🔥</span>
                  <span
                    className={`font-headline font-black text-lg ${
                      isTop3 ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {entry.streak}
                  </span>
                </div>
              </div>
            );
          })}
          {(data as LeaderboardEntry[]).length === 0 && (
            <div className="text-center py-16 text-secondary font-label text-sm">
              Ainda não há dados suficientes para o leaderboard.
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-surface-container-highest rounded-xl px-4 py-3">
        <p className="font-label text-xs text-outline">
          🔒 Apenas primeiro nome e inicial do apelido são visíveis. Os dados
          são anónimos.
        </p>
      </div>
    </div>
  );
}
