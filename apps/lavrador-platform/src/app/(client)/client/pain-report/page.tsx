'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

const BODY_PARTS = [
  'Ombro esquerdo', 'Ombro direito',
  'Joelho esquerdo', 'Joelho direito',
  'Coluna cervical', 'Coluna lombar',
  'Anca esquerda', 'Anca direita',
  'Cotovelo esquerdo', 'Cotovelo direito',
  'Pulso esquerdo', 'Pulso direito',
  'Tornozelo esquerdo', 'Tornozelo direito',
  'Outro',
];

const INTENSITY = [
  { value: 'MILD',     label: 'Leve',     icon: '🟡', desc: 'Desconforto ligeiro, não limita o movimento' },
  { value: 'MODERATE', label: 'Moderada', icon: '🟠', desc: 'Dor presente, limita alguns movimentos' },
  { value: 'SEVERE',   label: 'Severa',   icon: '🔴', desc: 'Dor intensa, movimento muito limitado' },
] as const;

export default function PainReportPage() {
  const router = useRouter();
  const { data: history = [] } = useSWR(`${API}/api/pain-reports/my`, fetcher);

  const [bodyPart, setBodyPart] = useState('');
  const [customPart, setCustomPart] = useState('');
  const [intensity, setIntensity] = useState<'MILD' | 'MODERATE' | 'SEVERE' | ''>('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!bodyPart || !intensity) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/pain-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bodyPart: bodyPart === 'Outro' ? customPart || 'Outro' : bodyPart,
          intensity,
          description: description || undefined,
        }),
      });
      mutate(`${API}/api/pain-reports/my`);
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="text-5xl">✅</div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Reporte enviado</h2>
        <p className="font-label text-sm text-secondary max-w-xs">
          O teu PT foi notificado e irá analisar a situação em breve.
        </p>
        <button
          onClick={() => router.push('/client/dashboard')}
          className="kinetic-gradient text-on-primary font-headline font-bold px-6 py-3 rounded-xl mt-2"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="font-label text-xs text-outline uppercase tracking-widest mb-1">Saúde</p>
        <h1 className="font-headline font-black text-2xl text-on-surface">Reportar Dor</h1>
        <p className="font-label text-sm text-secondary mt-1">Informa o teu PT sobre qualquer desconforto</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-5 mb-5 space-y-5">
        {/* Body part */}
        <div>
          <label className="font-label text-xs font-bold uppercase tracking-widest text-secondary block mb-3">
            Zona do corpo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BODY_PARTS.map((part) => (
              <button
                key={part}
                onClick={() => setBodyPart(part)}
                className={`py-2.5 px-3 rounded-xl font-label text-xs font-bold text-left transition-all ${
                  bodyPart === part
                    ? 'kinetic-gradient text-on-primary'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {part}
              </button>
            ))}
          </div>
          {bodyPart === 'Outro' && (
            <input
              value={customPart}
              onChange={(e) => setCustomPart(e.target.value)}
              placeholder="Especifica a zona..."
              className="mt-3 w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>

        {/* Intensity */}
        <div>
          <label className="font-label text-xs font-bold uppercase tracking-widest text-secondary block mb-3">
            Intensidade da dor
          </label>
          <div className="space-y-2">
            {INTENSITY.map((i) => (
              <button
                key={i.value}
                onClick={() => setIntensity(i.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  intensity === i.value
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-surface-container-high border border-transparent hover:border-outline-variant'
                }`}
              >
                <span className="text-2xl">{i.icon}</span>
                <div>
                  <div className="font-headline font-bold text-sm text-on-surface">{i.label}</div>
                  <div className="font-label text-xs text-secondary">{i.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="font-label text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
            Descrição adicional (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Quando começou? Piora com algum movimento específico?"
            rows={3}
            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline resize-none outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={submit}
          disabled={!bodyPart || !intensity || saving}
          className="kinetic-gradient text-on-primary font-headline font-bold w-full py-3 rounded-xl active:scale-95 transition-all disabled:opacity-40"
        >
          {saving ? 'A enviar...' : 'Enviar reporte'}
        </button>
      </div>

      {Array.isArray(history) && history.length > 0 && (
        <div>
          <h2 className="font-headline font-bold text-sm text-on-surface mb-3">Histórico</h2>
          <div className="space-y-2">
            {history.map((r: any) => {
              const intensityColor = { MILD: 'text-amber-400', MODERATE: 'text-orange-400', SEVERE: 'text-red-400' }[r.intensity as string] ?? 'text-secondary';
              return (
                <div key={r.id} className={`bg-surface-container-lowest rounded-xl px-4 py-3 flex items-center gap-3 ${r.resolvedAt ? 'opacity-50' : ''}`}>
                  <div className="flex-1">
                    <div className="font-headline font-bold text-sm text-on-surface">{r.bodyPart}</div>
                    <div className="font-label text-xs text-secondary">{new Date(r.createdAt).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <span className={`font-label text-xs font-bold ${intensityColor}`}>
                    {{ MILD: 'Leve', MODERATE: 'Moderada', SEVERE: 'Severa' }[r.intensity as string]}
                  </span>
                  {r.resolvedAt && <span className="text-xs text-primary">✓ Resolvido</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
