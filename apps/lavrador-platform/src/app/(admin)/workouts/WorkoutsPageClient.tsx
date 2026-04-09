'use client';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { workoutsApi } from '../../../lib/api/workouts.api';
import { programsApi } from '../../../lib/api/prescription.api';
import { WorkoutDto, ProgramDto } from '@libs/types';

const STATUS_COLOR: Record<string, string> = { DRAFT: '#666677', ACTIVE: '#c8f542', ARCHIVED: '#444455' };
const STATUS_LABEL: Record<string, string> = { DRAFT: 'Rascunho', ACTIVE: 'Ativo', ARCHIVED: 'Arquivado' };

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
      <div className="py-20 font-mono text-sm text-muted text-center">
        Acede a esta página a partir do perfil do cliente.
      </div>
    );
  }

  return (
    <div>
      {clientId && (
        <button onClick={() => router.push(`/clients/${clientId}`)} className="font-mono text-xs text-muted hover:text-white mb-4 flex items-center gap-1">
          ← Perfil do cliente
        </button>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-black text-2xl text-white">Treinos do Plano</h1>
          {program && <p className="font-mono text-xs text-muted mt-1">// {program.name} · {workouts.length} sessões · ~{totalDuration} min</p>}
        </div>
        <button
          onClick={() => router.push(`/workouts/editor?programId=${programId}&clientId=${clientId}`)}
          className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90"
        >
          + Novo Treino
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 font-mono text-sm text-muted text-center">A carregar...</div>
      ) : workouts.length === 0 ? (
        <div className="py-20 font-mono text-sm text-muted text-center">Nenhum treino criado ainda.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {workouts.map((w) => (
            <div key={w.id} className="bg-panel border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: STATUS_COLOR[w.status] }}>
                      {STATUS_LABEL[w.status]}
                    </span>
                    {w.dayLabel && <span className="font-mono text-[10px] text-muted">· {w.dayLabel}</span>}
                  </div>
                  <div className="font-syne font-bold text-lg text-white">{w.name}</div>
                  <div className="font-mono text-xs text-muted mt-0.5">{w.blocks.length} blocos · ~{w.durationEstimatedMin} min</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleActivate(w.id, w.status)}
                    className="font-mono text-xs border border-border rounded-lg px-3 py-1.5 text-muted hover:text-white hover:border-muted transition-colors">
                    {w.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => router.push(`/workouts/editor/${w.id}?clientId=${clientId}`)}
                    className="font-mono text-xs border border-border rounded-lg px-3 py-1.5 text-muted hover:text-white hover:border-muted transition-colors">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(w.id)}
                    className="font-mono text-xs text-red-400 border border-red-400/20 rounded-lg px-3 py-1.5 hover:border-red-400/40 transition-colors">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
