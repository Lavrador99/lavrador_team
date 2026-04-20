'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WorkoutDto } from '@libs/types';
import { workoutsApi } from '../../../../lib/api/workouts.api';
import { downloadPdf } from '../../../../lib/pdf/downloadPdf';
import { WorkoutPlanPdf } from '../../../../lib/pdf/WorkoutPlanPdf';
import { createElement } from 'react';

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: 'Aquecimento', SEQUENTIAL: 'Sequencial', SUPERSET: 'Superset',
  CIRCUIT: 'Circuito', TABATA: 'Tabata', CARDIO: 'Cardio', FLEXIBILITY: 'Flexibilidade',
};
const BLOCK_TYPE_STYLE: Record<string, string> = {
  WARMUP:      'text-blue-700 bg-blue-50',
  SEQUENTIAL:  'text-primary bg-primary-fixed',
  SUPERSET:    'text-orange-700 bg-orange-50',
  CIRCUIT:     'text-purple-700 bg-purple-50',
  TABATA:      'text-pink-700 bg-pink-50',
  CARDIO:      'text-teal-700 bg-teal-50',
  FLEXIBILITY: 'text-sky-700 bg-sky-50',
};

export default function MyPlanPage() {
  const router = useRouter();
  const { data: workouts = [], isLoading, error } = useSWR<WorkoutDto[]>('my-workouts', workoutsApi.getMy);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  async function handleExportPdf() {
    if (!workouts.length || exporting) return;
    setExporting(true);
    try {
      await downloadPdf('plano-treino.pdf', createElement(WorkoutPlanPdf, { workouts }) as any);
    } finally {
      setExporting(false);
    }
  }

  function toggleBlock(blockId: string) {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId); else next.add(blockId);
      return next;
    });
  }

  if (isLoading) return <div className="py-20 text-sm text-secondary text-center">A carregar o teu plano...</div>;
  if (error) return <div className="py-20 text-sm text-error text-center">Não foi possível carregar o plano.</div>;
  if (!workouts.length) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-3 block">fitness_center</span>
        <p className="text-sm text-secondary">Ainda não tens nenhum plano activo.<br />Fala com o teu treinador para começar!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <span className="label-category text-primary">Treino</span>
        <div className="flex items-start justify-between gap-3 mt-1">
          <div>
            <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">O meu plano</h1>
            <p className="text-sm text-secondary mt-1">{workouts.length} treino{workouts.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 flex-shrink-0 mt-1"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            {exporting ? 'A gerar...' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {workouts.map((workout) => (
          <div key={workout.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
            {/* Progress blade */}
            <div className="progress-blade" />

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 gap-4">
              <div>
                <div className="label-category text-primary mb-1 flex items-center gap-2">
                  {workout.dayLabel ?? `Treino ${workout.order + 1}`}
                  {workout.status === 'DRAFT' && (
                    <span className="label-category bg-surface-container text-secondary px-1.5 py-0.5 rounded">rascunho</span>
                  )}
                </div>
                <div className="font-headline font-bold text-lg text-on-surface">{workout.name}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="font-label text-xs text-secondary bg-surface-container-high rounded-lg px-3 py-1.5 whitespace-nowrap flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {workout.durationEstimatedMin} min
                </div>
                <button
                  onClick={() => router.push(`/client/my-plan/log/${workout.id}`)}
                  className="kinetic-gradient text-on-primary font-headline font-bold text-xs px-4 py-2 rounded-lg whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
                >
                  Iniciar
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Blocks */}
            <div className="px-4 pb-4 flex flex-col gap-2">
              {workout.blocks.map((block) => {
                const blockStyle = BLOCK_TYPE_STYLE[block.type] ?? 'text-secondary bg-surface-container';
                const isOpen = expandedBlocks.has(block.id);
                return (
                  <div key={block.id} className="bg-surface-container-low rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleBlock(block.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-container"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`label-category px-2 py-0.5 rounded ${blockStyle}`}>
                          {BLOCK_TYPE_LABELS[block.type] ?? block.type}
                        </span>
                        {block.label && <span className="font-body text-sm font-semibold text-on-surface">{block.label}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="label-category">{block.exercises.length} ex.</span>
                        <span className="material-symbols-outlined text-outline text-sm" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          expand_more
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-outline-variant/10">
                        {/* Cardio info */}
                        {block.type === 'CARDIO' && (
                          <div className="flex flex-wrap gap-2 py-3">
                            {block.cardioMethod && <span className="label-category bg-surface-container px-2 py-1 rounded">Método: {block.cardioMethod.replace(/_/g, ' ')}</span>}
                            {block.cardioDurationMin && <span className="label-category bg-surface-container px-2 py-1 rounded">Duração: {block.cardioDurationMin} min</span>}
                            {block.cardioZoneLow && block.cardioZoneHigh && <span className="label-category bg-surface-container px-2 py-1 rounded">FC: {block.cardioZoneLow}–{block.cardioZoneHigh} bpm</span>}
                          </div>
                        )}
                        {/* Tabata info */}
                        {block.type === 'TABATA' && block.tabata && (
                          <div className="flex flex-wrap gap-2 py-3">
                            <span className="label-category bg-surface-container px-2 py-1 rounded">Trabalho: {block.tabata.workSeconds}s</span>
                            <span className="label-category bg-surface-container px-2 py-1 rounded">Descanso: {block.tabata.restSeconds}s</span>
                            <span className="label-category bg-surface-container px-2 py-1 rounded">Rounds: {block.tabata.rounds}</span>
                          </div>
                        )}
                        {/* Exercise table */}
                        <table className="w-full mt-3 border-collapse">
                          <thead>
                            <tr className="border-b border-outline-variant/10">
                              {['Exercício', 'Séries', 'Reps', 'Carga', 'Desc.'].map((h, i) => (
                                <th key={h} className={`label-category py-2 px-2 font-normal ${i > 0 ? 'text-center' : 'text-left'}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.exercises.map((ex) => (
                              <tr key={ex.id} className="border-b border-outline-variant/5 last:border-0">
                                <td className="px-2 py-2.5 align-top">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-body text-sm font-medium text-on-surface">{ex.exerciseName}</span>
                                    <button
                                      onClick={() => router.push(`/client/exercise-history/${encodeURIComponent(ex.exerciseName)}`)}
                                      className="text-outline hover:text-primary transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-sm">insights</span>
                                    </button>
                                  </div>
                                  {ex.notes && <div className="label-category mt-0.5 italic">{ex.notes}</div>}
                                  {ex.loadNote && <div className="label-category mt-0.5">{ex.loadNote}</div>}
                                </td>
                                <td className="px-2 py-2.5 text-center font-label text-xs text-secondary">{ex.sets}×</td>
                                <td className="px-2 py-2.5 text-center font-label text-xs text-secondary">{ex.reps}</td>
                                <td className="px-2 py-2.5 text-center font-label text-xs text-secondary">
                                  {ex.load ? `${ex.load} kg` : ex.percentRM ? `${ex.percentRM}% RM` : '—'}
                                </td>
                                <td className="px-2 py-2.5 text-center font-label text-xs text-secondary">
                                  {ex.restAfterSet ? `${ex.restAfterSet}s` : block.restBetweenSets ? `${block.restBetweenSets}s` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
