'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { StatGrid } from '../../../../components/client';
import { useMyStats } from '../../../../lib/hooks/useStats';

export default function ClientProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: stats } = useMyStats();

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  const initials = (stats?.clientName ?? user?.email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const displayName = stats?.clientName ?? user?.email?.split('@')[0] ?? '—';

  return (
    <div>
      {/* ── Avatar hero ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center py-8 mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-[Manrope] font-black text-3xl text-black mb-4 shadow-xl"
          style={{ background: 'linear-gradient(135deg, #84d4d3 0%, #005050 100%)' }}
        >
          {initials}
        </div>
        <h1 className="font-[Manrope] font-black text-2xl text-white">{displayName}</h1>
        <p className="text-xs text-zinc-500 mt-1">{user?.email}</p>
        {stats?.currentLevel && (
          <div className="mt-3 flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/60 rounded-full px-3 py-1.5">
            <span className="material-symbols-outlined text-sm text-[#84d4d3]">military_tech</span>
            <span className="text-xs font-bold text-zinc-300">
              {{ iniciante: 'Iniciante', intermedio: 'Intermédio', avancado: 'Avançado' }[stats.currentLevel]}
            </span>
          </div>
        )}
      </div>

      {stats && (
        <StatGrid stats={[
          { label: 'Treinos',  value: stats.totalWorkoutLogs ?? stats.completedSessions },
          { label: 'Presença', value: `${stats.attendanceRate}%` },
          { label: 'Planos',   value: stats.totalPrograms },
        ]} />
      )}

      {/* ── Active plan ───────────────────────────────────────────────────────── */}
      {stats?.activeProgram && (
        <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-[#005050]/40 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#005050]/30 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#84d4d3] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Plano activo</div>
            <div className="font-semibold text-sm text-white mt-0.5">{stats.activeProgram}</div>
          </div>
        </div>
      )}

      {/* ── Quick links ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mb-6">
        {[
          { icon: 'fitness_center',  label: 'O meu plano',    href: '/client/my-plan' },
          { icon: 'insights',        label: 'Os meus dados',  href: '/client/stats' },
          { icon: 'emoji_events',    label: 'Records',        href: '/client/my-records' },
          { icon: 'restaurant',      label: 'Nutrição',       href: '/client/my-nutrition' },
        ].map(({ icon, label, href }) => (
          <button key={href} onClick={() => router.push(href)}
            className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3.5 border border-zinc-800/60 text-left active:scale-[0.99] transition-transform">
            <span className="material-symbols-outlined text-lg text-zinc-500" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            <span className="text-sm text-white font-medium">{label}</span>
            <span className="material-symbols-outlined text-zinc-700 text-base ml-auto">chevron_right</span>
          </button>
        ))}
      </div>

      {/* ── Logout ───────────────────────────────────────────────────────────── */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 font-bold text-sm px-4 py-3.5 rounded-2xl transition-colors"
      >
        <span className="material-symbols-outlined text-base">logout</span>
        Terminar sessão
      </button>
    </div>
  );
}
