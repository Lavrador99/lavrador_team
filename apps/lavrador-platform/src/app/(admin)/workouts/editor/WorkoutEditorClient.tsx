'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlockType, ExerciseDto, WorkoutBlock } from '@libs/types';
import { useWorkoutEditorStore } from '../../../../lib/stores/workoutEditorStore';
import { workoutsApi } from '../../../../lib/api/workouts.api';
import { workoutTemplatesApi } from '../../../../lib/api/workout-templates.api';
import { exercisesApi } from '../../../../lib/api/exercises.api';
import { BlockCard } from './BlockCard';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCK_TYPES: { type: BlockType; icon: string; label: string; desc: string }[] = [
  { type: 'WARMUP',      icon: 'local_fire_department', label: 'Aquecimento',   desc: '5–10 min dinâmico' },
  { type: 'SEQUENTIAL',  icon: 'format_list_numbered',  label: 'Sequencial',    desc: 'Séries A, B, C...' },
  { type: 'SUPERSET',    icon: 'bolt',                  label: 'Superset',      desc: 'Agonista + Antagonista' },
  { type: 'CIRCUIT',     icon: 'loop',                  label: 'Circuito',      desc: 'Sem repouso' },
  { type: 'TABATA',      icon: 'timer',                 label: 'Tabata / HIIT', desc: '20s trabalho / 10s' },
  { type: 'CARDIO',      icon: 'directions_run',        label: 'Cardio',        desc: 'Contínuo / intervalado' },
  { type: 'FLEXIBILITY', icon: 'self_improvement',      label: 'Flexibilidade', desc: 'Estático, PNF' },
];

const PATTERN_LABEL: Record<string, string> = {
  DOMINANTE_JOELHO:    'Dominante de Joelho',
  DOMINANTE_ANCA:      'Dominante de Anca',
  EMPURRAR_HORIZONTAL: 'Empurrar Horizontal',
  EMPURRAR_VERTICAL:   'Empurrar Vertical',
  PUXAR_HORIZONTAL:    'Puxar Horizontal',
  PUXAR_VERTICAL:      'Puxar Vertical',
  CORE:                'Core',
  LOCOMOCAO:           'Locomoção',
};

function calcIntensity(sets: number): { label: string; color: string; dot: string } {
  if (sets < 12) return { label: 'Baixa',   color: 'text-emerald-600', dot: 'bg-emerald-400' };
  if (sets < 24) return { label: 'Média',   color: 'text-amber-600',   dot: 'bg-amber-400' };
  if (sets < 36) return { label: 'Alta',    color: 'text-orange-600',  dot: 'bg-orange-400' };
  return              { label: 'Máxima',  color: 'text-red-600',     dot: 'bg-red-400' };
}

// ─── Left nav items ───────────────────────────────────────────────────────────

