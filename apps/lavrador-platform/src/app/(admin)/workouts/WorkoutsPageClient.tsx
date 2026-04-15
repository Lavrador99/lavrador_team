'use client';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { workoutsApi } from '../../../lib/api/workouts.api';
import { programsApi } from '../../../lib/api/prescription.api';
import { WorkoutDto, ProgramDto } from '@libs/types';

const STATUS_COLOR: Record<string, { dot: string; text: string; bg: string }> = {
  DRAFT:    { dot: 'bg-outline',  text: 'text-secondary',  bg: 'bg-surface-container-high' },
  ACTIVE:   { dot: 'bg-primary',  text: 'text-primary',    bg: 'bg-primary-fixed/40' },
  ARCHIVED: { dot: 'bg-outline',  text: 'text-secondary',  bg: 'bg-surface-container-high' },
};
const STATUS_LABEL: Record<string, string> = { DRAFT: 'Rascunho', ACTIVE: 'Activo', ARCHIVED: 'Arquivado' };

export function WorkoutsPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const programId = params.get('programId') ?? '';
  const clientId = params.get('clientId') ?? '';

  const { data: program } = useSWR<ProgramDto>(programId ? `program-${programId}` : null, () => programsApi.getById(programId));
  const { data: workouts = [], isLoading, mutate } = useSWR<WorkoutDto[]>(
    programId ? `workouts-${programId}` : null,
    () => workoutsApi.getByProgram(programId),
  );

  const totalDuration = workouts.reduce((a, w) => a + (w.durationEstimatedMin ?? 0), 0);

  const handleActivate = async (id: string, current: string) => {
    await workoutsApi.update(id, { status: (current === 'ACTIVE' ? 'DRAFT' : 'ACTIVE') as any });
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este treino?')) return;
    await workoutsApi.remove(id);
    mutate();
  };

  if (!programId) {
    return (
      <div className="py-20 text-sm text-secondary text-center">
        Acede a esta página a partir do perfil do cliente.
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      {clientId && (
        <button onClick={() => router.push(`/clients/${clientId}`)}
          className="flex items-center gap-1 text-xs text-secondary hover:text-on-surface mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Perfil do cliente
        </button>
      )}

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="label-category text-primary">Plano</span>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mt-1">Treinos</h1>
          {program && (
            <p className="text-sm text-secondary mt-1">
              {program.name} · {workouts.length} sessões · ~{totalDuration} min
            </p>
          )}
        </div>
        <button
          onClick={() => router.push(`/workouts/editor?programId=${programId}&clientId=${clientId}`)}
          className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Novo Treino
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-sm text-secondary text-center">A carregar...</div>
      ) : workouts.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-outline">fitness_center</span>
          <p className="text-sm text-secondary">Nenhum treino criado ainda.</p>
          <button
            onClick={() => router.push(`/workouts/editor?programId=${programId}&clientId=${clientId}`)}
            className="label-category text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Criar primeiro treino
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((w) => {
            const st = STATUS_COLOR[w.status] ?? STATUS_COLOR.DRAFT;
            return (
              <div key={w.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${st.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${st.text}`}>
                        {STATUS_LABEL[w.status]}
                      </span>
                      {w.dayLabel && (
                        <span className="text-[10px] text-outline">· {w.dayLabel}</span>
                      )}
                    </div>
                    <div className="font-headline font-bold text-base text-on-surface truncate">{w.name}</div>
                    <div className="text-xs text-secondary mt-0.5">
                      {w.blocks.length} blocos · ~{w.durationEstimatedMin} min
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleActivate(w.id, w.status)}
                      className={`label-category px-3 py-1.5 rounded-lg border transition-colors ${
                        w.status === 'ACTIVE'
                          ? 'border-primary/30 text-primary bg-primary-fixed/20 hover:bg-primary-fixed/40'
                          : 'border-outline-variant text-secondary hover:text-on-surface hover:border-primary/40'
                      }`}
                    >
                      {w.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => router.push(`/workouts/editor/${w.id}?clientId=${clientId}`)}
                      className="label-category px-3 py-1.5 rounded-lg border border-outline-variant text-secondary hover:text-on-surface hover:border-primary/40 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:text-error hover:bg-error/5 border border-transparent hover:border-error/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete_outline</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
