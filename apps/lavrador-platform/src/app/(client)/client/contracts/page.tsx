'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

export default function ContractsPage() {
  const { data: contracts = [] } = useSWR(`${API}/api/contracts/my`, fetcher);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function sign(id: string) {
    if (!signatureName.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/api/contracts/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ signatureName }),
      });
      mutate(`${API}/api/contracts/my`);
      setSigningId(null);
      setSignatureName('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="font-label text-xs text-zinc-500 uppercase tracking-widest mb-1">Documentos</p>
        <h1 className="font-headline font-black text-2xl text-white">Contratos</h1>
        <p className="font-label text-sm text-zinc-400 mt-1">Documentos e acordos com o teu PT</p>
      </div>

      {(!Array.isArray(contracts) || contracts.length === 0) ? (
        <div className="text-center py-16 text-zinc-400">
          <span className="material-symbols-outlined text-4xl text-zinc-500 mb-3 block">description</span>
          <p className="font-label text-sm">Ainda não tens contratos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(contracts as any[]).map((c) => (
            <div key={c.id} className="bg-zinc-900 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <span className="material-symbols-outlined text-xl text-[#84d4d3]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {c.signedAt ? 'verified' : 'description'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-headline font-bold text-sm text-white">{c.title}</div>
                  <div className="font-label text-xs text-zinc-400 mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString('pt-PT')}
                    {c.signedAt && ` · Assinado em ${new Date(c.signedAt).toLocaleDateString('pt-PT')}`}
                  </div>
                </div>
                <span className={`font-label text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${c.signedAt ? 'bg-primary/10 text-primary' : 'bg-amber-400/10 text-amber-400'}`}>
                  {c.signedAt ? '✓ Assinado' : '⏳ Pendente'}
                </span>
              </button>

              {expandedId === c.id && (
                <div className="px-4 pb-4 border-t border-zinc-800/60">
                  <div className="bg-zinc-800 rounded-xl p-4 my-3 max-h-48 overflow-y-auto">
                    <p className="font-body text-sm text-white whitespace-pre-wrap leading-relaxed">{c.content}</p>
                  </div>

                  {c.signedAt ? (
                    <div className="font-label text-xs text-[#84d4d3] bg-[#84d4d3]/5 rounded-lg px-3 py-2">
                      ✓ Assinado digitalmente por <span className="font-bold italic">{c.signatureName}</span> em {new Date(c.signedAt).toLocaleDateString('pt-PT')}
                    </div>
                  ) : signingId === c.id ? (
                    <div className="space-y-3">
                      <p className="font-label text-xs text-zinc-400">Escreve o teu nome completo para assinar digitalmente:</p>
                      <input
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Nome completo"
                        className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 italic outline-none focus:ring-1 focus:ring-[#84d4d3]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => sign(c.id)}
                          disabled={!signatureName.trim() || submitting}
                          className="flex-1 kinetic-gradient text-on-primary font-headline font-bold py-2.5 rounded-xl text-sm disabled:opacity-40"
                        >
                          {submitting ? 'A assinar...' : 'Assinar'}
                        </button>
                        <button
                          onClick={() => { setSigningId(null); setSignatureName(''); }}
                          className="font-label text-sm text-zinc-400 px-4"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSigningId(c.id)}
                      className="kinetic-gradient text-on-primary font-headline font-bold w-full py-2.5 rounded-xl text-sm"
                    >
                      Assinar contrato
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
