'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../../lib/api/workouts.api';

export default function NewUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'ADMIN'>('CLIENT');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.createUser({
        email, password, role, name,
        birthDate: birthDate || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
      });
      setSuccess(`Utilizador "${name}" criado com sucesso.`);
      setTimeout(() => router.push('/clients'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao criar utilizador');
    } finally {
      setLoading(false);
    }
  }

  function field(label: string, input: React.ReactNode) {
    return (
      <div>
        <label className="block font-mono text-[10px] text-muted tracking-widest uppercase mb-1">{label}</label>
        {input}
      </div>
    );
  }

  const inputCls = 'w-full bg-[#0d0d13] border border-border rounded-lg px-3 py-2.5 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent transition-colors';

  return (
    <div className="max-w-xl">
      <button onClick={() => router.push('/clients')} className="font-mono text-xs text-muted hover:text-white mb-4 flex items-center gap-1">
        ← Clientes
      </button>
      <h1 className="font-syne font-black text-2xl text-white mb-1">Novo Utilizador</h1>
      <p className="font-mono text-xs text-muted mb-6">// criar conta + perfil de cliente</p>

      <form onSubmit={handleSubmit} className="bg-panel border border-border rounded-xl p-6 space-y-5">
        <div>
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-3">Conta</div>
          <div className="grid grid-cols-2 gap-4">
            {field('Email *', <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="cliente@email.com" required />)}
            {field('Password *', <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Mínimo 8 caracteres" required minLength={8} />)}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-3">Perfil</div>
          <div className="grid grid-cols-2 gap-4">
            {field('Nome *', <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Nome completo" required />)}
            {field('Role', (
              <select value={role} onChange={e => setRole(e.target.value as any)} className={inputCls}>
                <option value="CLIENT">Cliente</option>
                <option value="ADMIN">Admin</option>
              </select>
            ))}
            {field('Data de nascimento', <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputCls} />)}
            {field('Telefone', <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+351 912 345 678" />)}
          </div>
          <div className="mt-4">
            {field('Notas', <textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputCls + ' resize-none'} rows={3} placeholder="Observações internas..." />)}
          </div>
        </div>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        {success && <p className="font-mono text-xs text-accent">{success}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => router.push('/clients')} className="font-sans text-sm text-muted hover:text-white px-4 py-2">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="bg-accent text-dark font-syne font-black text-sm px-6 py-2.5 rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {loading ? 'A criar...' : 'Criar utilizador'}
          </button>
        </div>
      </form>
    </div>
  );
}
