'use client';
import { useState, useRef } from 'react';
import useSWR from 'swr';
import { ExerciseDto } from '@libs/types';
import { exercisesApi } from '../../../lib/api/exercises.api';
import { ExerciseImageLoop } from '../../../components/ExerciseImageLoop';
import { ExerciseLinkButton } from '../../../components/ExerciseLinkButton';
import { EmptyState, LoadingState, Modal, PageHeader } from '../../../components/ui';
import { INPUT_CLS } from '../../../lib/constants/styles';

const LEVEL_CFG = {
  INICIANTE:  { label: 'Iniciante',  color: 'text-teal-700',  bg: 'bg-teal-50',         dot: 'bg-teal-400'  },
  INTERMEDIO: { label: 'Intermédio', color: 'text-primary',   bg: 'bg-primary-fixed',   dot: 'bg-primary'   },
  AVANCADO:   { label: 'Avançado',   color: 'text-error',     bg: 'bg-error-container', dot: 'bg-error'     },
} as const;

const PATTERN_CFG: Record<string, { label: string; cls: string }> = {
  DOMINANTE_JOELHO:    { label: 'Dom. Joelho',  cls: 'text-blue-600 bg-blue-50'     },
  DOMINANTE_ANCA:      { label: 'Dom. Anca',    cls: 'text-indigo-600 bg-indigo-50' },
  EMPURRAR_HORIZONTAL: { label: 'Empurrar H.',  cls: 'text-orange-600 bg-orange-50' },
  EMPURRAR_VERTICAL:   { label: 'Empurrar V.',  cls: 'text-amber-600 bg-amber-50'   },
  PUXAR_HORIZONTAL:    { label: 'Puxar H.',     cls: 'text-green-600 bg-green-50'   },
  PUXAR_VERTICAL:      { label: 'Puxar V.',     cls: 'text-teal-600 bg-teal-50'     },
  CORE:                { label: 'Core',          cls: 'text-purple-600 bg-purple-50' },
  LOCOMOCAO:           { label: 'Locomoção',     cls: 'text-rose-600 bg-rose-50'    },
};

const EQUIPMENT_CFG: Record<string, { label: string; icon: string }> = {
  BARRA:           { label: 'Barra',       icon: 'sports_gymnastics'        },
  HALTERES:        { label: 'Halteres',    icon: 'fitness_center'           },
  RACK:            { label: 'Rack',        icon: 'shelves'                  },
  MAQUINAS:        { label: 'Máquinas',    icon: 'precision_manufacturing'  },
  CABO:            { label: 'Cabo',        icon: 'cable'                    },
  KETTLEBELL:      { label: 'Kettlebell',  icon: 'sports_mma'               },
  PESO_CORPORAL:   { label: 'Peso Corp.',  icon: 'accessibility'            },
  BANCO:           { label: 'Banco',       icon: 'weekend'                  },
  CARDIO_EQ:       { label: 'Cardio',      icon: 'directions_run'           },
  SMITH:           { label: 'Smith',       icon: 'vertical_align_center'    },
  RESISTANCE_BAND: { label: 'Banda',       icon: 'loop'                     },
  PARALELAS:       { label: 'Paralelas',   icon: 'expand'                   },
  BARRA_FIXA:      { label: 'Barra Fixa',  icon: 'fiber_manual_record'      },
  FOAM_ROLLER:     { label: 'Foam Roller', icon: 'circle'                   },
};

// ---------------------------------------------------------------------------
// ChipInput
// ---------------------------------------------------------------------------
function ChipInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim().replace(/,$/, '');
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div>
      <p className="font-label text-xs text-secondary mb-1.5">{label}</p>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-0.5 bg-primary-fixed text-primary text-xs font-label px-2 py-0.5 rounded-full"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="ml-0.5 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>close</span>
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Escreve e prime Enter'}
        className={INPUT_CLS}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type AnyEx = ExerciseDto & { videoUrl?: string; gifUrl?: string; isActive?: boolean; equipment?: string[] };

