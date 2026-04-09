'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlockType } from '@libs/types';
import { useWorkoutEditorStore } from '../../../../lib/stores/workoutEditorStore';
import { workoutsApi } from '../../../../lib/api/workouts.api';
import { workoutTemplatesApi } from '../../../../lib/api/workout-templates.api';
import { BlockCard } from './BlockCard';

const BLOCK_TYPES: { type: BlockType; emoji: string; label: string; desc: string }[] = [
  { type: 'WARMUP',      emoji: '🔥', label: 'Aquecimento',   desc: '5–10 min dinâmico' },
  { type: 'SEQUENTIAL',  emoji: '📋', label: 'Sequencial',    desc: 'Séries normais A, B, C...' },
  { type: 'SUPERSET',    emoji: '⚡', label: 'Superset',      desc: 'Agonista + Antagonista' },
  { type: 'CIRCUIT',     emoji: '🔄', label: 'Circuito',      desc: 'Sem repouso entre exercícios' },
  { type: 'TABATA',      emoji: '⏱', label: 'Tabata / HIIT', desc: '20s trabalho / 10s repouso' },
  { type: 'CARDIO',      emoji: '🏃', label: 'Cardio',        desc: 'Contínuo, intervalado, fartlek' },
  { type: 'FLEXIBILITY', emoji: '🧘', label: 'Flexibilidade', desc: 'Estático, PNF, balístico' },
];

interface Props {
  workoutId?: string;
}

export function WorkoutEditorClient({ workoutId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    blocks, name, dayLabel, programId, clientId, isDirty, saving, durationPreview, error,
    initNew, loadWorkout, setName, setDayLabel, addBlock, reorderBlocks,
    setDurationPreview, setSaving, setError, setWorkout, markClean,
  } = useWorkoutEditorStore();

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const previewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init
  useEffect(() => {
    if (workoutId) {
      workoutsApi.getById(workoutId).then(loadWorkout).catch((e) => setError(e.message));
    } else {
      initNew({
        programId: searchParams.get('programId') ?? '',
        clientId: searchParams.get('clientId') ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  // Auto preview duration
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

  const handleDrop = () => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      reorderBlocks(dragFrom, dragOver);
    }
    setDragFrom(null);
    setDragOver(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let result;
      const workout = useWorkoutEditorStore.getState().workout;
      if (workout?.id) {
        result = await workoutsApi.update(workout.id, { name, dayLabel: dayLabel || undefined, blocks });
      } else {
        result = await workoutsApi.create({ programId, clientId, name, dayLabel: dayLabel || undefined, blocks });
      }
      setWorkout(result);
      markClean();
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!name || blocks.length === 0) return;
    setSavingTemplate(true);
    try {
      await workoutTemplatesApi.create({ name, blocks, isPublic: false });
      alert(`Template "${name}" guardado!`);
    } catch { alert('Erro ao guardar template.'); }
    finally { setSavingTemplate(false); }
  };

  const backPath = programId ? `/workouts?programId=${programId}&clientId=${clientId}` : undefined;

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-[#0d0d13] flex-wrap">
        <button onClick={() => backPath ? router.push(backPath) : router.back()}
          className="font-mono text-xs text-muted hover:text-accent flex-shrink-0">← Treinos</button>
        <div className="flex-1 flex flex-col gap-1">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do treino..."
            className="bg-transparent border-b border-[#2a2a35] text-white font-syne text-lg font-black pb-0.5 outline-none focus:border-accent placeholder-faint" />
          <input value={dayLabel} onChange={(e) => setDayLabel(e.target.value)} placeholder="Dia / etiqueta (ex: Dia A, Segunda)"
            className="bg-transparent border-none text-muted font-mono text-xs pb-0.5 outline-none placeholder-faint" />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {durationPreview && (
            <span className={`font-mono text-xs px-3 py-1 rounded border ${durationPreview.warning ? 'text-orange-400 border-orange-400/20 bg-orange-400/8' : 'text-accent border-accent/20 bg-accent/8'}`}>
              ⏱ ~{durationPreview.totalMin} min{durationPreview.warning ? ' ⚠' : ''}
            </span>
          )}
          {blocks.length > 0 && (
            <button onClick={handleSaveAsTemplate} disabled={savingTemplate}
              className="font-mono text-xs border border-border text-muted px-3 py-1.5 rounded-lg hover:border-muted hover:text-white disabled:opacity-50 transition-colors">
              {savingTemplate ? '...' : '◫ Template'}
            </button>
          )}
          <button onClick={handleSave} disabled={saving || !isDirty}
            className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-accent/90 transition-colors">
            {saving ? 'A guardar...' : isDirty ? 'Guardar' : 'Guardado ✓'}
          </button>
        </div>
      </div>

      {durationPreview?.warning && (
        <div className="bg-orange-400/8 border-b border-orange-400/20 px-6 py-2 font-mono text-xs text-orange-400">
          {durationPreview.warning}
        </div>
      )}

      {error && (
        <div onClick={() => setError(null)} className="bg-red-400/8 border-b border-red-400/20 px-6 py-2 font-mono text-xs text-red-400 cursor-pointer">
          {error} (clica para fechar)
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 p-6 overflow-y-auto" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {blocks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="font-syne font-black text-xl text-white mb-2">Adiciona um bloco para começar</h2>
            <p className="font-mono text-xs text-muted max-w-sm mx-auto leading-relaxed">
              Escolhe o tipo de bloco abaixo — sequencial, superset, tabata, cardio ou flexibilidade.
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

      {/* Add block bar */}
      <div className="border-t border-border bg-[#0d0d13] px-6 py-4">
        <button onClick={() => setShowBlockPicker(!showBlockPicker)}
          className="bg-accent/8 border border-accent/20 text-accent font-mono text-xs px-5 py-2.5 rounded-lg hover:bg-accent/14 transition-colors">
          {showBlockPicker ? '▴ Fechar' : '+ Adicionar Bloco'}
        </button>
        {showBlockPicker && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {BLOCK_TYPES.map(({ type, emoji, label, desc }) => (
              <button key={type} onClick={() => { addBlock(type); setShowBlockPicker(false); }}
                className="bg-panel border border-border rounded-xl p-3 text-left hover:border-accent/30 transition-colors">
                <div className="text-xl mb-1">{emoji}</div>
                <div className="font-syne font-bold text-sm text-white mb-0.5">{label}</div>
                <div className="font-mono text-[10px] text-faint">{desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
