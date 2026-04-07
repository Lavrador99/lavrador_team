import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  removeBlock, updateBlock, addExercise,
  removeExercise, updateExercise, reorderExercises,
} from '../../../store/slices/workoutEditorSlice';
import { WorkoutBlock, BlockExercise, BlockType } from '@libs/types';
import { useExercises } from '../../../hooks/useExercises';
import { SuggestionPanel } from '../../../components/sugestion/SuggestionPanel';
import { ExerciseSuggestion } from '../../../utils/api/suggestion.api';
import styled, { keyframes } from 'styled-components';

const BLOCK_COLORS: Record<BlockType, string> = {
  WARMUP:      '#42a5f5',
  SEQUENTIAL:  '#c8f542',
  SUPERSET:    '#a855f7',
  CIRCUIT:     '#ff8c5a',
  TABATA:      '#ff3b3b',
  CARDIO:      '#06b6d4',
  FLEXIBILITY: '#10b981',
};

const BLOCK_LABELS: Record<BlockType, string> = {
  WARMUP:      'Aquecimento',
  SEQUENTIAL:  'Sequencial',
  SUPERSET:    'Superset / Agonista-Antagonista',
  CIRCUIT:     'Circuito',
  TABATA:      'Tabata / HIIT',
  CARDIO:      'Cardio',
  FLEXIBILITY: 'Flexibilidade / Alongamentos',
};

const CARDIO_METHODS = [
  { value: 'CONTINUO_EXTENSIVO', label: 'Contínuo Extensivo (30–120 min, ~70% VO₂máx)' },
  { value: 'CONTINUO_INTENSIVO', label: 'Contínuo Intensivo (20–30 min, limiar anaeróbio)' },
  { value: 'CONTINUO_VARIAVEL',  label: 'Contínuo Variável (Fartlek)' },
  { value: 'INTERVALADO',        label: 'Intervalado (3–5 min, rácio 1:1)' },
  { value: 'HIIT',               label: 'HIIT (30–90s, rácio 1:5)' },
  { value: 'FARTLEK',            label: 'Fartlek (20–60 min, intensidade variável)' },
];

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
  'Quadríceps', 'Isquiotibiais', 'Glúteos', 'Core', 'Full Body',
];

interface Props {
  block: WorkoutBlock;
  index: number;
  isDragging: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  clientId: string;
  clientLevel: string;
  clientFlags: string[];
}

