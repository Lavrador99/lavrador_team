'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

export default function FormChecksPage() {
  const { data: checks = [] } = useSWR(`${API}/api/form-checks/my`, fetcher);

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
        body: JSON.stringify({ exerciseName, videoUrl, notes: notes || undefined }),
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
          <p className="font-label text-xs text-outline uppercase tracking-widest mb-1">Coach</p>
          <h1 className="font-headline font-black text-2xl text-on-surface">Análise de Forma</h1>
          <p className="font-label text-sm text-secondary mt-1">Submete vídeos para o teu PT analisar</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-4 py-2.5 rounded-xl"
        >
          + Novo
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-container-lowest rounded-xl p-5 mb-5 space-y-4">
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
              Exercício *
            </label>
            <input
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="Ex: Agachamento livre, Supino inclinado..."
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
              Link do vídeo *
            </label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/... ou Google Drive..."
              type="url"
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="font-label text-xs text-outline mt-1">YouTube, Google Drive, ou qualquer link partilhável</p>
          </div>
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que queres que o PT verifique? Posição das costas, profundidade..."
              rows={2}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline resize-none outline-none focus:ring-1 focus:ring-primary"
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

      {Array.isArray(checks) && checks.length === 0 ? (
        <div className="text-center py-16 text-secondary">
          <span className="material-symbols-outlined text-4xl text-outline mb-3 block">videocam</span>
          <p className="font-label text-sm">Ainda não tens pedidos de análise.</p>
          <p className="font-label text-xs text-outline mt-1">Grava um vídeo do teu exercício e partilha com o teu PT!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(checks as any[]).map((c) => (
            <div key={c.id} className="bg-surface-container-lowest rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-headline font-bold text-sm text-on-surface">{c.exerciseName}</div>
                  <div className="font-label text-xs text-secondary mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString('pt-PT')}
                  </div>
                </div>
                <span className={`font-label text-xs font-bold px-2 py-1 rounded-full ${
                  c.status === 'REVIEWED'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-container-high text-secondary'
                }`}>
                  {c.status === 'REVIEWED' ? '✓ Analisado' : '⏳ Pendente'}
                </span>
              </div>
              {c.notes && (
                <p className="font-label text-xs text-secondary bg-surface-container-high rounded-lg px-3 py-2 mb-2">
                  {c.notes}
                </p>
              )}
              {c.ptFeedback && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mt-2">
                  <p className="font-label text-xs text-primary font-bold mb-1">Feedback do PT</p>
                  <p className="font-body text-sm text-on-surface">{c.ptFeedback}</p>
                </div>
              )}
              <a
                href={c.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 font-label text-xs text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-sm">play_circle</span>
                Ver vídeo
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
