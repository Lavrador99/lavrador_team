'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { ExerciseDto } from '@libs/types';
import { exercisesApi, ExerciseFilters } from '../../../lib/api/exercises.api';
import { ExerciseImageLoop } from '../../../components/ExerciseImageLoop';
import { ExerciseLinkButton } from '../../../components/ExerciseLinkButton';
import { PageHeader, EmptyState, LoadingState, Modal, InputField, SelectField } from '../../../components/ui';
import { INPUT_CLS } from '../../../lib/constants/styles';

const LEVEL_STYLE: Record<string, { text: string; bg: string }> = {
  INICIANTE:  { text: 'text-teal-700',  bg: 'bg-primary-fixed' },
  INTERMEDIO: { text: 'text-primary',   bg: 'bg-primary-fixed' },
  AVANCADO:   { text: 'text-error',     bg: 'bg-error-container' },
};
const LEVEL_LABEL: Record<string, string> = {
  INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado',
};
const PATTERN_LABEL: Record<string, string> = {
  empurrar_horizontal: 'Empurrar H.', empurrar_vertical: 'Empurrar V.',
  puxar_horizontal: 'Puxar H.',       puxar_vertical: 'Puxar V.',
  dominante_joelho: 'Dom. Joelho',    dominante_anca: 'Dom. Anca',
  core: 'Core',                       locomocao: 'Locomoção',
};