export const BlockCard: React.FC<Props> = ({
  block, index, isDragging, onDragStart, onDragOver, onDrop,
  clientId, clientLevel, clientFlags,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [collapsed, setCollapsed] = useState(false);
  const [showExSearch, setShowExSearch] = useState<string | null>(null);
  const [showBrainModal, setShowBrainModal] = useState(false);

  const handleImport = (ex: ExerciseSuggestion) => {
    dispatch(addExercise({
      blockId: block.id,
      exercise: {
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        muscleGroup: ex.primaryMuscles[0],
      },
    }));
    setShowBrainModal(false);
  };
  const [exSearchMuscle, setExSearchMuscle] = useState('');
  const [exSearchText, setExSearchText] = useState('');

  const color = BLOCK_COLORS[block.type];

  const { exercises: exSuggestions } = useExercises(
    showExSearch
      ? {
          muscle: exSearchMuscle || undefined,
          search: exSearchText || undefined,
        }
      : {},
  );

  // ── Tabata total calculation ─────────────────────────────────────────
  const tabataTotal = block.tabata
    ? block.tabata.rounds * (block.tabata.workSeconds + block.tabata.restSeconds)
    : 0;

  const updateTabata = (changes: Partial<typeof block.tabata>) => {
    const t = { ...block.tabata!, ...changes };
    t.totalSeconds = t.rounds * (t.workSeconds + t.restSeconds);
    dispatch(updateBlock({ id: block.id, changes: { tabata: t } }));
  };

  return (
    <Card
      $color={color}
      $isDragging={isDragging}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={onDrop}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <CardHeader>
        <DragHandle title="Arrastar para reordenar">⠿</DragHandle>
        <TypeBadge $color={color}>{BLOCK_LABELS[block.type]}</TypeBadge>
        <LabelInput
          value={block.label ?? ''}
          onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { label: e.target.value } }))}
          placeholder={`Nome do bloco...`}
        />
        <CollapseBtn onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '▾' : '▴'}
        </CollapseBtn>
        <BrainBtn onClick={() => setShowBrainModal(true)} title="Sugestão Lavrador-Brain">
          🧠
        </BrainBtn>
        <RemoveBtn onClick={() => dispatch(removeBlock(block.id))}>✕</RemoveBtn>
      </CardHeader>

      {showBrainModal && (
        <ModalBackdrop onClick={() => setShowBrainModal(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <SuggestionPanel
              forceOpen
              onClose={() => setShowBrainModal(false)}
              onImport={handleImport}
              clientId={clientId}
              level={clientLevel}
              flags={clientFlags}
            />
          </ModalBox>
        </ModalBackdrop>
      )}

      {!collapsed && (
        <CardBody>

          {/* ── TABATA config ─────────────────────────────────────────── */}
          {block.type === 'TABATA' && block.tabata && (
            <TabataConfig>
              <TabataRow>
                <TabataField>
                  <TLabel>Trabalho (s)</TLabel>
                  <NumInput type="number" min={5} max={60} value={block.tabata.workSeconds}
                    onChange={(e) => updateTabata({ workSeconds: parseInt(e.target.value) || 20 })} />
                </TabataField>
                <TabataField>
                  <TLabel>Repouso (s)</TLabel>
                  <NumInput type="number" min={5} max={60} value={block.tabata.restSeconds}
                    onChange={(e) => updateTabata({ restSeconds: parseInt(e.target.value) || 10 })} />
                </TabataField>
                <TabataField>
                  <TLabel>Rounds</TLabel>
                  <NumInput type="number" min={1} max={20} value={block.tabata.rounds}
                    onChange={(e) => updateTabata({ rounds: parseInt(e.target.value) || 8 })} />
                </TabataField>
                <TabataTotal>
                  ⏱ {Math.floor(tabataTotal / 60)}:{String(tabataTotal % 60).padStart(2, '0')} min total
                </TabataTotal>
              </TabataRow>
            </TabataConfig>
          )}

          {/* ── CARDIO config ─────────────────────────────────────────── */}
          {block.type === 'CARDIO' && (
            <CardioConfig>
              <Grid3>
                <Field>
                  <TLabel>Método</TLabel>
                  <SmSelect value={block.cardioMethod ?? 'CONTINUO_EXTENSIVO'}
                    onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { cardioMethod: e.target.value as any } }))}>
                    {CARDIO_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </SmSelect>
                </Field>
                <Field>
                  <TLabel>Duração (min)</TLabel>
                  <NumInput type="number" min={5} max={180} value={block.cardioDurationMin ?? 20}
                    onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { cardioDurationMin: parseInt(e.target.value) || 20 } }))} />
                </Field>
                <Field>
                  <TLabel>Zona FC baixa (bpm)</TLabel>
                  <NumInput type="number" min={60} max={200} value={block.cardioZoneLow ?? ''}
                    placeholder="ex: 130"
                    onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { cardioZoneLow: parseInt(e.target.value) || undefined } }))} />
                </Field>
                <Field>
                  <TLabel>Zona FC alta (bpm)</TLabel>
                  <NumInput type="number" min={60} max={220} value={block.cardioZoneHigh ?? ''}
                    placeholder="ex: 155"
                    onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { cardioZoneHigh: parseInt(e.target.value) || undefined } }))} />
                </Field>
              </Grid3>
            </CardioConfig>
          )}

          {/* ── FLEXIBILITY config ──────────────────────────────────── */}
          {(block.type === 'FLEXIBILITY' || block.type === 'WARMUP') && (
            <FlexConfig>
              <Grid3>
                <Field>
                  <TLabel>Método</TLabel>
                  <SmSelect value={block.stretchMethod ?? 'ESTATICO'}
                    onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { stretchMethod: e.target.value as any } }))}>
                    <option value="ESTATICO">Estático (10–30s)</option>
                    <option value="BALISTICO">Balístico (dinâmico)</option>
                    <option value="PNF">PNF (6s contração + 20s)</option>
                  </SmSelect>
                </Field>
                <Field>
                  <TLabel>Tempo de hold (s)</TLabel>
                  <NumInput type="number" min={5} max={60} value={block.holdSeconds ?? 20}
                    onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { holdSeconds: parseInt(e.target.value) || 20 } }))} />
                </Field>
                {block.stretchMethod === 'PNF' && (
                  <Field>
                    <TLabel>Contração PNF (s)</TLabel>
                    <NumInput type="number" min={3} max={10} value={block.contractionSeconds ?? 6}
                      onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { contractionSeconds: parseInt(e.target.value) || 6 } }))} />
                  </Field>
                )}
              </Grid3>
            </FlexConfig>
          )}

          {/* ── Repouso geral ─────────────────────────────────────────── */}
          {!['TABATA', 'CARDIO'].includes(block.type) && (
            <RestRow>
              <RestField>
                <TLabel>Repouso entre séries (s)</TLabel>
                <NumInput type="number" min={0} max={600} value={block.restBetweenSets}
                  onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { restBetweenSets: parseInt(e.target.value) || 0 } }))} />
              </RestField>
              <RestField>
                <TLabel>Repouso após bloco (s)</TLabel>
                <NumInput type="number" min={0} max={600} value={block.restAfterBlock}
                  onChange={(e) => dispatch(updateBlock({ id: block.id, changes: { restAfterBlock: parseInt(e.target.value) || 0 } }))} />
              </RestField>
            </RestRow>
          )}

          {/* ── Exercises list ────────────────────────────────────────── */}
          {!['CARDIO'].includes(block.type) && (
            <>
              <ExerciseList>
                {block.exercises.map((ex, exIdx) => (
                  <ExerciseRow
                    key={ex.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <ExHandle>⠿</ExHandle>
                    <ExFields>
                      <ExNameInput
                        value={ex.exerciseName}
                        onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { exerciseName: e.target.value } }))}
                        placeholder="Nome do exercício..."
                      />
                      <ExParams>
                        <ParamField>
                          <TLabel>Séries</TLabel>
                          <SmNumInput type="number" min={1} max={20} value={ex.sets}
                            onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { sets: parseInt(e.target.value) || 1 } }))} />
                        </ParamField>
                        <ParamField>
                          <TLabel>Reps / Tempo</TLabel>
                          <SmInput value={ex.reps}
                            onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { reps: e.target.value } }))}
                            placeholder="8-12 / AMRAP / 30s" />
                        </ParamField>
                        <ParamField>
                          <TLabel>Carga (kg)</TLabel>
                          <SmNumInput type="number" min={0} step={0.5} value={ex.load ?? ''}
                            placeholder="—"
                            onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { load: parseFloat(e.target.value) || undefined } }))} />
                        </ParamField>
                        <ParamField>
                          <TLabel>% 1RM</TLabel>
                          <SmNumInput type="number" min={1} max={100} value={ex.percentRM ?? ''}
                            placeholder="—"
                            onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { percentRM: parseInt(e.target.value) || undefined } }))} />
                        </ParamField>
                        <ParamField>
                          <TLabel>RIR</TLabel>
                          <SmNumInput type="number" min={0} max={10} value={ex.rir ?? ''}
                            placeholder="—"
                            onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { rir: parseInt(e.target.value) || undefined } }))} />
                        </ParamField>
                        <ParamField>
                          <TLabel>Tempo exec.</TLabel>
                          <SmInput value={ex.tempoExecution ?? ''}
                            onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { tempoExecution: e.target.value || undefined } }))}
                            placeholder="2:1:2:0" />
                        </ParamField>
                        {block.type !== 'SUPERSET' && block.type !== 'CIRCUIT' && (
                          <ParamField>
                            <TLabel>Repouso (s)</TLabel>
                            <SmNumInput type="number" min={0} value={ex.restAfterSet ?? block.restBetweenSets}
                              onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { restAfterSet: parseInt(e.target.value) || 0 } }))} />
                          </ParamField>
                        )}
                      </ExParams>
                      {ex.notes !== undefined && (
                        <NotesInput
                          value={ex.notes ?? ''}
                          onChange={(e) => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { notes: e.target.value } }))}
                          placeholder="Notas técnicas..."
                        />
                      )}
                    </ExFields>
                    <ExActions>
                      <ExNotesBtn
                        title="Notas técnicas"
                        $active={ex.notes !== undefined}
                        onClick={() => dispatch(updateExercise({ blockId: block.id, exId: ex.id, changes: { notes: ex.notes !== undefined ? undefined : '' } }))}
                      >✎</ExNotesBtn>
                      <ExRemoveBtn onClick={() => dispatch(removeExercise({ blockId: block.id, exId: ex.id }))}>✕</ExRemoveBtn>
                    </ExActions>
                  </ExerciseRow>
                ))}
              </ExerciseList>

              {/* ── Add exercise ─────────────────────────────────────── */}
              <AddExRow>
                <AddExBtn onClick={() => dispatch(addExercise({ blockId: block.id }))}>
                  + Exercício manual
                </AddExBtn>
                <AddExBtn $secondary onClick={() => setShowExSearch(showExSearch === block.id ? null : block.id)}>
                  🔍 Pesquisar base
                </AddExBtn>
              </AddExRow>

              {showExSearch === block.id && (
                <ExSearchPanel>
                  <SearchRow>
                    <SmSelect value={exSearchMuscle} onChange={(e) => setExSearchMuscle(e.target.value)}>
                      <option value="">Todos os grupos</option>
                      {MUSCLE_GROUPS.map((g) => <option key={g} value={g.toLowerCase()}>{g}</option>)}
                    </SmSelect>
                    <SearchInput value={exSearchText} onChange={(e) => setExSearchText(e.target.value)} placeholder="Pesquisar..." />
                  </SearchRow>
                  <SuggestionList>
                    {exSuggestions.slice(0, 8).map((ex) => (
                      <SuggestionItem key={ex.id} onClick={() => {
                        dispatch(addExercise({
                          blockId: block.id,
                          exercise: { exerciseId: ex.id, exerciseName: ex.name },
                        }));
                        setShowExSearch(null);
                      }}>
                        <span>{ex.name}</span>
                        <span style={{ color: '#666677', fontSize: 10, fontFamily: 'DM Mono' }}>
                          {ex.primaryMuscles.slice(0, 2).join(', ')}
                        </span>
                      </SuggestionItem>
                    ))}
                    {exSuggestions.length === 0 && (
                      <div style={{ color: '#666677', fontSize: 12, fontFamily: 'DM Mono', padding: '8px 0' }}>
                        Sem resultados
                      </div>
                    )}
                  </SuggestionList>
                </ExSearchPanel>
              )}
            </>
          )}

        </CardBody>
      )}
    </Card>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Card = styled.div<{ $color: string; $isDragging: boolean }>`
  background: #111118;
  border: 1px solid ${({ $color }) => $color}33;
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 10px;
  margin-bottom: 12px;
  opacity: ${({ $isDragging }) => $isDragging ? 0.5 : 1};
  transition: opacity .15s;
`;

