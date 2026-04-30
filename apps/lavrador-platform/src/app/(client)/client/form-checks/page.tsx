'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json());

export default function FormChecksPage() {
  const { data: rawChecks } = useSWR(`${API}/api/form-checks/my`, fetcher);
  const checks = Array.isArray(rawChecks) ? rawChecks : [];

  const [exerciseName, setExerciseName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function submit() {
    if (!exerciseName.trim() || !videoUrl.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/form-checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          exerciseName,
          videoUrl,
          notes: notes || undefined,
        }),
      });
      mutate(`${API}/api/form-checks/my`);
      setExerciseName('');
      setVideoUrl('');
      setNotes('');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-label text-xs text-zinc-500 uppercase tracking-widest mb-1">
            Coach
          </p>
          <h1 className="font-headline font-black text-2xl text-white">
            Análise de Forma
          </h1>
          <p className="font-label text-sm text-zinc-400 mt-1">
            Submete vídeos para o teu PT analisar
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-4 py-2.5 rounded-xl"
        >
          + Novo
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 rounded-xl p-5 mb-5 space-y-4">
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              Exercício *
            </label>
            <input
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="Ex: Agachamento livre, Supino inclinado..."
              className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-[#84d4d3]"
            />
          </div>
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              Link do vídeo *
            </label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/... ou Google Drive..."
              type="url"
              className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-[#84d4d3]"
            />
            <p className="font-label text-xs text-zinc-500 mt-1">
              YouTube, Google Drive, ou qualquer link partilhável
            </p>
          </div>
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que queres que o PT verifique? Posição das costas, profundidade..."
              rows={2}
              className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 resize-none outline-none focus:ring-1 focus:ring-[#84d4d3]"
            />
          </div>
          <button
            onClick={submit}
            disabled={!exerciseName.trim() || !videoUrl.trim() || saving}
            className="kinetic-gradient text-on-primary font-headline font-bold w-full py-3 rounded-xl active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? 'A enviar...' : 'Enviar para análise'}
          </button>
        </div>
      )}

      {/* Pending section */}
      {Array.isArray(checks) && checks.filter((c: any) => c.status !== 'REVIEWED').length > 0 && (
        <div className="mb-5">
          <h2 className="font-headline font-bold text-sm text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Análises Pendentes
          </h2>
          <div className="space-y-2">
            {(checks as any[]).filter((c: any) => c.status !== 'REVIEWED').map((c: any) => (
              <div key={c.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="font-headline font-bold text-sm text-white">{c.exerciseName}</div>
                  <span className="font-label text-xs font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">⏳ Pendente</span>
                </div>
                <div className="font-label text-xs text-zinc-400">{new Date(c.createdAt).toLocaleDateString('pt-PT')}</div>
                {c.notes && <p className="font-label text-xs text-zinc-400 mt-1">{c.notes}</p>}
                <a href={c.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1.5 font-label text-xs text-[#84d4d3] hover:underline">
                  <span className="material-symbols-outlined text-sm">play_circle</span>Ver vídeo
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(checks) && checks.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <span className="material-symbols-outlined text-4xl text-zinc-500 mb-3 block">
            videocam
          </span>
          <p className="font-label text-sm">
            Ainda não tens pedidos de análise.
          </p>
          <p className="font-label text-xs text-zinc-500 mt-1">
            Grava um vídeo do teu exercício e partilha com o teu PT!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(checks as any[]).filter((c: any) => c.status === 'REVIEWED').length > 0 && (
            <h2 className="font-headline font-bold text-sm text-white mb-2">Analisadas</h2>
          )}
          {(checks as any[]).filter((c: any) => c.status === 'REVIEWED').map((c: any) => (
            <div key={c.id} className="bg-zinc-900 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-headline font-bold text-sm text-white">
                    {c.exerciseName}
                  </div>
                  <div className="font-label text-xs text-zinc-400 mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString('pt-PT')}
                  </div>
                </div>
                <span
                  className={`font-label text-xs font-bold px-2 py-1 rounded-full ${
                    c.status === 'REVIEWED'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {c.status === 'REVIEWED' ? '✓ Analisado' : '⏳ Pendente'}
                </span>
              </div>
              {c.notes && (
                <p className="font-label text-xs text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2 mb-2">
                  {c.notes}
                </p>
              )}
              {c.ptFeedback && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mt-2">
                  <p className="font-label text-xs text-[#84d4d3] font-bold mb-1">
                    Feedback do PT
                  </p>
                  <p className="font-body text-sm text-white">{c.ptFeedback}</p>
                </div>
              )}
              <a
                href={c.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 font-label text-xs text-[#84d4d3] hover:underline"
              >
                <span className="material-symbols-outlined text-sm">
                  play_circle
                </span>
                Ver vídeo
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
