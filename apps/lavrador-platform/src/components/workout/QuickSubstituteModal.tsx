'use client';
import { useState, useEffect } from 'react';
import { suggestionApi } from '../../lib/api/suggestion.api';

interface Alternative {
  exerciseId: string;
  name: string;
  pattern: string;
  primaryMuscles: string[];
  score: number;
}

interface Props {
  exerciseId: string;
  exerciseName: string;
  clientFlags?: string[];
  onSelect: (alt: Alternative) => void;
  onClose: () => void;
}

export function QuickSubstituteModal({ exerciseId, exerciseName, clientFlags = [], onSelect, onClose }: Props) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    suggestionApi.getAlternatives(exerciseId, clientFlags, 8)
      .then(setAlternatives)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [exerciseId]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-zinc-900 rounded-t-3xl border-t border-zinc-800/60 p-5 pb-28 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Substituir</div>
            <h3 className="font-[Manrope] font-black text-lg text-white leading-tight">{exerciseName}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white text-lg">close</span>
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-zinc-500 text-sm">A procurar alternativas...</div>
        ) : alternatives.length === 0 ? (
          <div className="py-10 text-center text-zinc-500 text-sm">
            Nenhuma alternativa encontrada para este padrão de movimento.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alternatives.map((alt) => (
              <button
                key={alt.exerciseId}
                onClick={() => onSelect(alt)}
                className="w-full text-left rounded-2xl bg-zinc-800 border border-zinc-700/60 px-4 py-3 active:scale-[0.98] transition-all hover:border-[#84d4d3]/30"
              >
                <div className="font-semibold text-sm text-white mb-1">{alt.name}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 bg-zinc-700/60 px-1.5 py-0.5 rounded">
                    {alt.pattern.replace(/_/g, ' ')}
                  </span>
                  {alt.primaryMuscles.slice(0, 2).map((m) => (
                    <span key={m} className="text-[10px] text-zinc-400 bg-zinc-700/40 px-1.5 py-0.5 rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
