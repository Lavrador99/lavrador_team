'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clientsApi } from '../../../lib/api/clients.api';
import { UserDto } from '@libs/types';

function getAge(birthDate: string) {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: clients = [], isLoading } = useSWR<UserDto[]>('clients-all', clientsApi.getAll);

  const filtered = clients.filter(
    (c) =>
      c.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-black text-2xl text-white">Clientes</h1>
          <p className="font-mono text-xs text-muted mt-1">// {clients.length} clientes registados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/users/new')}
            className="font-mono text-xs border border-border text-muted hover:text-white hover:border-muted px-3 py-2 rounded-lg transition-colors">
            + Novo Cliente
          </button>
          <button onClick={() => router.push('/prescription')}
            className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90">
            + Nova Prescrição
          </button>
        </div>
      </div>

      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar cliente..."
          className="w-full max-w-sm bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent"
        />
      </div>

      {isLoading ? (
        <div className="py-20 font-mono text-sm text-muted text-center">A carregar clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 font-mono text-sm text-muted text-center">Nenhum cliente encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const clientId = c.client?.id;
            return (
              <button
                key={c.id}
                onClick={() => clientId && router.push(`/clients/${clientId}`)}
                className="bg-panel border border-border rounded-xl p-5 text-left hover:border-accent/30 transition-colors flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-syne font-black text-accent text-lg flex-shrink-0">
                  {(c.client?.name ?? c.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-syne font-bold text-sm text-white truncate">{c.client?.name ?? '—'}</div>
                  <div className="font-mono text-[10px] text-muted mt-0.5 truncate">{c.email}</div>
                  <div className="flex gap-2 mt-1.5">
                    <span className="font-mono text-[9px] text-faint bg-[#1e1e28] rounded px-1.5 py-0.5">
                      {new Date(c.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                    {c.client?.birthDate && (
                      <span className="font-mono text-[9px] text-accent bg-accent/5 border border-accent/15 rounded px-1.5 py-0.5">
                        {getAge(c.client.birthDate)} anos
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-muted text-base flex-shrink-0">→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
