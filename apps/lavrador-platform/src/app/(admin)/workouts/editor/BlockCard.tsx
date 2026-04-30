'use client';
import { useState } from 'react';
import { WorkoutBlock, BlockType } from '@libs/types';
import { useWorkoutEditorStore } from '../../../../lib/stores/workoutEditorStore';

// ─── Block type metadata ──────────────────────────────────────────────────────

const BLOCK_META: Record<BlockType, { color: string; bg: string; label: string; icon: string }> = {
  WARMUP:      { color: '#2196f3', bg: '#e3f2fd', label: 'Aquecimento',   icon: 'local_fire_department' },
  SEQUENTIAL:  { color: '#005050', bg: '#e0f4f4', label: 'Sequencial',    icon: 'format_list_numbered' },
  SUPERSET:    { color: '#7c3aed', bg: '#f3e8ff', label: 'Superset',      icon: 'bolt' },
  CIRCUIT:     { color: '#ea580c', bg: '#fff3e0', label: 'Circuito',      icon: 'loop' },
  TABATA:      { color: '#dc2626', bg: '#fef2f2', label: 'Tabata / HIIT', icon: 'timer' },
  CARDIO:      { color: '#0891b2', bg: '#ecfeff', label: 'Cardio',        icon: 'directions_run' },
  FLEXIBILITY: { color: '#059669', bg: '#f0fdf4', label: 'Flexibilidade', icon: 'self_improvement' },
};

const CARDIO_METHODS = [
  { value: 'CONTINUO_EXTENSIVO',  label: 'Contínuo Extensivo' },
  { value: 'CONTINUO_INTENSIVO',  label: 'Contínuo Intensivo' },
  { value: 'CONTINUO_VARIAVEL',   label: 'Contínuo Variável' },
  { value: 'INTERVALADO',         label: 'Intervalado' },
  { value: 'HIIT',                label: 'HIIT' },
  { value: 'FARTLEK',             label: 'Fartlek' },
  { value: 'CORRIDA_LEVE',        label: 'Corrida Leve (Z2 — conversa)' },
  { value: 'CORRIDA_PROGRESSIVA', label: 'Corrida Progressiva' },
  { value: 'CORRIDA_RITMO',       label: 'Corrida de Ritmo (Tempo Run)' },
  { value: 'CORRIDA_LONGA',       label: 'Corrida Longa' },
  { value: 'TREINO_PROVA',        label: 'Simulação de Prova / Contrarrelógio' },
  { value: 'POLIMENTO',           label: 'Polimento (Tapering)' },
];

// Superset/Circuit use A1,A2... ; others use 1,2,3
function exLabel(blockType: BlockType, idx: number): string | null {
  if (['SUPERSET', 'CIRCUIT'].includes(blockType)) return `A${idx + 1}`;
  if (blockType === 'SEQUENTIAL') return `${idx + 1}`;
  return null;
}

// Shared input styles
const cellInp = (w = 'w-16') =>
  `bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary transition-colors text-center ${w}`;
