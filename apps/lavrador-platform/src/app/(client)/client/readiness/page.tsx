'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { ReadinessLogDto } from '@libs/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

const METRICS = [
  { key: 'sleep',    label: 'Qualidade do sono',   icons: ['😴', '😪', '😐', '😊', '🌟'], hint: '1 = muito mau, 5 = excelente' },
  { key: 'energy',   label: 'Nível de energia',    icons: ['🪫', '😴', '😐', '⚡', '🔥'], hint: '1 = esgotado, 5 = cheio de energia' },
  { key: 'stress',   label: 'Nível de stress',     icons: ['😌', '🙂', '😐', '😟', '😤'], hint: '1 = calmo, 5 = muito stressado' },
  { key: 'soreness', label: 'Dor muscular (DOMS)', icons: ['💚', '🟡', '🟠', '🔴', '🆘'], hint: '1 = nenhuma, 5 = muita dor' },
] as const;

type FormKey = 'sleep' | 'energy' | 'stress' | 'soreness';

function computeScore(vals: Record<FormKey, number>) {
  const positive = (vals.sleep + vals.energy) / 2;
  const negative = (vals.stress + vals.soreness) / 2;
  return Math.round(((positive - negative + 4) / 8) * 100);
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#c8f542' : score >= 40 ? '#f59e0b' : '#ef4444';
  const r = 36, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={90} height={90} className="-rotate-90">
        <circle cx={45} cy={45} r={r} fill="none" stroke="#1a1a24" strokeWidth={8} />
        <circle
          cx={45} cy={45} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="absolute font-headline font-black text-xl text-on-surface" style={{ marginTop: -52 }}>{score}</div>
      <p className="font-label text-xs text-secondary">Readiness score</p>
    </div>
  );
}

export default function ReadinessPage() {
  const { data: today } = useSWR<ReadinessLogDto | null>(
    `${API}/api/readiness/my/today`,
    fetcher,
  );
  const { data: history = [] } = useSWR<ReadinessLogDto[]>(
    `${API}/api/readiness/my?limit=14`,
    fetcher,
  );

  const [form, setForm] = useState<Record<FormKey, number>>({
    sleep: 3, energy: 3, stress: 3, soreness: 3,
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await fetch(`${API}/api/readiness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, notes: notes || undefined }),
      });
      mutate(`${API}/api/readiness/my/today`);
      mutate(`${API}/api/readiness/my?limit=14`);
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  const previewScore = computeScore(form);
  const alreadyCheckedIn = !!today;

  return (
    <div>
      <div className="mb-6">
        <p className="font-label text-xs text-outline uppercase tracking-widest mb-1">Diário</p>
        <h1 className="font-headline font-black text-2xl text-on-surface">Check-in de Prontidão</h1>
        <p className="font-label text-sm text-secondary mt-1">Como te sentes hoje?</p>
      </div>

      {(alreadyCheckedIn || done) ? (
        <div className="bg-surface-container-lowest rounded-xl p-6 text-center mb-6">
          <div className="text-4xl mb-3">✅</div>
          <div className="font-headline font-bold text-on-surface mb-1">Check-in feito!</div>
          <div className="font-label text-sm text-secondary">
            Score de hoje: <span className="text-primary font-bold">
              {today ? computeScore({ sleep: today.sleep, energy: today.energy, stress: today.stress, soreness: today.soreness }) : previewScore}/100
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl p-5 mb-6 space-y-5">
          <div className="flex justify-center relative" style={{ height: 90 }}>
            <ScoreRing score={previewScore} />
          </div>

          {METRICS.map(({ key, label, icons, hint }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{label}</label>
                <span className="font-label text-xs text-outline">{hint}</span>
              </div>
              <div className="flex gap-2 justify-between">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setForm((f) => ({ ...f, [key]: v }))}
                    className={`flex-1 rounded-xl py-3 flex flex-col items-center gap-1 transition-all text-xl ${
                      form[key] === v
                        ? 'bg-primary text-on-primary scale-105'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    {icons[v - 1]}
                    <span className="font-label text-xs font-bold">{v}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dormi mal, tenho reuniões stressantes..."
              rows={2}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline resize-none outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={submit}
            disabled={saving}
            className="kinetic-gradient text-on-primary font-headline font-bold w-full py-3 rounded-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'A guardar...' : 'Fazer check-in'}
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="font-headline font-bold text-sm text-on-surface mb-3">Últimos 14 dias</h2>
          <div className="space-y-2">
            {history.slice(0, 7).map((log) => {
              const score = computeScore({ sleep: log.sleep, energy: log.energy, stress: log.stress, soreness: log.soreness });
              const color = score >= 70 ? 'text-primary' : score >= 40 ? 'text-amber-400' : 'text-red-400';
              return (
                <div key={log.id} className="bg-surface-container-lowest rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="font-label text-sm text-on-surface">
                    {new Date(log.date).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="font-label text-xs text-secondary">
                      😴{log.sleep} ⚡{log.energy} 😤{log.stress} 💪{log.soreness}
                    </span>
                    <span className={`font-headline font-bold text-sm ${color}`}>{score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
