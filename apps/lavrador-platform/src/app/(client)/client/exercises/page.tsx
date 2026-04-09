'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { ExerciseDto } from '@libs/types';
import { exercisesApi, ExerciseFilters } from '../../../../lib/api/exercises.api';
import { ExerciseImageLoop } from '../../../../components/ExerciseImageLoop';
import { ExerciseLinkButton } from '../../../../components/ExerciseLinkButton';

const LEVEL_COLOR: Record<string, string> = { INICIANTE: '#42a5f5', INTERMEDIO: '#c8f542', AVANCADO: '#ff8c5a' };
const LEVEL_LABEL: Record<string, string> = { INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado' };
const PATTERN_LABEL: Record<string, string> = {
  empurrar_horizontal: 'Empurrar H.', empurrar_vertical: 'Empurrar V.',
  puxar_horizontal: 'Puxar H.', puxar_vertical: 'Puxar V.',
  dominante_joelho: 'Dom. Joelho', dominante_anca: 'Dom. Anca',
  core: 'Core', locomocao: 'Locomoção',
};

const inp = 'bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans focus:outline-none focus:border-accent placeholder-faint';


export default function ClientExercisesPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ExerciseFilters>({});
  const [selected, setSelected] = useState<ExerciseDto | null>(null);

  const { data: exercises = [], isLoading } = useSWR<ExerciseDto[]>(
    `client-exercises-${JSON.stringify(filters)}-${search}`,
    () => exercisesApi.getAll({ ...filters, search: search || undefined }),
  );

  const setFilter = (key: keyof ExerciseFilters, val: string) =>
    setFilters((f) => ({ ...f, [key]: val || undefined }));

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-syne font-black text-2xl text-white">Exercícios</h1>
        <p className="font-mono text-xs text-muted mt-1">// {exercises.length} exercícios na biblioteca</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar exercício..." className={`${inp} w-full`} />
        <div className="flex gap-2 flex-wrap">
          <select value={filters.level ?? ''} onChange={(e) => setFilter('level', e.target.value)}
            className={inp} style={{ background: '#111118' }}>
            <option value="">Todos os níveis</option>
            {Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filters.pattern ?? ''} onChange={(e) => setFilter('pattern', e.target.value)}
            className={inp} style={{ background: '#111118' }}>
            <option value="">Todos os padrões</option>
            {Object.entries(PATTERN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(filters.level || filters.pattern || search) && (
            <button onClick={() => { setFilters({}); setSearch(''); }}
              className="font-mono text-xs text-muted border border-border rounded-lg px-3 py-2 hover:text-white">
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      {/* Detail panel (modal-like on mobile) */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={() => setSelected(null)}>
          <div className="mt-auto bg-panel border-t border-border rounded-t-2xl overflow-y-auto max-h-[85dvh]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-syne font-bold text-base text-white leading-tight">{selected.name}</h2>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border inline-block mt-1"
                  style={{ color: LEVEL_COLOR[selected.level], borderColor: LEVEL_COLOR[selected.level] + '44' }}>
                  {LEVEL_LABEL[selected.level]}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted text-sm hover:text-white ml-4">✕</button>
            </div>
            {selected.gifUrl && (
              <div className="bg-[#0d0d13] flex justify-center border-b border-border">
                <ExerciseImageLoop gifUrl={selected.gifUrl} alt={selected.name} className="max-h-64 object-contain" />
              </div>
            )}
            <div className="p-5 space-y-4">
              {selected.primaryMuscles.length > 0 && (
                <div>
                  <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-2">Músculos principais</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.primaryMuscles.map((m) => (
                      <span key={m} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selected.secondaryMuscles.length > 0 && (
                <div>
                  <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-2">Músculos secundários</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.secondaryMuscles.map((m) => (
                      <span key={m} className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-border text-muted">
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(selected.clinicalNotes?.length ?? 0) > 0 && (
                <div className="bg-orange-400/5 border border-orange-400/25 rounded-xl p-3">
                  <p className="font-mono text-[9px] text-orange-300 uppercase tracking-widest mb-1">⚠ Notas clínicas</p>
                  {selected.clinicalNotes?.map((n) => (
                    <p key={n} className="font-mono text-[10px] text-muted">{n}</p>
                  ))}
                </div>
              )}
              {selected.pattern && (
                <div>
                  <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Padrão de movimento</p>
                  <p className="font-mono text-xs text-muted">{PATTERN_LABEL[selected.pattern] ?? selected.pattern}</p>
                </div>
              )}
              <ExerciseLinkButton name={selected.name} label="Ver exercício em vídeo" className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="py-16 font-mono text-sm text-muted text-center">A carregar...</div>
      ) : exercises.length === 0 ? (
        <div className="py-16 font-mono text-sm text-muted text-center">Nenhum exercício encontrado.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-6">
          {exercises.map((ex) => (
            <button key={ex.id} onClick={() => setSelected(ex)}
              className="bg-panel border border-border rounded-xl overflow-hidden text-left hover:border-accent/40 transition-colors active:scale-[0.98]">
              {ex.gifUrl ? (
                <div className="w-full h-28 bg-[#0d0d13] overflow-hidden">
                  <ExerciseImageLoop gifUrl={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" loop={false} />
                </div>
              ) : (
                <div className="w-full h-16 bg-[#0d0d13] flex items-center justify-center font-mono text-[10px] text-faint">sem imagem</div>
              )}
              <div className="p-3">
                <div className="font-syne font-bold text-xs text-white mb-1 line-clamp-2 leading-tight">{ex.name}</div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded border"
                    style={{ color: LEVEL_COLOR[ex.level], borderColor: LEVEL_COLOR[ex.level] + '44' }}>
                    {LEVEL_LABEL[ex.level]}
                  </span>
                  {ex.primaryMuscles[0] && (
                    <span className="font-mono text-[8px] text-faint truncate">{ex.primaryMuscles[0].replace(/_/g, ' ')}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
