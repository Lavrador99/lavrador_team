'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api/auth.api';
import { useAuthStore } from '../../../lib/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { accessToken } = await authApi.login({ email, password });
      const me = await authApi.getMe();
      setAuth(
        { id: me.id, email: me.email, role: me.role, name: me.client?.name },
        accessToken,
      );
      router.replace(me.role === 'ADMIN' ? '/dashboard' : '/client/dashboard');
    } catch {
      setError('Email ou password incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 60% 0%, #003535 0%, #0a0a0f 60%)' }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20"
        style={{ background: 'radial-gradient(ellipse, #84d4d3 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #005050, #003535)', border: '1px solid rgba(132,212,211,0.2)' }}>
            <span className="material-symbols-outlined text-[#84d4d3] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              fitness_center
            </span>
          </div>
          <h1 className="font-[Manrope] font-black text-3xl tracking-tight">
            <span style={{ color: '#84d4d3' }}>lavrador</span>
            <span className="text-white">team</span>
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-2">
            performance platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl px-4 py-3.5 text-sm text-white font-medium placeholder-zinc-600 outline-none transition-all"
              style={{
                background: '#111118',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(132,212,211,0.4)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              placeholder="exemplo@email.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-3.5 text-sm text-white font-medium placeholder-zinc-600 outline-none transition-all"
              style={{
                background: '#111118',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(132,212,211,0.4)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-red-400 text-base">error</span>
              <p className="text-xs text-red-400 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-[Manrope] font-black text-sm py-4 rounded-xl text-black disabled:opacity-50 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            style={{ background: loading ? '#8fa832' : '#c8f542' }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                A entrar...
              </>
            ) : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
