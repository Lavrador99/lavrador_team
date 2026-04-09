'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { ExerciseDto } from '@libs/types';
import { exercisesApi, ExerciseFilters } from '../../../lib/api/exercises.api';
import { ExerciseImageLoop } from '../../../components/ExerciseImageLoop';
import { ExerciseLinkButton } from '../../../components/ExerciseLinkButton';

const LEVEL_COLOR: Record<string, string> = { INICIANTE: '#42a5f5', INTERMEDIO: '#c8f542', AVANCADO: '#ff8c5a' };
const LEVEL_LABEL: Record<string, string> = { INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado' };
const PATTERN_LABEL: Record<string, string> = {
  empurrar_horizontal: 'Empurrar H.', empurrar_vertical: 'Empurrar V.',
  puxar_horizontal: 'Puxar H.', puxar_vertical: 'Puxar V.',
  dominante_joelho: 'Dom. Joelho', dominante_anca: 'Dom. Anca',
  core: 'Core', locomocao: 'Locomoção',
};

const selInp = 'bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans focus:outline-none focus:border-accent';


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
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Left */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-syne font-black text-2xl text-white">Exercícios</h1>
            <p className="font-mono text-xs text-muted mt-1">// {exercises.length} exercícios</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90">
            + Novo
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..." className={selInp + ' w-48 placeholder-faint'} />
          <select value={filters.level ?? ''} onChange={(e) => setFilter('level', e.target.value)}
            className={selInp} style={{ background: '#111118' }}>
            <option value="">Todos os níveis</option>
            {Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filters.pattern ?? ''} onChange={(e) => setFilter('pattern', e.target.value)}
            className={selInp} style={{ background: '#111118' }}>
            <option value="">Todos os padrões</option>
            {Object.entries(PATTERN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(filters.level || filters.pattern || search) && (
            <button onClick={() => { setFilters({}); setSearch(''); }}
              className="font-mono text-xs text-muted border border-border rounded-lg px-3 py-2 hover:text-white">
              ✕ Limpar
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-10 font-mono text-sm text-muted text-center">A carregar...</div>
        ) : exercises.length === 0 ? (
          <div className="py-10 font-mono text-sm text-muted text-center">Nenhum exercício encontrado.</div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {exercises.map((ex) => (
                <button key={ex.id} onClick={() => setSelected(selected?.id === ex.id ? null : ex)}
                  className={`bg-panel border rounded-xl overflow-hidden text-left transition-colors ${selected?.id === ex.id ? 'border-accent' : 'border-border hover:border-accent/30'}`}>
                  {ex.gifUrl ? (
                    <div className="w-full h-32 bg-[#0d0d13] overflow-hidden">
                      <ExerciseImageLoop gifUrl={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" loop={false} />
                    </div>
                  ) : (
                    <div className="w-full h-16 bg-[#0d0d13] flex items-center justify-center font-mono text-[10px] text-faint">sem imagem</div>
                  )}
                  <div className="p-3">
                    <div className="font-syne font-bold text-sm text-white mb-1 truncate">{ex.name}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border"
                        style={{ color: LEVEL_COLOR[ex.level], borderColor: LEVEL_COLOR[ex.level] + '44' }}>
                        {LEVEL_LABEL[ex.level]}
                      </span>
                      {ex.primaryMuscles.slice(0, 2).map((m) => (
                        <span key={m} className="font-mono text-[9px] text-faint">{m.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-panel border border-border rounded-xl overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-border flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-syne font-bold text-base text-white leading-tight">{selected.name}</h2>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border inline-block mt-1"
                style={{ color: LEVEL_COLOR[selected.level], borderColor: LEVEL_COLOR[selected.level] + '44' }}>
                {LEVEL_LABEL[selected.level]}
              </span>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted text-xs hover:text-white ml-2 flex-shrink-0">✕</button>
          </div>
          {selected.gifUrl && (
            <div className="border-b border-border bg-[#0d0d13]">
              <ExerciseImageLoop gifUrl={selected.gifUrl} alt={selected.name} className="w-full object-contain max-h-48" />
            </div>
          )}
          <div className="p-4 space-y-4 flex-1">
            {selected.primaryMuscles.length > 0 && (
              <div>
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-2">Principal</p>
                <div className="flex flex-wrap gap-1">
                  {selected.primaryMuscles.map((m) => (
                    <span key={m} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">{m.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}
            {selected.secondaryMuscles.length > 0 && (
              <div>
                <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-2">Secundário</p>
                <div className="flex flex-wrap gap-1">
                  {selected.secondaryMuscles.map((m) => (
                    <span key={m} className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-border text-muted">{m.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}
            {(selected.clinicalNotes?.length ?? 0) > 0 && (
              <div className="bg-orange-400/5 border border-orange-400/25 rounded-xl p-3">
                <p className="font-mono text-[9px] text-orange-300 uppercase tracking-widest mb-1">⚠ Notas clínicas</p>
                {selected.clinicalNotes?.map((n) => (
                  <p key={n} className="font-mono text-[10px] text-muted">{n}</p>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 pb-4 flex flex-col gap-2">
            <ExerciseLinkButton name={selected.name} className="w-full rounded-lg py-2" />
            <button onClick={() => handleDelete(selected.id)}
              className="w-full font-mono text-xs text-red-400 border border-red-400/20 rounded-lg py-2 hover:border-red-400/40 transition-colors">
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

  const fi = 'w-full bg-[#0d0d13] border border-border rounded-lg px-3 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent';

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-syne font-black text-lg text-white">Novo Exercício</h2>
        <div>
          <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fi} placeholder="Agachamento Livre" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Nível</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={fi} style={{ background: '#0d0d13' }}>
              <option value="INICIANTE">Iniciante</option>
              <option value="INTERMEDIO">Intermédio</option>
              <option value="AVANCADO">Avançado</option>
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Padrão</label>
            <select value={pattern} onChange={(e) => setPattern(e.target.value)} className={fi} style={{ background: '#0d0d13' }}>
              {Object.entries(PATTERN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Músculos primários (separados por vírgula)</label>
          <input value={primaryMuscles} onChange={(e) => setPrimaryMuscles(e.target.value)} className={fi} placeholder="quadriceps, gluteos" />
        </div>
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="font-sans text-sm text-muted hover:text-white px-4 py-2">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="bg-accent text-dark font-syne font-black text-sm px-5 py-2 rounded-lg disabled:opacity-50">
            {saving ? '...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
