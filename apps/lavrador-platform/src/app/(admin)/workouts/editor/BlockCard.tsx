'use client';
import { useState } from 'react';
import { WorkoutBlock, BlockType } from '@libs/types';
import { useWorkoutEditorStore } from '../../../../lib/stores/workoutEditorStore';
import { exercisesApi } from '../../../../lib/api/exercises.api';

const BLOCK_COLORS: Record<BlockType, string> = {
  WARMUP: '#42a5f5', SEQUENTIAL: '#c8f542', SUPERSET: '#a855f7',
  CIRCUIT: '#ff8c5a', TABATA: '#ff3b3b', CARDIO: '#06b6d4', FLEXIBILITY: '#10b981',
};
const BLOCK_LABELS: Record<BlockType, string> = {
  WARMUP: 'Aquecimento', SEQUENTIAL: 'Sequencial', SUPERSET: 'Superset',
  CIRCUIT: 'Circuito', TABATA: 'Tabata / HIIT', CARDIO: 'Cardio', FLEXIBILITY: 'Flexibilidade',
};
const CARDIO_METHODS = [
  { value: 'CONTINUO_EXTENSIVO', label: 'Contínuo Extensivo' },
  { value: 'CONTINUO_INTENSIVO', label: 'Contínuo Intensivo' },
  { value: 'CONTINUO_VARIAVEL', label: 'Contínuo Variável (Fartlek)' },
  { value: 'INTERVALADO', label: 'Intervalado' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'FARTLEK', label: 'Fartlek' },
];

const inp = 'bg-[#18181f] border border-[#2a2a35] rounded px-2 py-1.5 text-sm text-white outline-none focus:border-accent w-full placeholder-faint';
const smInp = 'bg-[#111118] border border-[#2a2a35] rounded px-2 py-1 text-xs text-white outline-none focus:border-accent w-18 placeholder-faint';

interface Props {
  block: WorkoutBlock;
  index: number;
  isDragging: boolean;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDrop: () => void;
}

