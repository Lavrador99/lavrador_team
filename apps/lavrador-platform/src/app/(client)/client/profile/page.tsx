'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/stores/authStore';

export default function ClientProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  return (
    <div>
      <h1 className="font-syne font-black text-2xl text-white mb-6">Perfil</h1>

      <div className="bg-panel border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-syne font-black text-accent text-2xl flex-shrink-0">
            {(user?.email ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-syne font-bold text-lg text-white">{user?.email?.split('@')[0] ?? '—'}</div>
            <div className="font-mono text-xs text-muted mt-0.5">{user?.email}</div>
            <div className="font-mono text-[10px] text-faint mt-1 uppercase tracking-widest">
              {user?.role === 'CLIENT' ? 'Cliente' : user?.role}
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleLogout}
        className="w-full border border-red-400/30 text-red-400 font-mono text-xs px-4 py-3 rounded-xl hover:bg-red-400/5 hover:border-red-400/50 transition-colors">
        Terminar sessão
      </button>
    </div>
  );
}
