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
    <main className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <span className="font-syne font-black text-3xl text-accent tracking-tight">
            lavrador<span className="text-white">team</span>
          </span>
          <p className="font-mono text-xs text-muted mt-2 tracking-widest uppercase">
            performance platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-muted mb-1 tracking-widest uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-panel border border-border rounded-lg px-4 py-3 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent transition-colors"
              placeholder="exemplo@email.com"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted mb-1 tracking-widest uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-panel border border-border rounded-lg px-4 py-3 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-dark font-syne font-black text-sm py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