export function BlockCard({ block, index, isDragging, onDragStart, onDragOver, onDrop }: Props) {
  const { updateBlock, removeBlock, addExercise, removeExercise, updateExercise } = useWorkoutEditorStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; primaryMuscles: string[] }[]>([]);
  const [searching, setSearching] = useState(false);

  const color = BLOCK_COLORS[block.type];

  const runSearch = async (text: string) => {
    setSearchText(text);
    if (!text.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await exercisesApi.getAll({ search: text });
      setSearchResults(res.slice(0, 8));
    } finally { setSearching(false); }
  };

  const updateTabata = (changes: object) => {
    const t = { ...block.tabata!, ...changes };
    t.totalSeconds = t.rounds * (t.workSeconds + t.restSeconds);
    updateBlock(block.id, { tabata: t });
  };

  const tabataTotal = block.tabata ? block.tabata.rounds * (block.tabata.workSeconds + block.tabata.restSeconds) : 0;

  return (
    <div
      className="mb-3 rounded-xl overflow-hidden transition-opacity"
      style={{
        border: `1px solid ${color}33`,
        borderLeft: `3px solid ${color}`,
        background: '#111118',
        opacity: isDragging ? 0.5 : 1,
      }}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e28]">
        <span className="text-faint cursor-grab text-base select-none">⠿</span>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded border flex-shrink-0 tracking-widest"
          style={{ color, background: color + '18', borderColor: color + '33' }}>
          {BLOCK_LABELS[block.type]}
        </span>
        <input
          value={block.label ?? ''}
          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
          placeholder="Nome do bloco..."
          className="flex-1 bg-transparent border-b border-[#2a2a35] text-white font-syne text-sm font-semibold px-1 py-0.5 outline-none focus:border-accent placeholder-faint"
        />
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted text-sm hover:text-white">{collapsed ? '▾' : '▴'}</button>
        <button onClick={() => removeBlock(block.id)} className="text-faint text-xs hover:text-red-400 ml-1">✕</button>
      </div>

      {!collapsed && (
        <div className="p-4">
          {/* TABATA config */}
          {block.type === 'TABATA' && block.tabata && (
            <div className="bg-red-400/6 border border-red-400/15 rounded-lg p-3 mb-4 flex flex-wrap items-end gap-3">
              {[
                { label: 'Trabalho (s)', val: block.tabata.workSeconds, key: 'workSeconds', def: 20 },
                { label: 'Repouso (s)', val: block.tabata.restSeconds, key: 'restSeconds', def: 10 },
                { label: 'Rounds', val: block.tabata.rounds, key: 'rounds', def: 8 },
              ].map(({ label, val, key, def }) => (
                <div key={key}>
                  <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">{label}</p>
                  <input type="number" value={val} min={1} onChange={(e) => updateTabata({ [key]: parseInt(e.target.value) || def })} className={inp + ' w-20'} />
                </div>
              ))}
              <span className="font-mono text-sm text-red-400 font-bold self-end pb-1">
                ⏱ {Math.floor(tabataTotal / 60)}:{String(tabataTotal % 60).padStart(2, '0')} min
              </span>
            </div>
          )}

          {/* CARDIO config */}
          {block.type === 'CARDIO' && (
            <div className="bg-cyan-400/6 border border-cyan-400/15 rounded-lg p-3 mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Método</p>
                <select value={block.cardioMethod ?? 'CONTINUO_EXTENSIVO'}
                  onChange={(e) => updateBlock(block.id, { cardioMethod: e.target.value as any })}
                  className={inp + ' text-xs'} style={{ background: '#18181f' }}>
                  {CARDIO_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Duração (min)</p>
                <input type="number" value={block.cardioDurationMin ?? 20} min={5} max={180}
                  onChange={(e) => updateBlock(block.id, { cardioDurationMin: parseInt(e.target.value) || 20 })} className={inp} />
              </div>
              <div>
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Zona FC baixa (bpm)</p>
                <input type="number" value={block.cardioZoneLow ?? ''} placeholder="ex: 130"
                  onChange={(e) => updateBlock(block.id, { cardioZoneLow: parseInt(e.target.value) || undefined })} className={inp} />
              </div>
              <div>
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Zona FC alta (bpm)</p>
                <input type="number" value={block.cardioZoneHigh ?? ''} placeholder="ex: 155"
                  onChange={(e) => updateBlock(block.id, { cardioZoneHigh: parseInt(e.target.value) || undefined })} className={inp} />
              </div>
            </div>
          )}

          {/* FLEXIBILITY config */}
          {(block.type === 'FLEXIBILITY' || block.type === 'WARMUP') && (
            <div className="bg-emerald-400/6 border border-emerald-400/15 rounded-lg p-3 mb-4 grid grid-cols-3 gap-3">
              <div>
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Método</p>
                <select value={block.stretchMethod ?? 'ESTATICO'}
                  onChange={(e) => updateBlock(block.id, { stretchMethod: e.target.value as any })}
                  className={inp + ' text-xs'} style={{ background: '#18181f' }}>
                  <option value="ESTATICO">Estático (10–30s)</option>
                  <option value="BALISTICO">Balístico (dinâmico)</option>
                  <option value="PNF">PNF (6s + 20s)</option>
                </select>
              </div>
              <div>
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Hold (s)</p>
                <input type="number" value={block.holdSeconds ?? 20}
                  onChange={(e) => updateBlock(block.id, { holdSeconds: parseInt(e.target.value) || 20 })} className={inp} />
              </div>
              {block.stretchMethod === 'PNF' && (
                <div>
                  <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Contração (s)</p>
                  <input type="number" value={block.contractionSeconds ?? 6}
                    onChange={(e) => updateBlock(block.id, { contractionSeconds: parseInt(e.target.value) || 6 })} className={inp} />
                </div>
              )}
            </div>
          )}

          {/* Rest settings */}
          {!['TABATA', 'CARDIO'].includes(block.type) && (
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Repouso entre séries (s)</p>
                <input type="number" value={block.restBetweenSets} min={0} max={600}
                  onChange={(e) => updateBlock(block.id, { restBetweenSets: parseInt(e.target.value) || 0 })} className={inp} />
              </div>
              <div className="flex-1">
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-1">Repouso após bloco (s)</p>
                <input type="number" value={block.restAfterBlock} min={0} max={600}
                  onChange={(e) => updateBlock(block.id, { restAfterBlock: parseInt(e.target.value) || 0 })} className={inp} />
              </div>
            </div>
          )}

          {/* Exercises */}
          {block.type !== 'CARDIO' && (
            <>
              <div className="flex flex-col gap-2 mb-3">
                {block.exercises.map((ex) => (
                  <div key={ex.id} className="bg-[#18181f] border border-[#2a2a35] rounded-lg p-3 flex gap-2 items-start">
                    <span className="text-[#2a2a35] cursor-grab text-sm pt-1 select-none">⠿</span>
                    <div className="flex-1">
                      <input
                        value={ex.exerciseName}
                        onChange={(e) => updateExercise(block.id, ex.id, { exerciseName: e.target.value })}
                        placeholder="Nome do exercício..."
                        className="w-full bg-transparent border-b border-[#2a2a35] text-white text-sm font-medium pb-1 mb-2 outline-none focus:border-accent placeholder-faint"
                      />
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'Séries', type: 'number', val: ex.sets, onChange: (v: string) => updateExercise(block.id, ex.id, { sets: parseInt(v) || 1 }), placeholder: '3', w: 'w-16' },
                          { label: 'Reps / Tempo', type: 'text', val: ex.reps, onChange: (v: string) => updateExercise(block.id, ex.id, { reps: v }), placeholder: '8-12', w: 'w-24' },
                          { label: 'Carga (kg)', type: 'number', val: ex.load ?? '', onChange: (v: string) => updateExercise(block.id, ex.id, { load: parseFloat(v) || undefined }), placeholder: '—', w: 'w-20' },
                          { label: '% 1RM', type: 'number', val: ex.percentRM ?? '', onChange: (v: string) => updateExercise(block.id, ex.id, { percentRM: parseInt(v) || undefined }), placeholder: '—', w: 'w-16' },
                          { label: 'RIR', type: 'number', val: ex.rir ?? '', onChange: (v: string) => updateExercise(block.id, ex.id, { rir: parseInt(v) || undefined }), placeholder: '—', w: 'w-14' },
                          { label: 'Tempo exec.', type: 'text', val: ex.tempoExecution ?? '', onChange: (v: string) => updateExercise(block.id, ex.id, { tempoExecution: v || undefined }), placeholder: '2:1:2:0', w: 'w-24' },
                          ...(!['SUPERSET', 'CIRCUIT'].includes(block.type) ? [{ label: 'Repouso (s)', type: 'number', val: ex.restAfterSet ?? '', onChange: (v: string) => updateExercise(block.id, ex.id, { restAfterSet: parseInt(v) || 0 }), placeholder: '90', w: 'w-20' }] : []),
                        ].map(({ label, type, val, onChange, placeholder, w }) => (
                          <div key={label}>
                            <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-0.5">{label}</p>
                            <input type={type} value={val as string} onChange={(e) => onChange(e.target.value)}
                              placeholder={placeholder} className={`${smInp} ${w}`} />
                          </div>
                        ))}
                      </div>
                      {ex.notes !== undefined && (
                        <input value={ex.notes ?? ''} onChange={(e) => updateExercise(block.id, ex.id, { notes: e.target.value })}
                          placeholder="Notas técnicas..." className="mt-2 w-full bg-transparent border-b border-dashed border-[#2a2a35] text-muted text-xs pb-1 outline-none focus:border-muted placeholder-faint" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => updateExercise(block.id, ex.id, { notes: ex.notes !== undefined ? undefined : '' })}
                        className={`text-sm ${ex.notes !== undefined ? 'text-accent' : 'text-faint'} hover:text-accent`}>✎</button>
                      <button onClick={() => removeExercise(block.id, ex.id)} className="text-faint text-xs hover:text-red-400">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add exercise */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => addExercise(block.id)}
                  className="font-mono text-xs bg-accent/8 border border-accent/20 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/12 transition-colors">
                  + Exercício manual
                </button>
                <button onClick={() => setShowSearch(!showSearch)}
                  className="font-mono text-xs border border-border text-muted px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-400 transition-colors">
                  🔍 Pesquisar base
                </button>
              </div>

              {showSearch && (
                <div className="mt-3 bg-[#0d0d13] border border-border rounded-xl p-3">
                  <input value={searchText} onChange={(e) => runSearch(e.target.value)}
                    placeholder="Pesquisar exercício..." className="w-full bg-[#18181f] border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent mb-2 placeholder-faint" />
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                    {searching && <p className="font-mono text-xs text-muted py-2">A pesquisar...</p>}
                    {!searching && searchResults.length === 0 && searchText && <p className="font-mono text-xs text-muted py-2">Sem resultados</p>}
                    {searchResults.map((ex) => (
                      <button key={ex.id} onClick={() => { addExercise(block.id, { exerciseId: ex.id, exerciseName: ex.name }); setShowSearch(false); setSearchText(''); setSearchResults([]); }}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/6 transition-colors text-left">
                        <span className="font-sans text-sm text-white">{ex.name}</span>
                        <span className="font-mono text-[10px] text-muted">{ex.primaryMuscles.slice(0, 2).join(', ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
