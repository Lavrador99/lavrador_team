'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { exercisesApi } from '../../../lib/api/exercises.api';
import { ExerciseDto } from '@libs/types';

const PATTERN_LABELS: Record<string, string> = {
  dominante_joelho: 'Dom. Joelho', dominante_anca: 'Dom. Anca',
  empurrar_horizontal: 'Emp. H.', empurrar_vertical: 'Emp. V.',
  puxar_horizontal: 'Pux. H.', puxar_vertical: 'Pux. V.',
  core: 'Core', locomocao: 'Locomoção',
};
const LEVEL_COLOR: Record<string, string> = {
  iniciante: '#42a5f5', intermedio: '#c8f542', avancado: '#ff8c5a',
};

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v'))
      return `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}?rel=0`;
    if (u.hostname === 'youtu.be')
      return `https://www.youtube-nocookie.com/embed${u.pathname}?rel=0`;
    return url;
  } catch { return null; }
}

export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [pattern, setPattern] = useState('');
  const [level, setLevel] = useState('');
  const [selected, setSelected] = useState<ExerciseDto | null>(null);

  const { data: exercises = [], isLoading } = useSWR<ExerciseDto[]>(
    ['exercises', pattern, level],
    () => exercisesApi.getAll({ pattern: pattern || undefined, level: level as any || undefined }),
  );

  const filtered = exercises.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-syne font-black text-2xl text-white mb-6">Exercícios</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent w-48"
        />
        <select value={pattern} onChange={(e) => setPattern(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans focus:outline-none focus:border-accent">
          <option value="">Todos os padrões</option>
          {Object.entries(PATTERN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans focus:outline-none focus:border-accent">
          <option value="">Todos os níveis</option>
          <option value="iniciante">Iniciante</option>
          <option value="intermedio">Intermédio</option>
          <option value="avancado">Avançado</option>
        </select>
        <span className="font-mono text-xs text-muted self-center">{filtered.length} exercícios</span>
      </div>

      {isLoading ? (
        <div className="py-20 font-mono text-sm text-muted text-center">A carregar...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="bg-panel border border-border rounded-xl overflow-hidden text-left hover:border-accent/40 transition-colors"
            >
              {/* Media */}
              {ex.gifUrl ? (
                <img src={ex.gifUrl} alt={ex.name} className="w-full h-36 object-cover bg-[#0d0d13]" loading="lazy" />
              ) : (
                <div className="w-full h-36 bg-[#0d0d13] flex items-center justify-center font-syne font-black text-3xl text-border">▦</div>
              )}
              <div className="p-3">
                <div className="font-sans font-semibold text-sm text-white mb-1 line-clamp-2">{ex.name}</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-muted">{PATTERN_LABELS[ex.pattern] ?? ex.pattern}</span>
                  <span className="font-mono text-[9px] font-bold" style={{ color: LEVEL_COLOR[ex.level] ?? '#888' }}>
                    {ex.level}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Exercise detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-panel border border-border rounded-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            {selected.videoUrl ? (
              <iframe
                src={toEmbedUrl(selected.videoUrl) ?? ''}
                className="w-full h-52"
                allowFullScreen
              />
            ) : selected.gifUrl ? (
              <img src={selected.gifUrl} alt={selected.name} className="w-full h-52 object-cover bg-[#0d0d13]" />
            ) : (
              <div className="w-full h-52 bg-[#0d0d13] flex items-center justify-center font-syne font-black text-5xl text-border">▦</div>
            )}
            <div className="p-5">
              <div className="font-syne font-black text-xl text-white mb-1">{selected.name}</div>
              <div className="flex gap-2 mb-3">
                <span className="font-mono text-[10px] text-accent bg-accent/10 border border-accent/20 rounded px-2 py-0.5">
                  {PATTERN_LABELS[selected.pattern] ?? selected.pattern}
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
                  style={{ color: LEVEL_COLOR[selected.level], background: LEVEL_COLOR[selected.level] + '18', borderColor: LEVEL_COLOR[selected.level] + '44' }}>
                  {selected.level}
                </span>
              </div>
              {selected.primaryMuscles?.length > 0 && (
                <div className="mb-2">
                  <span className="font-mono text-[10px] text-muted">Primários: </span>
                  <span className="font-mono text-[10px] text-white">{selected.primaryMuscles.join(', ')}</span>
                </div>
              )}
              {selected.clinicalNotes && selected.clinicalNotes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selected.clinicalNotes.map((n) => (
                    <span key={n} className="font-mono text-[9px] text-orange-400 bg-orange-400/5 border border-orange-400/20 rounded px-1.5 py-0.5">{n}</span>
                  ))}
                </div>
              )}
              <button onClick={() => setSelected(null)} className="mt-4 w-full font-mono text-xs text-muted hover:text-white border border-border rounded-lg py-2 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