const labelCls = 'text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5 block';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  block: WorkoutBlock;
  index: number;
  isDragging: boolean;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDrop: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlockCard({ block, index, isDragging, onDragStart, onDragOver, onDrop }: Props) {
  const {
    updateBlock, removeBlock, addExercise, removeExercise, updateExercise,
    bulkSelectionActive, selectedExerciseIds, toggleExerciseSelection,
  } = useWorkoutEditorStore();

  const [collapsed, setCollapsed] = useState(false);

  const meta    = BLOCK_META[block.type];
  const isSuperset = ['SUPERSET', 'CIRCUIT'].includes(block.type);

  const tabataTotal = block.tabata
    ? block.tabata.rounds * (
        block.exercises.length * (block.tabata.workSeconds + (block.tabata.restBetweenExercises ?? block.tabata.restSeconds ?? 10))
        + (block.tabata.restBetweenCircuits ?? 60)
      )
    : 0;

  const updateTabata = (changes: object) => {
    const t = { ...block.tabata!, ...changes };
    t.totalSeconds = t.rounds * (
      block.exercises.length * (t.workSeconds + (t.restBetweenExercises ?? t.restSeconds ?? 10))
      + (t.restBetweenCircuits ?? 60)
    );
    updateBlock(block.id, { tabata: t });
  };

  return (
    <div
      className="mb-4 bg-white rounded-2xl overflow-hidden transition-all duration-150 shadow-ambient"
      style={{
        borderLeft: `4px solid ${meta.color}`,
        opacity: isDragging ? 0.45 : 1,
        border: `1px solid ${meta.color}22`,
        borderLeftWidth: '4px',
        borderLeftColor: meta.color,
      }}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={onDrop}
    >

      {/* ── Block header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: meta.bg + '80' }}>

        {/* Drag handle */}
        <span className="text-outline cursor-grab select-none text-base flex-shrink-0">⠿</span>

        {/* Block number + type badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded-lg"
            style={{ color: meta.color, background: meta.bg }}
          >
            Block {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ color: meta.color, background: meta.bg }}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
            {meta.label}
            {isSuperset && block.exercises.length > 0 && (
              <span className="ml-0.5 opacity-70">
                ({block.exercises.map((_, i) => `A${i + 1}`).join('/')})
              </span>
            )}
          </span>
        </div>

        {/* Block name */}
        <input
          value={block.label ?? ''}
          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
          placeholder={`Nome do bloco...`}
          className="flex-1 bg-transparent border-none text-on-surface font-headline font-semibold text-sm outline-none placeholder-outline min-w-0"
        />

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/60 text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-base">{collapsed ? 'expand_more' : 'expand_less'}</span>
          </button>
          <button onClick={() => removeBlock(block.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-outline hover:text-error transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-5 py-4">

          {/* ── TABATA config ─────────────────────────────────────────────── */}
          {block.type === 'TABATA' && block.tabata && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-red-700 mb-3">Configuração do circuito (aplicada a todos os exercícios)</div>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className={labelCls}>Execução (s)</label>
                  <input type="number" value={block.tabata.workSeconds} min={1}
                    onChange={(e) => updateTabata({ workSeconds: parseInt(e.target.value) || 1 })}
                    className={cellInp('w-20')} />
                </div>
                <div>
                  <label className={labelCls}>Descanso entre exercícios (s)</label>
                  <input type="number" value={block.tabata.restBetweenExercises ?? block.tabata.restSeconds ?? 10} min={0}
                    onChange={(e) => updateTabata({ restBetweenExercises: parseInt(e.target.value) || 0 })}
                    className={cellInp('w-20')} />
                </div>
                <div>
                  <label className={labelCls}>Descanso entre circuitos (s)</label>
                  <input type="number" value={block.tabata.restBetweenCircuits ?? 60} min={0}
                    onChange={(e) => updateTabata({ restBetweenCircuits: parseInt(e.target.value) || 0 })}
                    className={cellInp('w-20')} />
                </div>
                <div>
                  <label className={labelCls}>Nº de circuitos</label>
                  <input type="number" value={block.tabata.rounds} min={1}
                    onChange={(e) => updateTabata({ rounds: parseInt(e.target.value) || 1 })}
                    className={cellInp('w-20')} />
                </div>
                <div className="ml-auto self-end">
                  <span className="font-headline font-black text-base text-red-600">
                    ⏱ {Math.floor(tabataTotal / 60)}:{String(tabataTotal % 60).padStart(2, '0')} min
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── CARDIO config ─────────────────────────────────────────────── */}
          {block.type === 'CARDIO' && (
            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Método</label>
                <select value={block.cardioMethod ?? 'CONTINUO_EXTENSIVO'}
                  onChange={(e) => updateBlock(block.id, { cardioMethod: e.target.value as any })}
                  className="w-full bg-white border border-outline-variant rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary">
                  {CARDIO_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Duração (min)</label>
                <input type="number" value={block.cardioDurationMin ?? 20} min={5}
                  onChange={(e) => updateBlock(block.id, { cardioDurationMin: parseInt(e.target.value) || 20 })}
                  className={cellInp('w-full')} />
              </div>
              <div>
                <label className={labelCls}>FC baixa (bpm)</label>
                <input type="number" value={block.cardioZoneLow ?? ''} placeholder="130"
                  onChange={(e) => updateBlock(block.id, { cardioZoneLow: parseInt(e.target.value) || undefined })}
                  className={cellInp('w-full')} />
              </div>
              <div>
                <label className={labelCls}>FC alta (bpm)</label>
                <input type="number" value={block.cardioZoneHigh ?? ''} placeholder="155"
                  onChange={(e) => updateBlock(block.id, { cardioZoneHigh: parseInt(e.target.value) || undefined })}
                  className={cellInp('w-full')} />
              </div>
            </div>
          )}

          {/* ── WARMUP / FLEXIBILITY config ───────────────────────────────── */}
          {(block.type === 'FLEXIBILITY' || block.type === 'WARMUP') && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-4">
              <div>
                <label className={labelCls}>Método</label>
                <select value={block.stretchMethod ?? 'ESTATICO'}
                  onChange={(e) => updateBlock(block.id, { stretchMethod: e.target.value as any })}
                  className="bg-white border border-outline-variant rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary">
                  <option value="ESTATICO">Estático (10–30s)</option>
                  <option value="BALISTICO">Balístico (dinâmico)</option>
                  <option value="PNF">PNF (6s + 20s)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Hold (s)</label>
                <input type="number" value={block.holdSeconds ?? 20}
                  onChange={(e) => updateBlock(block.id, { holdSeconds: parseInt(e.target.value) || 20 })}
                  className={cellInp()} />
              </div>
              {block.stretchMethod === 'PNF' && (
                <div>
                  <label className={labelCls}>Contração (s)</label>
                  <input type="number" value={block.contractionSeconds ?? 6}
                    onChange={(e) => updateBlock(block.id, { contractionSeconds: parseInt(e.target.value) || 6 })}
                    className={cellInp()} />
                </div>
              )}
              <div>
                <label className={labelCls}>Duração (min)</label>
                <input type="number" value={block.cardioDurationMin ?? 10} min={1}
                  onChange={(e) => updateBlock(block.id, { cardioDurationMin: parseInt(e.target.value) || 10 })}
                  className={cellInp()} />
              </div>
            </div>
          )}

          {/* ── Rest settings ─────────────────────────────────────────────── */}
          {!['TABATA', 'CARDIO'].includes(block.type) && (
            <div className="flex gap-4 mb-4">
              <div>
                <label className={labelCls}>Descanso entre séries (s)</label>
                <input type="number" value={block.restBetweenSets} min={0}
                  onChange={(e) => updateBlock(block.id, { restBetweenSets: parseInt(e.target.value) || 0 })}
                  className={cellInp('w-24')} />
              </div>
              <div>
                <label className={labelCls}>Descanso após bloco (s)</label>
                <input type="number" value={block.restAfterBlock} min={0}
                  onChange={(e) => updateBlock(block.id, { restAfterBlock: parseInt(e.target.value) || 0 })}
                  className={cellInp('w-24')} />
              </div>
            </div>
          )}

          {/* ── Exercise table ────────────────────────────────────────────── */}
          {block.type !== 'CARDIO' && (
            <>
              {block.exercises.length > 0 && (
                <div className="mb-3 rounded-xl overflow-hidden border border-outline-variant">
                  {block.exercises.map((ex, exIdx) => {
                    const label = exLabel(block.type, exIdx);
                    const isSelected = bulkSelectionActive && selectedExerciseIds.has(ex.id);
                    return (
                      <div
                        key={ex.id}
                        className={`border-b border-outline-variant last:border-0 transition-colors ${
                          isSelected ? 'bg-primary/4' : 'hover:bg-surface-container-low/30'
                        }`}
                      >
                        {/* ── Row A: label + name + actions ───────────────── */}
                        <div className="flex items-center gap-3 px-4 pt-3 pb-1.5">
                          {/* Label (A1/A2 / 1/2 / checkbox) */}
                          {bulkSelectionActive ? (
                            <button onClick={() => toggleExerciseSelection(ex.id)}
                              className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-xs transition-colors ${
                                isSelected ? 'bg-primary border-primary text-white' : 'border-outline-variant'
                              }`}>{isSelected ? '✓' : ''}</button>
                          ) : label ? (
                            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{ color: meta.color, background: meta.bg }}>
                              {label}
                            </span>
                          ) : null}

                          {/* Exercise name */}
                          <div className="flex-1 min-w-0">
                            <input
                              value={ex.exerciseName}
                              onChange={(e) => updateExercise(block.id, ex.id, { exerciseName: e.target.value })}
                              placeholder="Nome do exercício..."
                              className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none placeholder-outline"
                            />
                            {ex.notes !== undefined && (
                              <input
                                value={ex.notes ?? ''}
                                onChange={(e) => updateExercise(block.id, ex.id, { notes: e.target.value })}
                                placeholder="Focus / notas..."
                                className="w-full bg-transparent text-[11px] text-on-surface-variant italic outline-none placeholder-outline mt-0.5"
                              />
                            )}
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => updateExercise(block.id, ex.id, { notes: ex.notes !== undefined ? undefined : '' })}
                              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${ex.notes !== undefined ? 'text-primary' : 'text-outline hover:text-on-surface-variant'}`}
                              title="Notas"
                            >
                              <span className="material-symbols-outlined text-base">edit_note</span>
                            </button>
                            <button onClick={() => removeExercise(block.id, ex.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-outline hover:text-error transition-colors">
                              <span className="material-symbols-outlined text-base">delete_outline</span>
                            </button>
                          </div>
                        </div>

                        {/* ── Row B: primary inputs ────────────────────────── */}
                        <div className="flex flex-wrap items-end gap-3 px-4 pb-1.5">
                          {/* Séries × Reps */}
                          <div>
                            <label className={labelCls}>Séries × Reps</label>
                            <div className="flex items-center gap-0">
                              <input type="number" value={ex.sets} min={1}
                                onChange={(e) => updateExercise(block.id, ex.id, { sets: parseInt(e.target.value) || 1 })}
                                className="w-10 bg-surface-container-low border border-outline-variant rounded-l-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary text-center" />
                              <span className="text-[10px] text-on-surface-variant bg-surface-container-low border-y border-outline-variant px-1.5 py-1.5 leading-none select-none">×</span>
                              <input type="text" value={ex.reps ?? ''} placeholder="6-8"
                                onChange={(e) => updateExercise(block.id, ex.id, { reps: e.target.value })}
                                className="w-14 bg-surface-container-low border border-outline-variant rounded-r-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary text-center" />
                            </div>
                          </div>

                          {/* Carga */}
                          <div>
                            <label className={labelCls}>Carga (kg)</label>
                            <input type="number" value={ex.load ?? ''} placeholder="—"
                              onChange={(e) => updateExercise(block.id, ex.id, { load: parseFloat(e.target.value) || undefined })}
                              className={cellInp('w-20')} step={0.5} />
                          </div>

                          {/* Descanso — per exercise (hidden for SUPERSET/CIRCUIT which use block-level) */}
                          {!isSuperset && (
                            <div>
                              <label className={labelCls}>Desc. (s)</label>
                              <input type="number" value={ex.restAfterSet ?? ''} placeholder="90"
                                onChange={(e) => updateExercise(block.id, ex.id, { restAfterSet: parseInt(e.target.value) || undefined })}
                                className={cellInp('w-20')} />
                            </div>
                          )}
                        </div>

                        {/* ── Row C: secondary inputs ──────────────────────── */}
                        <div className="flex flex-wrap items-end gap-3 px-4 pb-3">
                          {/* Tempo */}
                          <div>
                            <label className={labelCls}>Tempo Exec.</label>
                            <input type="text" value={ex.tempoExecution ?? ''} placeholder="2-1-2-0"
                              onChange={(e) => updateExercise(block.id, ex.id, { tempoExecution: e.target.value || undefined })}
                              className={cellInp('w-24')} />
                          </div>

                          {/* RIR */}
                          <div>
                            <label className={labelCls}>RIR</label>
                            <input type="number" value={ex.rir ?? ''} placeholder="—"
                              onChange={(e) => updateExercise(block.id, ex.id, { rir: parseInt(e.target.value) || undefined })}
                              className={cellInp('w-16')} min={0} max={10} />
                          </div>

                          {/* %1RM */}
                          <div>
                            <label className={labelCls}>%1RM</label>
                            <input type="number" value={ex.percentRM ?? ''} placeholder="—"
                              onChange={(e) => updateExercise(block.id, ex.id, { percentRM: parseInt(e.target.value) || undefined })}
                              className={cellInp('w-16')} min={0} max={100} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hint when no exercises yet */}
              {block.exercises.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-outline-variant text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  Seleciona um exercício no painel direito para adicionar a este bloco.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