export default function ExercisesPage() {
  const [filters, setFilters] = useState<ExerciseFilters>({});
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ExerciseDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: exercises = [], isLoading, mutate } = useSWR<ExerciseDto[]>(
    `exercises-${JSON.stringify(filters)}-${search}`,
    () => exercisesApi.getAll({ ...filters, search: search || undefined }),
  );

  const setFilter = (key: keyof ExerciseFilters, val: string) =>
    setFilters((f) => ({ ...f, [key]: val || undefined }));

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este exercício?')) return;
    await exercisesApi.remove(id);
    mutate();
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)]">
      {/* Left */}
      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader
          label="Biblioteca"
          title="Exercícios"
          subtitle={`${exercises.length} exercícios`}
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Novo
            </button>
          }
          className="mb-5"
        />

        <div className="flex gap-2 flex-wrap mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="bg-surface-container-highest border-none rounded-lg pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary outline-none w-48"
            />
          </div>
          <select value={filters.level ?? ''} onChange={(e) => setFilter('level', e.target.value)} className={INPUT_CLS}>
            <option value="">Todos os níveis</option>
            {Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filters.pattern ?? ''} onChange={(e) => setFilter('pattern', e.target.value)} className={INPUT_CLS}>
            <option value="">Todos os padrões</option>
            {Object.entries(PATTERN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(filters.level || filters.pattern || search) && (
            <button
              onClick={() => { setFilters({}); setSearch(''); }}
              className="font-label text-xs text-secondary bg-surface-container-high rounded-lg px-3 py-2 hover:text-on-surface transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Limpar
            </button>
          )}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : exercises.length === 0 ? (
          <EmptyState icon="exercise" title="Nenhum exercício encontrado." size="section" />
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {exercises.map((ex) => {
                const lvl = LEVEL_STYLE[ex.level] ?? LEVEL_STYLE.INTERMEDIO;
                const isActive = selected?.id === ex.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setSelected(isActive ? null : ex)}
                    className={`bg-surface-container-lowest rounded-xl overflow-hidden text-left transition-all shadow-sm ${
                      isActive ? 'ring-2 ring-primary shadow-ambient' : 'hover:shadow-ambient-lg'
                    }`}
                  >
                    {ex.gifUrl ? (
                      <div className="w-full h-32 bg-surface-container overflow-hidden">
                        <ExerciseImageLoop gifUrl={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" loop={false} />
                      </div>
                    ) : (
                      <div className="w-full h-16 bg-surface-container flex items-center justify-center text-outline text-xs">
                        sem imagem
                      </div>
                    )}
                    <div className="p-3">
                      <div className="font-headline font-bold text-sm text-on-surface mb-1.5 truncate">{ex.name}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`label-category px-1.5 py-0.5 rounded ${lvl.bg} ${lvl.text}`}>
                          {LEVEL_LABEL[ex.level]}
                        </span>
                        {ex.primaryMuscles.slice(0, 2).map((m) => (
                          <span key={m} className="label-category text-outline">{m.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-surface-container-lowest rounded-xl shadow-ambient overflow-y-auto flex flex-col">
          <div className="p-4 flex items-start justify-between border-b border-outline-variant/10">
            <div className="flex-1 min-w-0">
              <h2 className="font-headline font-bold text-base text-on-surface leading-tight">{selected.name}</h2>
              <span className={`label-category px-1.5 py-0.5 rounded inline-block mt-1.5 ${(LEVEL_STYLE[selected.level] ?? LEVEL_STYLE.INTERMEDIO).bg} ${(LEVEL_STYLE[selected.level] ?? LEVEL_STYLE.INTERMEDIO).text}`}>
                {LEVEL_LABEL[selected.level]}
              </span>
            </div>
            <button onClick={() => setSelected(null)} className="text-outline hover:text-on-surface ml-2 flex-shrink-0 p-1">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          {selected.gifUrl && (
            <div className="bg-surface-container border-b border-outline-variant/10">
              <ExerciseImageLoop gifUrl={selected.gifUrl} alt={selected.name} className="w-full object-contain max-h-48" />
            </div>
          )}
          <div className="p-4 space-y-4 flex-1">
            {selected.primaryMuscles.length > 0 && (
              <div>
                <p className="label-category mb-2">Principal</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.primaryMuscles.map((m) => (
                    <span key={m} className="label-category text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                      {m.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selected.secondaryMuscles.length > 0 && (
              <div>
                <p className="label-category mb-2">Secundário</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.secondaryMuscles.map((m) => (
                    <span key={m} className="label-category text-secondary bg-surface-container-high px-2 py-0.5 rounded-full">
                      {m.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(selected.clinicalNotes?.length ?? 0) > 0 && (
              <div className="bg-error-container/30 rounded-xl p-3">
                <p className="label-category text-error mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Notas clínicas
                </p>
                {selected.clinicalNotes?.map((n) => (
                  <p key={n} className="text-xs text-on-error-container mt-1">{n}</p>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 pb-4 flex flex-col gap-2">
            <ExerciseLinkButton name={selected.name} className="w-full rounded-lg py-2" />
            <button
              onClick={() => handleDelete(selected.id)}
              className="w-full font-label font-bold text-xs text-error border border-error/20 rounded-lg py-2 hover:bg-error/5 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onSaved={() => { mutate(); setShowCreate(false); }} />
      )}
    </div>
  );
}

function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('INTERMEDIO');
  const [pattern, setPattern] = useState('empurrar_horizontal');
  const [primaryMuscles, setPrimaryMuscles] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome obrigatório.'); return; }
    setSaving(true);
    try {
      await exercisesApi.create({
        name: name.trim(),
        level: level as any,
        pattern: pattern as any,
        primaryMuscles: primaryMuscles.split(',').map((m) => m.trim()).filter(Boolean),
        secondaryMuscles: [],
        equipment: [],
      });
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao criar.');
    } finally { setSaving(false); }
  };

  const footer = (
    <div className="flex gap-2 justify-end">
      <button onClick={onClose} className="text-sm text-secondary hover:text-on-surface px-4 py-2 transition-colors">Cancelar</button>
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-6 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
      >
        {saving ? '...' : 'Criar'}
      </button>
    </div>
  );

  return (
    <Modal title="Novo Exercício" onClose={onClose} footer={footer}>
      <InputField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Agachamento Livre" error={error} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Nível" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="INICIANTE">Iniciante</option>
          <option value="INTERMEDIO">Intermédio</option>
          <option value="AVANCADO">Avançado</option>
        </SelectField>
        <SelectField label="Padrão" value={pattern} onChange={(e) => setPattern(e.target.value)}>
          {Object.entries(PATTERN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
      </div>
      <InputField
        label="Músculos primários (separados por vírgula)"
        value={primaryMuscles}
        onChange={(e) => setPrimaryMuscles(e.target.value)}
        placeholder="quadriceps, gluteos"
      />
    </Modal>
  );
}
