'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { ExerciseDto } from '@libs/types';
import { exercisesApi, ExerciseFilters } from '../../../../lib/api/exercises.api';
import { ExerciseImageLoop } from '../../../../components/ExerciseImageLoop';
import { ExerciseLinkButton } from '../../../../components/ExerciseLinkButton';

const LEVEL_STYLE: Record<string, string> = {
  INICIANTE: 'text-blue-400 bg-blue-400/10',
  INTERMEDIO: 'text-[#84d4d3] bg-[#005050]/30',
  AVANCADO:  'text-orange-400 bg-orange-400/10',
};
const LEVEL_LABEL: Record<string, string> = { INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado' };
const PATTERN_LABEL: Record<string, string> = {
  EMPURRAR_HORIZONTAL: 'Empurrar H.', EMPURRAR_VERTICAL: 'Empurrar V.',
  PUXAR_HORIZONTAL: 'Puxar H.', PUXAR_VERTICAL: 'Puxar V.',
  DOMINANTE_JOELHO: 'Dom. Joelho', DOMINANTE_ANCA: 'Dom. Anca',
  CORE: 'Core', LOCOMOCAO: 'Locomoção',
};

const darkInp = 'bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#84d4d3]/50 transition-colors placeholder:text-zinc-600';

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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Biblioteca</div>
        <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">Exercícios</h1>
        <p className="text-xs text-zinc-500 mt-1">{isLoading ? '…' : exercises.length} exercícios disponíveis</p>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-base">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar exercício..."
            className={`${darkInp} w-full pl-10`}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filters.level ?? ''} onChange={(e) => setFilter('level', e.target.value)} className={darkInp}>
            <option value="">Todos os níveis</option>
            {Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filters.pattern ?? ''} onChange={(e) => setFilter('pattern', e.target.value)} className={darkInp}>
            <option value="">Todos os padrões</option>
            {Object.entries(PATTERN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(filters.level || filters.pattern || search) && (
            <button
              onClick={() => { setFilters({}); setSearch(''); }}
              className="text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2 hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Detail drawer ────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/80 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div
            className="mt-auto bg-zinc-900 rounded-t-2xl overflow-y-auto max-h-[88dvh] border-t border-zinc-800/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-zinc-800/60">
              <div>
                <h2 className="font-[Manrope] font-bold text-base text-white leading-tight">{selected.name}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg inline-block mt-2 ${LEVEL_STYLE[selected.level] ?? 'text-zinc-400 bg-zinc-800'}`}>
                  {LEVEL_LABEL[selected.level]}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-white transition-colors ml-4">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            {selected.gifUrl ? (
              <div className="bg-zinc-800 flex justify-center border-b border-zinc-800/60">
                <ExerciseImageLoop gifUrl={selected.gifUrl} alt={selected.name} className="max-h-64 object-contain" />
              </div>
            ) : (
              <div className="bg-zinc-800 flex items-center justify-center h-32 border-b border-zinc-800/60">
                <span className="material-symbols-outlined text-5xl text-zinc-600">fitness_center</span>
              </div>
            )}
            <div className="p-5 space-y-4">
              {selected.primaryMuscles.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Músculos principais</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.primaryMuscles.map((m) => (
                      <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#005050]/30 text-[#84d4d3]">
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selected.secondaryMuscles.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Músculos secundários</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.secondaryMuscles.map((m) => (
                      <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(selected.clinicalNotes?.length ?? 0) > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Notas clínicas
                  </p>
                  {selected.clinicalNotes?.map((n) => (
                    <p key={n} className="text-xs text-orange-300 mt-1">{n}</p>
                  ))}
                </div>
              )}
              {selected.pattern && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Padrão de movimento</p>
                  <p className="text-xs text-zinc-400">{PATTERN_LABEL[selected.pattern] ?? selected.pattern}</p>
                </div>
              )}
              <ExerciseLinkButton name={selected.name} label="Ver exercício em vídeo" className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-16 text-sm text-zinc-500 text-center">A carregar...</div>
      ) : exercises.length === 0 ? (
        <div className="py-16 text-sm text-zinc-500 text-center">Nenhum exercício encontrado.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-6">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="bg-zinc-900 rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all border border-zinc-800/60"
            >
              {ex.gifUrl ? (
                <div className="w-full h-28 bg-zinc-800 overflow-hidden">
                  <ExerciseImageLoop gifUrl={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" loop={false} />
                </div>
              ) : (
                <div className="w-full h-20 bg-zinc-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-zinc-600">fitness_center</span>
                </div>
              )}
              <div className="p-3">
                <div className="font-semibold text-xs text-white mb-1.5 line-clamp-2 leading-tight">{ex.name}</div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-lg ${LEVEL_STYLE[ex.level] ?? 'text-zinc-400 bg-zinc-800'}`}>
                    {LEVEL_LABEL[ex.level]}
                  </span>
                  {ex.primaryMuscles[0] && (
                    <span className="text-[11px] text-zinc-600 truncate">{ex.primaryMuscles[0].replace(/_/g, ' ')}</span>
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
