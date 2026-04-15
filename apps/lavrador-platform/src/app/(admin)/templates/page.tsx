'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader, EmptyState, LoadingState } from '../../../components/ui';
import { workoutTemplatesApi, WorkoutTemplateDto } from '../../../lib/api/workout-templates.api';

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: 'Aquec.', SEQUENTIAL: 'Seq.', SUPERSET: 'Superset',
  CIRCUIT: 'Circuit', TABATA: 'Tabata', CARDIO: 'Cardio', FLEXIBILITY: 'Flex.',
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
      <PageHeader
        label="Biblioteca"
        title="Templates"
        subtitle={`${templates.length} template${templates.length !== 1 ? 's' : ''}`}
        action={
          <button
            onClick={() => router.push('/workouts/editor')}
            className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Novo treino
          </button>
        }
      />

      <div className="mb-6 relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou tag..."
          className="w-full bg-surface-container-highest border-none rounded-lg pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest outline-none transition-all"
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="content_copy"
          title={templates.length === 0
            ? 'Ainda não criaste nenhum template. Guarda um treino como template no editor.'
            : 'Nenhum template corresponde à pesquisa.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-ambient transition-shadow">
              <div className="px-5 py-4 border-b border-outline-variant/10">
                <div className="font-headline font-bold text-base text-on-surface">{t.name}</div>
                {t.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {t.tags.map((tag: string) => (
                      <span key={tag} className="label-category bg-surface-container-high px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-1.5">
                {t.blocks?.slice(0, 5).map((b: any, i: number) => (
                  <span key={i} className="label-category text-primary bg-primary-fixed px-2 py-0.5 rounded">
                    {BLOCK_TYPE_LABELS[b.type] ?? b.type}
                  </span>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-outline-variant/10 flex gap-2">
                <button
                  onClick={() => router.push(`/workouts/editor?templateId=${t.id}`)}
                  className="flex-1 font-label font-bold text-xs text-on-surface bg-surface-container-high hover:bg-surface-container-highest py-2 rounded-lg transition-colors"
                >
                  Usar template
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="font-label font-bold text-xs text-error bg-error-container/20 hover:bg-error-container/40 px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
