'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserDto } from '@libs/types';
import { PageHeader, EmptyState, LoadingState, Modal } from '../../../components/ui';
import { useClients } from '../../../lib/hooks/useClients';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

function OnboardingLinkModal({ onClose }: { onClose: () => void }) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/onboarding/generate-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clientName: clientName || undefined, clientEmail: clientEmail || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLink(data.url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <Modal onClose={onClose} title="Gerar link de onboarding">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {!link ? (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.35rem', fontFamily: 'DM Mono, monospace' }}>Nome do cliente (opcional)</label>
              <input
                value={clientName} onChange={(e) => setClientName(e.target.value)}
                placeholder="João Silva"
                style={{ width: '100%', background: '#0a0a0f', border: '1px solid #1a1a24', borderRadius: 10, padding: '0.6rem 0.75rem', color: 'white', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.35rem', fontFamily: 'DM Mono, monospace' }}>Email (opcional)</label>
              <input
                type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                placeholder="joao@email.com"
                style={{ width: '100%', background: '#0a0a0f', border: '1px solid #1a1a24', borderRadius: 10, padding: '0.6rem 0.75rem', color: 'white', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'DM Mono, monospace', margin: 0 }}>
              O link expira em 7 dias. O cliente preenche o intake e fica registado automaticamente.
            </p>
            <button
              onClick={generate} disabled={loading}
              style={{ background: '#c8f542', color: '#000', border: 'none', borderRadius: 12, padding: '0.8rem', fontFamily: 'Syne, sans-serif', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'A gerar...' : 'Gerar link'}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: '#c8f542', fontFamily: 'DM Mono, monospace', margin: 0 }}>✓ Link criado! Válido por 7 dias.</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                readOnly value={link}
                style={{ flex: 1, background: '#0a0a0f', border: '1px solid #1a1a24', borderRadius: 10, padding: '0.6rem 0.75rem', color: '#aaa', fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', outline: 'none' }}
              />
              <button
                onClick={copy}
                style={{ background: copied ? '#005050' : '#1a1a24', color: copied ? '#84d4d3' : 'white', border: 'none', borderRadius: 10, padding: '0.6rem 0.9rem', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <button onClick={onClose} style={{ background: '#1a1a24', color: '#888', border: 'none', borderRadius: 12, padding: '0.7rem', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem' }}>Fechar</button>
          </>
        )}
      </div>
    </Modal>
  );
}

function getAge(birthDate: string) {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const { data: clients = [], isLoading } = useClients();

  const filtered = clients.filter(
    (c) =>
      c.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const headerAction = (
    <>
      <button
        onClick={() => setShowOnboardingModal(true)}
        className="bg-surface-container-high text-on-surface font-label font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-base">link</span>
        Link Intake
      </button>
      <button
        onClick={() => router.push('/users/new')}
        className="bg-surface-container-high text-on-surface font-label font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-base">person_add</span>
        Novo Cliente
      </button>
      <button
        onClick={() => router.push('/prescription')}
        className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-base">description</span>
        Nova Prescrição
      </button>
    </>
  );

  return (
    <div>
      {showOnboardingModal && <OnboardingLinkModal onClose={() => setShowOnboardingModal(false)} />}
      <PageHeader
        label="Gestão"
        title="Clientes"
        subtitle={`${clients.length} clientes registados`}
        action={headerAction}
      />

      <div className="mb-6 relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar cliente..."
          className="w-full bg-surface-container-highest border-none rounded-lg pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none"
        />
      </div>

      {isLoading ? (
        <LoadingState message="A carregar clientes..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="person_search" title="Nenhum cliente encontrado." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c: UserDto) => {
            const clientId = c.client?.id;
            return (
              <button
                key={c.id}
                onClick={() => clientId && router.push(`/clients/${clientId}`)}
                className="bg-surface-container-lowest rounded-xl p-5 text-left shadow-sm hover:shadow-ambient transition-shadow flex items-center gap-4 group"
              >
                <div className="w-11 h-11 rounded-full kinetic-gradient flex items-center justify-center font-headline font-black text-on-primary text-lg flex-shrink-0">
                  {(c.client?.name ?? c.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-headline font-bold text-sm text-on-surface truncate">{c.client?.name ?? '—'}</div>
                  <div className="font-label text-xs text-secondary mt-0.5 truncate">{c.email}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="label-category bg-surface-container-high rounded px-1.5 py-0.5">
                      {new Date(c.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                    {c.client?.birthDate && (
                      <span className="label-category text-primary bg-primary-fixed rounded px-1.5 py-0.5">
                        {getAge(c.client.birthDate)} anos
                      </span>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors flex-shrink-0">
                  chevron_right
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
