'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../../../lib/api/workouts.api';
import { PageHeader, InputField, SelectField, TextareaField } from '../../../../components/ui';

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
      await adminApi.createUser({ email, password, role, name, birthDate: birthDate || undefined, phone: phone || undefined, notes: notes || undefined });
      setSuccess(`Utilizador "${name}" criado com sucesso.`);
      setTimeout(() => router.push('/clients'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao criar utilizador');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-xl">
      <button
        onClick={() => router.push('/clients')}
        className="font-label font-bold text-xs text-secondary hover:text-primary mb-6 flex items-center gap-1 transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Clientes
      </button>

      <PageHeader label="Conta" title="Novo Utilizador" subtitle="Criar conta + perfil de cliente" />

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="label-category text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lock</span>Credenciais
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" required />
            <InputField label="Password *" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} />
          </div>
        </div>

        <div>
          <h3 className="label-category text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">person</span>Perfil
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nome *" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" required />
            <SelectField label="Role" value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="CLIENT">Cliente</option>
              <option value="ADMIN">Admin</option>
            </SelectField>
            <InputField label="Data de nascimento" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <InputField label="Telefone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+351 912 345 678" />
          </div>
          <div className="mt-4">
            <TextareaField label="Notas" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Observações internas..." />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-error bg-error-container/30 rounded-lg px-4 py-3">
            <span className="material-symbols-outlined text-sm">error</span>
            <p className="font-label font-bold text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-primary bg-primary-fixed/40 rounded-lg px-4 py-3">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <p className="font-label font-bold text-sm">{success}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => router.push('/clients')} className="text-sm text-secondary hover:text-on-surface px-4 py-2 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-8 py-3 rounded-lg disabled:opacity-40 active:scale-95 transition-all shadow-ambient"
          >
            {loading ? 'A criar...' : 'Criar utilizador'}
          </button>
        </div>
      </form>
    </div>
  );
}