function lvlCfg(level: string) {
  return LEVEL_CFG[level as keyof typeof LEVEL_CFG] ?? { label: level, color: 'text-secondary', bg: 'bg-surface-container-high', dot: 'bg-outline' };
}

function ptnCfg(pattern: string) {
  return PATTERN_CFG[pattern] ?? PATTERN_CFG[pattern?.toUpperCase?.()] ?? { label: pattern, cls: 'text-secondary bg-surface-container-high' };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [patternFilter, setPatternFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selected, setSelected] = useState<AnyEx | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AnyEx>>({});
  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const swrKey = ['exercises', levelFilter, patternFilter, equipmentFilter, search, String(showInactive)].join('|');
  const { data: exercises = [], isLoading, mutate } = useSWR<AnyEx[]>(
    swrKey,
    () => exercisesApi.getAll({
      level: levelFilter || undefined,
      pattern: patternFilter || undefined,
      equipment: equipmentFilter || undefined,
      search: search || undefined,
      ...(showInactive ? { showAll: true } : {}),
    } as any),
  );

  const hasFilters = !!(levelFilter || patternFilter || equipmentFilter || search || showInactive);

  const clearFilters = () => {
    setSearch('');
    setLevelFilter('');
    setPatternFilter('');
    setEquipmentFilter('');
    setShowInactive(false);
  };

  const selectExercise = (ex: AnyEx) => {
    setSelected((prev) => (prev?.id === ex.id ? null : ex));
    setEditMode(false);
  };

  const openEdit = (ex: AnyEx) => {
    setSelected(ex);
    setEditForm({
      name: ex.name,
      level: ex.level,
      pattern: ex.pattern,
      primaryMuscles: [...(ex.primaryMuscles ?? [])],
      secondaryMuscles: [...(ex.secondaryMuscles ?? [])],
      equipment: [...(ex.equipment ?? [])],
      clinicalNotes: [...(ex.clinicalNotes ?? [])],
      gifUrl: ex.gifUrl ?? '',
      videoUrl: ex.videoUrl ?? '',
    });
    setEditMode(true);
  };

  const cancelEdit = () => setEditMode(false);

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await exercisesApi.update(selected.id, editForm as any) as AnyEx;
      await mutate();
      setSelected(updated);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este exercício?')) return;
    await exercisesApi.remove(id);
    mutate();
    if (selected?.id === id) setSelected(null);
  };

  const handleUpload = async (file: File) => {
    if (!selected) return;
    setUploadPct(0);
    try {
      const updated = await exercisesApi.uploadFile(selected.id, file, (pct) => setUploadPct(pct)) as AnyEx;
      await mutate();
      setSelected(updated);
    } finally {
      setUploadPct(null);
    }
  };

  const toggleActive = async () => {
    if (!selected) return;
    const updated = await exercisesApi.update(selected.id, { isActive: !selected.isActive } as any) as AnyEx;
    await mutate();
    setSelected(updated);
  };

  const totalCount = exercises.length;
  const countByLevel = (level: string) => exercises.filter((e) => e.level === level).length;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
      {/* Header */}
      <PageHeader
        label="Biblioteca"
        title="Exercícios"
        subtitle={`${totalCount} exercícios`}
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Novo exercício
          </button>
        }
      />

      {/* Stats strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-surface-container-lowest rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-outline text-sm">fitness_center</span>
          <span className="font-headline font-bold text-on-surface text-sm">{totalCount}</span>
          <span className="font-label text-xs text-secondary">total</span>
        </div>
        {(Object.keys(LEVEL_CFG) as Array<keyof typeof LEVEL_CFG>).map((lvl) => {
          const cfg = LEVEL_CFG[lvl];
          return (
            <div key={lvl} className={`rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-sm ${cfg.bg}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className={`font-label text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
              <span className={`font-headline font-bold text-sm ${cfg.color}`}>{countByLevel(lvl)}</span>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="bg-surface-container-highest border-none rounded-lg pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary outline-none w-48"
          />
        </div>

        {/* Level pills */}
        <div className="flex gap-0.5 bg-surface-container-high rounded-lg p-1">
          {[
            { val: '', label: 'Todos' },
            { val: 'INICIANTE', label: 'Iniciante' },
            { val: 'INTERMEDIO', label: 'Intermédio' },
            { val: 'AVANCADO', label: 'Avançado' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setLevelFilter(val)}
              className={`font-label text-xs px-3 py-1.5 rounded-md transition-all ${
                levelFilter === val
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={patternFilter}
          onChange={(e) => setPatternFilter(e.target.value)}
          className="bg-surface-container-highest border-none rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">Todos os padrões</option>
          {Object.entries(PATTERN_CFG).map(([v, cfg]) => (
            <option key={v} value={v}>{cfg.label}</option>
          ))}
        </select>

        <select
          value={equipmentFilter}
          onChange={(e) => setEquipmentFilter(e.target.value)}
          className="bg-surface-container-highest border-none rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">Todo o equipamento</option>
          {Object.entries(EQUIPMENT_CFG).map(([v, cfg]) => (
            <option key={v} value={v}>{cfg.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowInactive((v) => !v)}
          className={`flex items-center gap-1.5 font-label text-xs px-3 py-2.5 rounded-lg transition-all ${
            showInactive
              ? 'bg-error-container text-error font-bold'
              : 'bg-surface-container-high text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-sm">{showInactive ? 'visibility_off' : 'visibility'}</span>
          Inactivos
        </button>

        <div className="flex gap-0.5 bg-surface-container-high rounded-lg p-1 ml-auto">
          {(['grid', 'table'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{mode === 'grid' ? 'grid_view' : 'table_rows'}</span>
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="font-label text-xs text-secondary bg-surface-container-high rounded-lg px-3 py-2 hover:text-on-surface transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Limpar
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-5 flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto">
          {isLoading ? (
            <LoadingState />
          ) : exercises.length === 0 ? (
            <EmptyState icon="exercise" title="Nenhum exercício encontrado." size="section" />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {exercises.map((ex) => {
                const lCfg = lvlCfg(ex.level);
                const pCfg = ptnCfg(ex.pattern);
                const isSelected = selected?.id === ex.id;
                const isInactive = ex.isActive === false;
                const equip = ex.equipment ?? [];
                return (
                  <button
                    key={ex.id}
                    onClick={() => selectExercise(ex)}
                    className={`bg-surface-container-lowest rounded-xl overflow-hidden text-left transition-all shadow-sm ${
                      isSelected ? 'ring-2 ring-primary shadow-ambient' : 'hover:shadow-ambient-lg'
                    } ${isInactive ? 'opacity-60' : ''}`}
                  >
                    <div className="relative w-full h-36 bg-surface-container overflow-hidden">
                      {ex.gifUrl ? (
                        <ExerciseImageLoop gifUrl={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" loop={false} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline">
                          <span className="material-symbols-outlined text-3xl">fitness_center</span>
                        </div>
                      )}
                      {ex.videoUrl && (
                        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded">▶</span>
                      )}
                      {isInactive && (
                        <span className="absolute top-2 left-2 bg-error text-on-error text-xs font-bold px-1.5 py-0.5 rounded">Inactivo</span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-headline font-bold text-sm text-on-surface mb-1.5 truncate">{ex.name}</div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className={`text-xs font-label font-bold px-2 py-0.5 rounded-full ${lCfg.bg} ${lCfg.color}`}>
                          {lCfg.label}
                        </span>
                        {ex.pattern && (
                          <span className={`text-xs font-label px-2 py-0.5 rounded-full ${pCfg.cls}`}>{pCfg.label}</span>
                        )}
                      </div>
                      {equip.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {equip.slice(0, 2).map((e) => (
                            <span key={e} className="text-xs font-label text-secondary bg-surface-container-high px-1.5 py-0.5 rounded">
                              {EQUIPMENT_CFG[e]?.label ?? e}
                            </span>
                          ))}
                          {equip.length > 2 && (
                            <span className="text-xs font-label text-secondary bg-surface-container-high px-1.5 py-0.5 rounded">
                              +{equip.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  {['Nome', 'Nível', 'Padrão', 'Equipamento', 'Músculos', 'Acções'].map((h) => (
                    <th key={h} className="font-label text-xs text-secondary pb-2 pr-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex) => {
                  const lCfg = lvlCfg(ex.level);
                  const pCfg = ptnCfg(ex.pattern);
                  const isSelected = selected?.id === ex.id;
                  const equip = ex.equipment ?? [];
                  return (
                    <tr
                      key={ex.id}
                      onClick={() => selectExercise(ex)}
                      className={`border-b border-outline-variant/10 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-fixed/30' : 'hover:bg-surface-container-high'
                      }`}
                    >
                      <td className="py-2.5 pr-4">
                        <span className="font-headline font-semibold text-on-surface">{ex.name}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-label font-bold px-2 py-0.5 rounded-full ${lCfg.bg} ${lCfg.color}`}>
                          {lCfg.label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {ex.pattern && (
                          <span className={`text-xs font-label px-2 py-0.5 rounded-full ${pCfg.cls}`}>{pCfg.label}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex gap-1 flex-wrap">
                          {equip.slice(0, 2).map((e) => (
                            <span key={e} className="text-xs font-label text-secondary">{EQUIPMENT_CFG[e]?.label ?? e}</span>
                          ))}
                          {equip.length > 2 && <span className="text-xs text-secondary">+{equip.length - 2}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs text-secondary">
                          {(ex.primaryMuscles ?? []).slice(0, 2).join(', ')}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={(ev) => { ev.stopPropagation(); openEdit(ex); }}
                            className="p-1 text-secondary hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); handleDelete(ex.id); }}
                            className="p-1 text-secondary hover:text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-surface-container-lowest rounded-xl shadow-ambient overflow-y-auto flex flex-col">
            {editMode ? (
              <>
                <div className="p-4 flex items-center justify-between border-b border-outline-variant/10">
                  <h2 className="font-headline font-bold text-base text-on-surface">Editar</h2>
                  <div className="flex gap-1">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="p-1.5 text-primary hover:bg-primary-fixed rounded-lg transition-colors disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-lg">check</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 text-outline hover:text-on-surface rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  <div>
                    <p className="font-label text-xs text-secondary mb-1.5">Nome</p>
                    <input
                      value={editForm.name ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-label text-xs text-secondary mb-1.5">Nível</p>
                      <select
                        value={editForm.level ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, level: e.target.value as any }))}
                        className="w-full bg-surface-container-highest border-none rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="INICIANTE">Iniciante</option>
                        <option value="INTERMEDIO">Intermédio</option>
                        <option value="AVANCADO">Avançado</option>
                      </select>
                    </div>
                    <div>
                      <p className="font-label text-xs text-secondary mb-1.5">Padrão</p>
                      <select
                        value={editForm.pattern ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, pattern: e.target.value as any }))}
                        className="w-full bg-surface-container-highest border-none rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                      >
                        {Object.entries(PATTERN_CFG).map(([v, cfg]) => (
                          <option key={v} value={v}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <ChipInput
                    label="Músculos primários"
                    values={(editForm.primaryMuscles as string[]) ?? []}
                    onChange={(v) => setEditForm((f) => ({ ...f, primaryMuscles: v as any }))}
                    placeholder="quadriceps, Enter"
                  />
                  <ChipInput
                    label="Músculos secundários"
                    values={(editForm.secondaryMuscles as string[]) ?? []}
                    onChange={(v) => setEditForm((f) => ({ ...f, secondaryMuscles: v as any }))}
                    placeholder="glúteos, Enter"
                  />
                  <div>
                    <p className="font-label text-xs text-secondary mb-1.5">Equipamento</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(EQUIPMENT_CFG).map(([val, cfg]) => {
                        const equip = (editForm.equipment as string[]) ?? [];
                        const checked = equip.includes(val);
                        return (
                          <label key={val} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? equip.filter((e) => e !== val)
                                  : [...equip, val];
                                setEditForm((f) => ({ ...f, equipment: next as any }));
                              }}
                              className="accent-primary"
                            />
                            <span className="font-label text-xs text-on-surface">{cfg.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <ChipInput
                    label="Notas clínicas"
                    values={(editForm.clinicalNotes as string[]) ?? []}
                    onChange={(v) => setEditForm((f) => ({ ...f, clinicalNotes: v as any }))}
                    placeholder="nota, Enter"
                  />
                  <div>
                    <p className="font-label text-xs text-secondary mb-1.5">GIF URL</p>
                    <input
                      value={editForm.gifUrl ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, gifUrl: e.target.value }))}
                      placeholder="https://..."
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <p className="font-label text-xs text-secondary mb-1.5">Video URL</p>
                    <input
                      value={editForm.videoUrl ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, videoUrl: e.target.value }))}
                      placeholder="https://..."
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 flex items-start justify-between border-b border-outline-variant/10">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-headline font-bold text-base text-on-surface leading-tight truncate">
                      {selected.name}
                    </h2>
                    <span className={`text-xs font-label font-bold px-2 py-0.5 rounded-full inline-block mt-1.5 ${lvlCfg(selected.level).bg} ${lvlCfg(selected.level).color}`}>
                      {lvlCfg(selected.level).label}
                    </span>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(selected)}
                      className="p-1.5 text-outline hover:text-primary rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => { setSelected(null); setEditMode(false); }}
                      className="p-1.5 text-outline hover:text-on-surface rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>

                {/* Media */}
                <div className="bg-surface-container border-b border-outline-variant/10">
                  {selected.videoUrl ? (
                    <video controls className="w-full max-h-48 object-contain">
                      <source src={selected.videoUrl} />
                    </video>
                  ) : selected.gifUrl ? (
                    <ExerciseImageLoop gifUrl={selected.gifUrl} alt={selected.name} className="w-full object-contain max-h-48" />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-3xl">image_not_supported</span>
                    </div>
                  )}
                </div>

                {/* Upload media */}
                <div className="px-4 pt-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
                  />
                  {uploadPct !== null ? (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-label text-xs text-secondary">A carregar...</span>
                        <span className="font-label text-xs text-primary font-bold">{uploadPct}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${uploadPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 font-label text-xs text-secondary hover:text-primary transition-colors mb-3"
                    >
                      <span className="material-symbols-outlined text-sm">upload</span>
                      Upload media
                    </button>
                  )}
                </div>

                <div className="px-4 pb-4 space-y-4 flex-1">
                  {selected.pattern && (
                    <div>
                      <p className="font-label text-xs text-secondary mb-1.5">Padrão</p>
                      <span className={`text-xs font-label px-2 py-0.5 rounded-full ${ptnCfg(selected.pattern).cls}`}>
                        {ptnCfg(selected.pattern).label}
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="font-label text-xs text-secondary mb-1.5">Músculos primários</p>
                    {(selected.primaryMuscles?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selected.primaryMuscles.map((m) => (
                          <span key={m} className="text-xs font-label text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                            {m.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-secondary">—</span>
                    )}
                  </div>

                  <div>
                    <p className="font-label text-xs text-secondary mb-1.5">Músculos secundários</p>
                    {(selected.secondaryMuscles?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selected.secondaryMuscles.map((m) => (
                          <span key={m} className="text-xs font-label text-secondary bg-surface-container-high px-2 py-0.5 rounded-full">
                            {m.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-secondary">—</span>
                    )}
                  </div>

                  {(selected.equipment?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-label text-xs text-secondary mb-1.5">Equipamento</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.equipment!.map((e) => {
                          const cfg = EQUIPMENT_CFG[e];
                          return (
                            <span
                              key={e}
                              className="flex items-center gap-1 text-xs font-label text-secondary bg-surface-container-high px-2 py-1 rounded-lg"
                            >
                              <span className="material-symbols-outlined text-xs">{cfg?.icon ?? 'sports_gymnastics'}</span>
                              {cfg?.label ?? e}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="font-label text-xs text-secondary">Estado</p>
                    <button
                      onClick={toggleActive}
                      className={`flex items-center gap-1.5 font-label text-xs px-3 py-1.5 rounded-full transition-all ${
                        selected.isActive !== false
                          ? 'bg-primary-fixed text-primary font-bold'
                          : 'bg-error-container text-error font-bold'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {selected.isActive !== false ? 'check_circle' : 'cancel'}
                      </span>
                      {selected.isActive !== false ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>

                  <ExerciseLinkButton name={selected.name} className="w-full rounded-lg py-2" />

                  {(selected.clinicalNotes?.length ?? 0) > 0 && (
                    <div className="bg-error-container/30 rounded-xl p-3">
                      <p className="font-label text-xs text-error mb-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Notas clínicas
                      </p>
                      {selected.clinicalNotes!.map((n) => (
                        <p key={n} className="text-xs text-on-error-container mt-1">{n}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="w-full font-label font-bold text-xs text-error border border-error/20 rounded-lg py-2 hover:bg-error/5 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { mutate(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreateModal
// ---------------------------------------------------------------------------
function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('INTERMEDIO');
  const [pattern, setPattern] = useState('EMPURRAR_HORIZONTAL');
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleEquip = (val: string) =>
    setEquipment((prev) => prev.includes(val) ? prev.filter((e) => e !== val) : [...prev, val]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome obrigatório.'); return; }
    setSaving(true);
    try {
      await exercisesApi.create({
        name: name.trim(),
        level: level as any,
        pattern: pattern as any,
        primaryMuscles: primaryMuscles as any,
        secondaryMuscles: secondaryMuscles as any,
        equipment: equipment as any,
      });
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao criar.');
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex gap-2 justify-end">
      <button
        onClick={onClose}
        className="text-sm text-secondary hover:text-on-surface px-4 py-2 transition-colors"
      >
        Cancelar
      </button>
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
      <div className="space-y-4">
        <div>
          <p className="font-label text-xs text-secondary mb-1.5">
            Nome <span className="text-error">*</span>
          </p>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Agachamento Livre"
            className={INPUT_CLS}
          />
          {error && <p className="text-xs text-error mt-1">{error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-label text-xs text-secondary mb-1.5">Nível</p>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-surface-container-highest border-none rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="INICIANTE">Iniciante</option>
              <option value="INTERMEDIO">Intermédio</option>
              <option value="AVANCADO">Avançado</option>
            </select>
          </div>
          <div>
            <p className="font-label text-xs text-secondary mb-1.5">Padrão</p>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-surface-container-highest border-none rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
            >
              {Object.entries(PATTERN_CFG).map(([v, cfg]) => (
                <option key={v} value={v}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>
        <ChipInput
          label="Músculos primários"
          values={primaryMuscles}
          onChange={setPrimaryMuscles}
          placeholder="quadriceps, Enter"
        />
        <ChipInput
          label="Músculos secundários"
          values={secondaryMuscles}
          onChange={setSecondaryMuscles}
          placeholder="glúteos, Enter"
        />
        <div>
          <p className="font-label text-xs text-secondary mb-1.5">Equipamento</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(EQUIPMENT_CFG).map(([val, cfg]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={equipment.includes(val)}
                  onChange={() => toggleEquip(val)}
                  className="accent-primary"
                />
                <span className="font-label text-xs text-on-surface">{cfg.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