const LEFT_NAV = [
  { id: 'library',     icon: 'exercise',       label: 'Exercícios' },
  { id: 'templates',   icon: 'folder_open',    label: 'Templates' },
  { id: 'history',     icon: 'history',        label: 'Histórico' },
  { id: 'calculators', icon: 'calculate',      label: 'Calculadoras' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { workoutId?: string }

export function WorkoutEditorClient({ workoutId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    blocks, name, dayLabel, programId, clientId, isDirty, saving, durationPreview, error,
    initNew, loadWorkout, setName, setDayLabel, addBlock, reorderBlocks,
    setDurationPreview, setSaving, setError, setWorkout, markClean,
    bulkSelectionActive, selectedExerciseIds, toggleBulkSelection, setAllSelected, clearSelection, bulkUpdateExercises,
  } = useWorkoutEditorStore();

  const [dragFrom, setDragFrom]           = useState<number | null>(null);
  const [dragOver, setDragOver]           = useState<number | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [savingTemplate, setSavingTemplate]   = useState(false);
  const [bulkSets, setBulkSets]           = useState('');
  const [bulkReps, setBulkReps]           = useState('');
  const [bulkRest, setBulkRest]           = useState('');
  const [activeNav, setActiveNav]         = useState('library');

  // Exercise library
  const [allExercises, setAllExercises]   = useState<ExerciseDto[]>([]);
  const [exSearch, setExSearch]           = useState('');
  const [exLoading, setExLoading]         = useState(false);
  const [addTarget, setAddTarget]         = useState<{ ex: ExerciseDto; open: boolean } | null>(null);

  const allExerciseIds = blocks.flatMap((b) => b.exercises.map((e) => e.id));
  const previewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init
  useEffect(() => {
    if (workoutId) {
      workoutsApi.getById(workoutId).then(loadWorkout).catch((e) => setError(e.message));
    } else {
      initNew({ programId: searchParams.get('programId') ?? '', clientId: searchParams.get('clientId') ?? '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  // Load exercise library
  useEffect(() => {
    setExLoading(true);
    exercisesApi.getAll().then(setAllExercises).catch(() => {}).finally(() => setExLoading(false));
  }, []);

  // Duration preview
  useEffect(() => {
    if (previewTimeout.current) clearTimeout(previewTimeout.current);
    previewTimeout.current = setTimeout(async () => {
      if (blocks.length > 0) {
        try {
          const result = await workoutsApi.previewDuration(blocks);
          setDurationPreview({ totalMin: result.totalMin, warning: result.warning });
        } catch { /* ignore */ }
      } else {
        setDurationPreview(null);
      }
    }, 800);
    return () => { if (previewTimeout.current) clearTimeout(previewTimeout.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // Stats
  const totalSets = blocks.flatMap((b) => b.exercises).reduce((acc, ex) => acc + ex.sets, 0);
  const intensity = calcIntensity(totalSets);

  // Drag-and-drop blocks
  const handleDrop = () => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) reorderBlocks(dragFrom, dragOver);
    setDragFrom(null); setDragOver(null);
  };

  // Save
  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      let result;
      const { workout } = useWorkoutEditorStore.getState();
      if (workout?.id) {
        result = await workoutsApi.update(workout.id, { name, dayLabel: dayLabel || undefined, blocks });
      } else {
        result = await workoutsApi.create({ programId, clientId, name, dayLabel: dayLabel || undefined, blocks });
      }
      setWorkout(result); markClean(); router.back();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao guardar');
    } finally { setSaving(false); }
  };

  const handleSaveAsTemplate = async () => {
    if (!name || blocks.length === 0) return;
    setSavingTemplate(true);
    try { await workoutTemplatesApi.create({ name, blocks, isPublic: false }); alert(`Template "${name}" guardado!`); }
    catch { alert('Erro ao guardar template.'); }
    finally { setSavingTemplate(false); }
  };

  // Exercise library helpers
  const filteredExercises = useMemo(() => {
    if (!exSearch.trim()) return allExercises;
    const q = exSearch.toLowerCase();
    return allExercises.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [allExercises, exSearch]);

  const groupedExercises = useMemo(() => {
    const groups = new Map<string, ExerciseDto[]>();
    for (const ex of filteredExercises) {
      const key = (ex as any).pattern ?? 'OTHER';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ex);
    }
    return groups;
  }, [filteredExercises]);

  const frequentExercises = allExercises.slice(0, 5);

  const backPath = programId ? `/workouts?programId=${programId}&clientId=${clientId}` : undefined;

  return (
    <div
      className="flex flex-col overflow-hidden -mx-6 md:-mx-10 -mt-6 md:-mt-10 bg-surface-container-low"
      style={{ height: '100vh' }}
    >

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-outline-variant">

        {/* Alerts */}
        {durationPreview?.warning && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-700 font-medium">
            ⚠ {durationPreview.warning}
          </div>
        )}
        {error && (
          <div onClick={() => setError(null)} className="bg-red-50 border-b border-red-200 px-6 py-2 text-xs text-red-600 font-medium cursor-pointer">
            {error} — clica para fechar
          </div>
        )}

        <div className="flex items-center gap-4 px-6 py-3.5">
          {/* Breadcrumb + title */}
          <div className="flex-1 min-w-0">
            <button onClick={() => backPath ? router.push(backPath) : router.back()}
              className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Treinos
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Título do treino..."
                className="font-headline font-black text-xl text-on-surface bg-transparent border-none outline-none placeholder-outline min-w-[180px] max-w-xs"
              />
              <select
                value={dayLabel}
                onChange={(e) => setDayLabel(e.target.value)}
                className="text-xs font-medium text-on-surface-variant bg-surface-container rounded-lg px-3 py-1.5 border border-outline-variant outline-none cursor-pointer"
              >
                <option value="">Dia / Etiqueta</option>
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo',
                  'Dia A', 'Dia B', 'Dia C', 'Dia D'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-5 flex-shrink-0">
            <div className="text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Est. Duração</div>
              <div className="font-headline font-black text-base text-on-surface">
                {durationPreview ? `${durationPreview.totalMin} min` : '— min'}
              </div>
            </div>
            <div className="h-8 w-px bg-outline-variant" />
            <div className="text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Total Séries</div>
              <div className="font-headline font-black text-base text-on-surface">{totalSets}</div>
            </div>
            <div className="h-8 w-px bg-outline-variant" />
            <div className="text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Intensidade</div>
              <div className={`font-headline font-black text-base ${intensity.color} flex items-center gap-1.5 justify-center`}>
                <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${intensity.dot}`} />
                {intensity.label}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {blocks.length > 0 && (
              <>
                <button
                  onClick={() => { toggleBulkSelection(); setBulkSets(''); setBulkReps(''); setBulkRest(''); }}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                    bulkSelectionActive
                      ? 'border-primary/40 text-primary bg-primary/5'
                      : 'border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm align-middle mr-1">select_all</span>
                  {bulkSelectionActive ? `${selectedExerciseIds.size} sel.` : 'Selecionar'}
                </button>
                <button onClick={handleSaveAsTemplate} disabled={savingTemplate}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary disabled:opacity-50 transition-colors">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">folder_copy</span>
                  Template
                </button>
              </>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 bg-primary text-white font-headline font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-primary-container transition-colors shadow-ambient"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                {saving ? 'sync' : isDirty ? 'save' : 'check_circle'}
              </span>
              {saving ? 'A guardar...' : isDirty ? 'Guardar Treino' : 'Guardado'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left nav ────────────────────────────────────────────────────── */}
        <div className="w-44 flex-shrink-0 bg-white border-r border-outline-variant flex flex-col">
          {/* Editor label */}
          <div className="px-4 pt-5 pb-4 border-b border-outline-variant">
            <div className="font-headline font-black text-sm text-on-surface">Workout Editor</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary mt-0.5">V2 · Active</div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {LEFT_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeNav === item.id
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl flex-shrink-0"
                  style={activeNav === item.id ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Add block */}
          <div className="p-3 border-t border-outline-variant">
            <button
              onClick={() => setShowBlockPicker(!showBlockPicker)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-headline font-bold text-xs py-3 rounded-xl hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Novo Bloco
            </button>
          </div>
        </div>

        {/* ── Center canvas ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>

          {/* Block picker */}
          {showBlockPicker && (
            <div className="bg-white border-b border-outline-variant px-6 py-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Escolher tipo de bloco</div>
              <div className="grid grid-cols-4 gap-2">
                {BLOCK_TYPES.map(({ type, icon, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => { addBlock(type); setShowBlockPicker(false); }}
                    className="bg-surface-container-low border border-outline-variant rounded-xl p-3 text-left hover:border-primary/40 hover:bg-primary/4 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-primary mb-1.5 block">{icon}</span>
                    <div className="font-headline font-bold text-sm text-on-surface mb-0.5">{label}</div>
                    <div className="text-[10px] text-on-surface-variant leading-tight">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bulk edit toolbar */}
          {bulkSelectionActive && (
            <div className="bg-primary/5 border-b border-primary/20 px-6 py-3 flex items-center gap-4 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Aplicar a selecionados</span>
              {[
                { label: 'Séries', val: bulkSets, set: setBulkSets, type: 'number', ph: '—', w: 'w-16' },
                { label: 'Reps',   val: bulkReps, set: setBulkReps, type: 'text',   ph: '—', w: 'w-20' },
                { label: 'Descanso (s)', val: bulkRest, set: setBulkRest, type: 'number', ph: '—', w: 'w-20' },
              ].map(({ label, val, set, type, ph, w }) => (
                <div key={label}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">{label}</p>
                  <input type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                    className={`bg-white border border-outline-variant rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary ${w}`} />
                </div>
              ))}
              <div className="flex items-end gap-2 ml-auto">
                <button onClick={() => setAllSelected(allExerciseIds)}
                  className="text-xs text-on-surface-variant hover:text-on-surface border border-outline-variant px-2 py-1.5 rounded-lg">
                  Todos ({allExerciseIds.length})
                </button>
                <button onClick={clearSelection} className="text-xs text-on-surface-variant hover:text-on-surface">Limpar</button>
                <button
                  disabled={selectedExerciseIds.size === 0}
                  onClick={() => {
                    const changes: Record<string, unknown> = {};
                    if (bulkSets) changes.sets = parseInt(bulkSets);
                    if (bulkReps) changes.reps = bulkReps;
                    if (bulkRest) changes.restAfterSet = parseInt(bulkRest);
                    if (Object.keys(changes).length > 0) bulkUpdateExercises(selectedExerciseIds, changes as any);
                  }}
                  className="bg-primary text-white font-headline font-bold text-xs px-4 py-1.5 rounded-lg disabled:opacity-40 hover:bg-primary-container transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}

          {/* Blocks */}
          <div className="p-6">
            {blocks.length === 0 ? (
              <div className="text-center py-24">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">fitness_center</span>
                <h2 className="font-headline font-black text-xl text-on-surface mb-2">Adiciona um bloco para começar</h2>
                <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                  Clica em <strong>Novo Bloco</strong> no painel esquerdo para adicionar o teu primeiro bloco de treino.
                </p>
              </div>
            ) : (
              blocks.map((block, i) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  index={i}
                  isDragging={dragFrom === i}
                  onDragStart={setDragFrom}
                  onDragOver={setDragOver}
                  onDrop={handleDrop}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right library panel ──────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 bg-white border-l border-outline-variant flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-outline-variant flex-shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Biblioteca de exercícios</div>
            <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-base text-outline">search</span>
              <input
                value={exSearch}
                onChange={(e) => setExSearch(e.target.value)}
                placeholder="Pesquisar exercícios..."
                className="flex-1 bg-transparent text-sm text-on-surface placeholder-outline outline-none"
              />
              {exSearch && (
                <button onClick={() => setExSearch('')}>
                  <span className="material-symbols-outlined text-base text-outline hover:text-on-surface">cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Exercise list */}
          <div className="flex-1 overflow-y-auto">
            {exLoading ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">A carregar...</div>
            ) : exSearch.trim() ? (
              /* Search results */
              <div className="p-3 space-y-1">
                {filteredExercises.length === 0 ? (
                  <div className="py-8 text-center text-sm text-on-surface-variant">Sem resultados</div>
                ) : filteredExercises.map((ex) => (
                  <ExerciseLibraryCard key={ex.id} ex={ex} blocks={blocks} onAdd={(blockId) => {
                    const { addExercise } = useWorkoutEditorStore.getState();
                    addExercise(blockId, { exerciseId: ex.id, exerciseName: ex.name });
                  }} />
                ))}
              </div>
            ) : (
              /* Grouped view */
              <>
                {/* Frequently used */}
                {frequentExercises.length > 0 && (
                  <div className="px-4 pt-4 pb-2">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                      Frequentemente Usados
                    </div>
                    <div className="space-y-1">
                      {frequentExercises.map((ex) => (
                        <ExerciseLibraryCard key={ex.id} ex={ex} blocks={blocks} onAdd={(blockId) => {
                          const { addExercise } = useWorkoutEditorStore.getState();
                          addExercise(blockId, { exerciseId: ex.id, exerciseName: ex.name });
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* By pattern */}
                {[...groupedExercises.entries()].map(([pattern, exs]) => (
                  <div key={pattern} className="px-4 pt-3 pb-2">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                      {PATTERN_LABEL[pattern] ?? pattern}
                    </div>
                    <div className="space-y-1">
                      {exs.slice(0, 6).map((ex) => (
                        <ExerciseLibraryCard key={ex.id} ex={ex} blocks={blocks} onAdd={(blockId) => {
                          const { addExercise } = useWorkoutEditorStore.getState();
                          addExercise(blockId, { exerciseId: ex.id, exerciseName: ex.name });
                        }} />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Editor tip */}
          <div className="px-4 py-3 border-t border-outline-variant flex-shrink-0">
            <div className="bg-primary/6 rounded-xl p-3 flex gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-primary mb-1">Editor Tip</div>
                <p className="text-[11px] text-on-surface-variant leading-snug">
                  Clica num exercício e escolhe o bloco onde o queres adicionar.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Exercise Library Card ────────────────────────────────────────────────────

function ExerciseLibraryCard({
  ex,
  blocks,
  onAdd,
}: {
  ex: ExerciseDto;
  blocks: WorkoutBlock[];
  onAdd: (blockId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-container transition-colors group text-left"
      >
        {(ex as any).gifUrl ? (
          <img src={(ex as any).gifUrl} alt={ex.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-base text-outline">fitness_center</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-on-surface truncate">{ex.name}</div>
          <div className="text-[10px] text-on-surface-variant truncate">
            {((ex as any).primaryMuscles ?? []).slice(0, 2).join(' / ') || '—'}
          </div>
        </div>
        <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary transition-colors">add_circle</span>
      </button>

      {/* Block picker dropdown */}
      {open && (
        <div className="absolute left-0 right-0 z-20 bg-white border border-outline-variant rounded-xl shadow-ambient-lg overflow-hidden mt-0.5">
          {blocks.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-on-surface-variant">Nenhum bloco criado ainda.</div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-outline-variant text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                Adicionar ao bloco
              </div>
              {blocks.map((b: WorkoutBlock) => (
                <button
                  key={b.id}
                  onClick={() => { onAdd(b.id); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-primary/6 hover:text-primary transition-colors"
                >
                  {b.label ?? b.type}
                </button>
              ))}
            </>
          )}
          <button onClick={() => setOpen(false)} className="w-full px-3 py-2 text-xs text-on-surface-variant hover:text-on-surface border-t border-outline-variant">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