const CardHeader = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-bottom: 1px solid #1e1e28;
`;

const DragHandle = styled.span`
  color: #444455; cursor: grab; font-size: 16px; flex-shrink: 0;
  &:active { cursor: grabbing; }
`;

const TypeBadge = styled.span<{ $color: string }>`
  font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px;
  padding: 3px 8px; border-radius: 3px;
  background: ${({ $color }) => $color}18;
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => $color}33;
  white-space: nowrap; flex-shrink: 0;
`;

const LabelInput = styled.input`
  flex: 1; background: transparent; border: none; border-bottom: 1px solid #2a2a35;
  color: #e8e8f0; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
  padding: 2px 4px; outline: none;
  &:focus { border-bottom-color: #c8f542; }
  &::placeholder { color: #444455; }
`;

const CollapseBtn = styled.button`
  background: none; border: none; color: #666677; cursor: pointer; font-size: 14px;
  &:hover { color: #e8e8f0; }
`;

const RemoveBtn = styled.button`
  background: none; border: none; color: #444455; cursor: pointer; font-size: 12px;
  &:hover { color: #ff6b6b; }
`;

const CardBody = styled.div`padding: 16px;`;

const TLabel = styled.div`
  font-family: 'DM Mono', monospace; font-size: 9px; color: #666677;
  letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;
`;

const NumInput = styled.input`
  background: #18181f; border: 1px solid #2a2a35; border-radius: 4px;
  padding: 6px 10px; color: #e8e8f0; font-size: 13px; outline: none;
  width: 100%; transition: border-color .15s;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #444455; }
`;

const SmSelect = styled.select`
  background: #18181f; border: 1px solid #2a2a35; border-radius: 4px;
  padding: 6px 8px; color: #e8e8f0; font-size: 12px; outline: none; width: 100%;
  option { background: #18181f; }
`;

const Grid3 = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;`;
const Field = styled.div`display: flex; flex-direction: column;`;
const TabataConfig = styled.div`background: rgba(255,59,59,0.06); border: 1px solid rgba(255,59,59,0.15); border-radius: 8px; padding: 14px; margin-bottom: 14px;`;
const TabataRow = styled.div`display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;`;
const TabataField = styled.div`display: flex; flex-direction: column; min-width: 80px;`;
const TabataTotal = styled.div`font-family: 'DM Mono', monospace; font-size: 13px; color: #ff6b6b; font-weight: 600; align-self: flex-end; padding-bottom: 6px;`;
const CardioConfig = styled.div`background: rgba(6,182,212,0.06); border: 1px solid rgba(6,182,212,0.15); border-radius: 8px; padding: 14px; margin-bottom: 14px;`;
const FlexConfig = styled.div`background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15); border-radius: 8px; padding: 14px; margin-bottom: 14px;`;
const RestRow = styled.div`display: flex; gap: 16px; margin-bottom: 14px;`;
const RestField = styled.div`flex: 1; display: flex; flex-direction: column;`;

const ExerciseList = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;`;
const ExerciseRow = styled.div`display: flex; gap: 8px; background: #18181f; border: 1px solid #2a2a35; border-radius: 8px; padding: 10px 12px; align-items: flex-start;`;
const ExHandle = styled.span`color: #2a2a35; cursor: grab; font-size: 14px; padding-top: 4px; flex-shrink: 0;`;
const ExFields = styled.div`flex: 1; display: flex; flex-direction: column; gap: 8px;`;
const ExNameInput = styled.input`background: transparent; border: none; border-bottom: 1px solid #2a2a35; color: #e8e8f0; font-size: 14px; font-weight: 500; padding: 2px 0; outline: none; width: 100%; &:focus{border-bottom-color:#c8f542;} &::placeholder{color:#444455;}`;
const ExParams = styled.div`display: flex; flex-wrap: wrap; gap: 10px;`;
const ParamField = styled.div`display: flex; flex-direction: column; min-width: 64px;`;
const SmNumInput = styled.input`background: #111118; border: 1px solid #2a2a35; border-radius: 4px; padding: 4px 6px; color: #e8e8f0; font-size: 12px; outline: none; width: 72px; &:focus{border-color:#c8f542;} &::placeholder{color:#333;}`;
const SmInput = styled.input`background: #111118; border: 1px solid #2a2a35; border-radius: 4px; padding: 4px 6px; color: #e8e8f0; font-size: 12px; outline: none; width: 80px; &:focus{border-color:#c8f542;} &::placeholder{color:#333;}`;
const NotesInput = styled.input`background: transparent; border: none; border-bottom: 1px dashed #2a2a35; color: #888; font-size: 11px; font-family: 'DM Mono'; padding: 2px 0; outline: none; width: 100%; &:focus{border-bottom-color:#666677;}`;
const ExActions = styled.div`display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;`;
const ExNotesBtn = styled.button<{ $active?: boolean }>`background: none; border: none; color: ${({ $active }) => $active ? '#c8f542' : '#444455'}; cursor: pointer; font-size: 13px; &:hover{color:#c8f542;}`;
const ExRemoveBtn = styled.button`background: none; border: none; color: #444455; cursor: pointer; font-size: 11px; &:hover{color:#ff6b6b;}`;

const AddExRow = styled.div`display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;`;
const AddExBtn = styled.button<{ $secondary?: boolean }>`
  padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: 'DM Mono', monospace;
  transition: all .15s;
  ${({ $secondary }) => $secondary
    ? 'background: transparent; border: 1px solid #2a2a35; color: #666677; &:hover{border-color:#42a5f5;color:#42a5f5;}'
    : 'background: rgba(200,245,66,0.08); border: 1px solid rgba(200,245,66,0.2); color: #c8f542; &:hover{background:rgba(200,245,66,0.12);}'}
`;

const ExSearchPanel = styled.div`background: #0d0d13; border: 1px solid #2a2a35; border-radius: 8px; padding: 12px; margin-top: 8px;`;
const SearchRow = styled.div`display: flex; gap: 8px; margin-bottom: 10px;`;
const SearchInput = styled.input`flex: 1; background: #18181f; border: 1px solid #2a2a35; border-radius: 4px; padding: 6px 10px; color: #e8e8f0; font-size: 12px; outline: none; &:focus{border-color:#c8f542;} &::placeholder{color:#444455;}`;
const SuggestionList = styled.div`display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto;`;
const SuggestionItem = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #e8e8f0; transition: background .1s; &:hover{background:rgba(200,245,66,0.06);}`;

const brainPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(200,245,66,0.5); }
  50%       { box-shadow: 0 0 0 5px rgba(200,245,66,0); }
`;

const BrainBtn = styled.button`
  background: none; border: none; font-size: 15px; cursor: pointer;
  border-radius: 50%; padding: 2px 4px; flex-shrink: 0;
  animation: ${brainPulse} 2s ease-in-out infinite;
  &:hover { background: rgba(200,245,66,0.1); }
`;

const ModalBackdrop = styled.div`
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.65); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
`;

const ModalBox = styled.div`
  width: 520px; max-width: 95vw; max-height: 90vh;
  overflow-y: auto; border-radius: 14px;
`;
