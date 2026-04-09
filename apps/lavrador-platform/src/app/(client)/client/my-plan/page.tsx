'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WorkoutDto } from '@libs/types';
import { workoutsApi } from '../../../../lib/api/workouts.api';

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: 'Aquecimento', SEQUENTIAL: 'Sequencial', SUPERSET: 'Superset',
  CIRCUIT: 'Circuito', TABATA: 'Tabata', CARDIO: 'Cardio', FLEXIBILITY: 'Flexibilidade',
};
const BLOCK_TYPE_COLOR: Record<string, string> = {
  WARMUP: '#42a5f5', SEQUENTIAL: '#c8f542', SUPERSET: '#ff8c5a',
  CIRCUIT: '#c084fc', TABATA: '#f472b6', CARDIO: '#34d399', FLEXIBILITY: '#60a5fa',
};

export default function MyPlanPage() {
  const router = useRouter();
  const { data: workouts = [], isLoading, error } = useSWR<WorkoutDto[]>('my-workouts', workoutsApi.getMy);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  function toggleBlock(blockId: string) {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId); else next.add(blockId);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="py-20 font-mono text-sm text-muted text-center">A carregar o teu plano...</div>
    );
  }
  if (error) {
    return (
      <div className="py-20 font-mono text-sm text-red-400 text-center">Não foi possível carregar o plano.</div>
    );
  }
  if (!workouts.length) {
    return (
      <div className="py-20 text-center">
        <div className="font-mono text-sm text-muted leading-relaxed">
          Ainda não tens nenhum plano activo.<br />
          Fala com o teu treinador para começar!
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="font-syne font-black text-2xl text-white">O meu plano</h1>
        <span className="font-mono text-xs text-muted">// {workouts.length} treino{workouts.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col gap-5">
        {workouts.map((workout) => (
          <div key={workout.id} className="bg-panel border border-border rounded-xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border gap-4">
              <div>
                <div className="font-mono text-[10px] text-accent tracking-[2px] uppercase mb-1 flex items-center gap-2">
                  {workout.dayLabel ?? `Treino ${workout.order + 1}`}
                  {workout.status === 'DRAFT' && (
                    <span className="text-muted bg-[#18181f] border border-[#2a2a35] rounded px-1.5 py-0.5 text-[9px]">rascunho</span>
                  )}
                </div>
                <div className="font-syne font-bold text-lg text-white">{workout.name}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="font-mono text-xs text-muted bg-[#18181f] border border-[#2a2a35] rounded-lg px-3 py-1.5 whitespace-nowrap">
                  ⏱ {workout.durationEstimatedMin} min
                </div>
                <button
                  onClick={() => router.push(`/client/my-plan/log/${workout.id}`)}
                  className="bg-accent text-dark font-syne font-black text-xs px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors whitespace-nowrap"
                >
                  Iniciar →
                </button>
              </div>
            </div>

            {/* Blocks */}
            <div className="p-4 flex flex-col gap-2">
              {workout.blocks.map((block) => {
                const color = BLOCK_TYPE_COLOR[block.type] ?? '#666677';
                const isOpen = expandedBlocks.has(block.id);
                return (
                  <div key={block.id} className="bg-[#0d0d13] border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleBlock(block.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/[0.03] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="font-mono text-[10px] tracking-wide px-2 py-0.5 rounded border"
                          style={{ color, background: color + '18', borderColor: color + '44' }}
                        >
                          {BLOCK_TYPE_LABELS[block.type] ?? block.type}
                        </span>
                        {block.label && <span className="font-sans text-sm font-semibold text-white">{block.label}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-faint">{block.exercises.length} ex.</span>
                        <span className={`text-faint text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-border">
                        {/* Cardio info */}
                        {block.type === 'CARDIO' && (
                          <div className="flex flex-wrap gap-2 py-3">
                            {block.cardioMethod && <span className="font-mono text-[11px] text-muted bg-[#18181f] border border-[#2a2a35] rounded px-2 py-1">Método: {block.cardioMethod.replace(/_/g, ' ')}</span>}
                            {block.cardioDurationMin && <span className="font-mono text-[11px] text-muted bg-[#18181f] border border-[#2a2a35] rounded px-2 py-1">Duração: {block.cardioDurationMin} min</span>}
                            {block.cardioZoneLow && block.cardioZoneHigh && <span className="font-mono text-[11px] text-muted bg-[#18181f] border border-[#2a2a35] rounded px-2 py-1">FC: {block.cardioZoneLow}–{block.cardioZoneHigh} bpm</span>}
                          </div>
                        )}
                        {/* Tabata info */}
                        {block.type === 'TABATA' && block.tabata && (
                          <div className="flex flex-wrap gap-2 py-3">
                            <span className="font-mono text-[11px] text-muted bg-[#18181f] border border-[#2a2a35] rounded px-2 py-1">Trabalho: {block.tabata.workSeconds}s</span>
                            <span className="font-mono text-[11px] text-muted bg-[#18181f] border border-[#2a2a35] rounded px-2 py-1">Descanso: {block.tabata.restSeconds}s</span>
                            <span className="font-mono text-[11px] text-muted bg-[#18181f] border border-[#2a2a35] rounded px-2 py-1">Rounds: {block.tabata.rounds}</span>
                          </div>
                        )}
                        {/* Exercise table */}
                        <table className="w-full mt-3 border-collapse">
                          <thead className="border-b border-border">
                            <tr>
                              {['Exercício', 'Séries', 'Reps', 'Carga', 'Desc.'].map((h, i) => (
                                <th key={h} className={`font-mono text-[9px] tracking-[2px] text-faint uppercase py-1.5 px-2 font-normal ${i > 0 ? 'text-center' : 'text-left'}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.exercises.map((ex) => (
                              <tr key={ex.id} className="border-b border-[#1a1a22] last:border-0">
                                <td className="px-2 py-2.5 align-top">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-sans text-sm text-white font-medium">{ex.exerciseName}</span>
                                    <button
                                      onClick={() => router.push(`/client/exercise-history/${encodeURIComponent(ex.exerciseName)}`)}
                                      className="text-xs opacity-40 hover:opacity-100 transition-opacity"
                                    >
                                      📈
                                    </button>
                                  </div>
                                  {ex.notes && <div className="font-mono text-[10px] text-faint mt-0.5">{ex.notes}</div>}
                                  {ex.loadNote && <div className="font-mono text-[10px] text-faint mt-0.5">{ex.loadNote}</div>}
                                </td>
                                <td className="px-2 py-2.5 text-center font-mono text-xs text-muted">{ex.sets}×</td>
                                <td className="px-2 py-2.5 text-center font-mono text-xs text-muted">{ex.reps}</td>
                                <td className="px-2 py-2.5 text-center font-mono text-xs text-muted">
                                  {ex.load ? `${ex.load} kg` : ex.percentRM ? `${ex.percentRM}% RM` : '—'}
                                </td>
                                <td className="px-2 py-2.5 text-center font-mono text-xs text-muted">
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
