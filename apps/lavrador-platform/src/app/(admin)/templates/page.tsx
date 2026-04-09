'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { workoutTemplatesApi, WorkoutTemplateDto } from '../../../lib/api/workout-templates.api';

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: 'Aq.', SEQUENTIAL: 'Seq.', SUPERSET: 'SS',
  CIRCUIT: 'Circ.', TABATA: 'Tab.', CARDIO: 'Cardio', FLEXIBILITY: 'Flex.',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: templates = [], isLoading, mutate } = useSWR<WorkoutTemplateDto[]>(
    'templates',
    workoutTemplatesApi.getAll,
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este template?')) return;
    await workoutTemplatesApi.delete(id);
    mutate();
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.tags?.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-black text-2xl text-white">Templates</h1>
          <p className="font-mono text-xs text-muted mt-1">// {templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => router.push('/workouts/editor')}
          className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90"
        >
          + Novo treino
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou tag..."
          className="w-full max-w-sm bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent"
        />
      </div>

      {isLoading ? (
        <div className="py-20 font-mono text-sm text-muted text-center">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 font-mono text-sm text-muted text-center">
          {templates.length === 0
            ? 'Ainda não criaste nenhum template.\nGuarda um treino como template no editor.'
            : 'Nenhum template corresponde à pesquisa.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-panel border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="font-syne font-bold text-base text-white mb-1">{t.name}</div>
                {t.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {t.tags.map((tag: string) => (
                      <span key={tag} className="font-mono text-[9px] text-muted bg-[#1e1e28] rounded px-1.5 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-1.5">
                {t.blocks?.slice(0, 5).map((b: any, i: number) => (
                  <span key={i} className="font-mono text-[10px] text-accent bg-accent/10 border border-accent/20 rounded px-2 py-0.5">
                    {BLOCK_TYPE_LABELS[b.type] ?? b.type}
                  </span>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border flex gap-2">
                <button
                  onClick={() => router.push(`/workouts/editor?templateId=${t.id}`)}
                  className="flex-1 font-mono text-xs text-white bg-[#1e1e28] hover:bg-[#2a2a35] py-2 rounded-lg transition-colors"
                >
                  Usar
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="font-mono text-xs text-red-400 hover:text-red-300 bg-[#1e1e28] hover:bg-[#2a2a35] px-3 py-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
