import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  initNew, setName, setDayLabel, addBlock, reorderBlocks,
  saveWorkout, loadWorkout, previewDuration, clearError,
} from '../../store/slices/workoutEditorSlice';
import { BlockCard } from './editor/BlockCard';
import { BlockType } from '@libs/types';
import { assessmentsApi } from '../../utils/api/clients.api';
import styled from 'styled-components';

const BLOCK_TYPES: { type: BlockType; label: string; emoji: string; desc: string }[] = [
  { type: 'WARMUP',      label: 'Aquecimento',  emoji: '🔥', desc: '5–10 min dinâmico' },
  { type: 'SEQUENTIAL',  label: 'Sequencial',   emoji: '📋', desc: 'Séries normais A, B, C...' },
  { type: 'SUPERSET',    label: 'Superset',     emoji: '⚡', desc: 'Agonista + Antagonista' },
  { type: 'CIRCUIT',     label: 'Circuito',     emoji: '🔄', desc: 'Sem repouso entre exercícios' },
  { type: 'TABATA',      label: 'Tabata / HIIT',emoji: '⏱', desc: '20s trabalho / 10s repouso' },
  { type: 'CARDIO',      label: 'Cardio',       emoji: '🏃', desc: 'Contínuo, intervalado, fartlek' },
  { type: 'FLEXIBILITY', label: 'Flexibilidade',emoji: '🧘', desc: 'Estático, PNF, balístico' },
];

export const WorkoutEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { blocks, name, dayLabel, programId, clientId, isDirty, saving, durationPreview, error, workout } =
    useSelector((s: RootState) => s.workoutEditor);

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [clientProfile, setClientProfile] = useState<{ level: string; flags: string[] } | null>(null);

  const previewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init
  useEffect(() => {
    if (id) {
      dispatch(loadWorkout(id));
    } else {
      dispatch(initNew({
        programId: searchParams.get('programId') ?? '',
        clientId: searchParams.get('clientId') ?? '',
      }));
    }
  }, [id]);

  // Fetch client assessment (level + flags) for suggestion engine
  useEffect(() => {
    if (!clientId) return;
    assessmentsApi.getByClient(clientId).then((assessments) => {
      if (assessments.length > 0) {
        const latest = assessments[assessments.length - 1];
        setClientProfile({ level: latest.level, flags: latest.flags });
      }
    }).catch(() => { /* assessment opcional */ });
  }, [clientId]);

  // Auto preview duration on block changes
  useEffect(() => {
    if (previewTimeout.current) clearTimeout(previewTimeout.current);
    previewTimeout.current = setTimeout(() => {
      if (blocks.length > 0) dispatch(previewDuration(blocks));
    }, 800);
    return () => { if (previewTimeout.current) clearTimeout(previewTimeout.current); };
  }, [blocks]);

  const handleDrop = () => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      dispatch(reorderBlocks({ fromIndex: dragFrom, toIndex: dragOver }));
    }
    setDragFrom(null);
    setDragOver(null);
  };

  const handleSave = async () => {
    const result = await dispatch(saveWorkout());
    if (saveWorkout.fulfilled.match(result)) {
      navigate(-1);
    }
  };

  const backPath = programId
    ? `/workouts?programId=${programId}&clientId=${clientId}`
    : -1 as any;

  return (
    <Page>
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <TopBar>
        <BackBtn onClick={() => navigate(backPath)}>← Treinos</BackBtn>
        <TitleArea>
          <NameInput
            value={name}
            onChange={(e) => dispatch(setName(e.target.value))}
            placeholder="Nome do treino..."
          />
          <DayInput
            value={dayLabel}
            onChange={(e) => dispatch(setDayLabel(e.target.value))}
            placeholder="Dia / etiqueta (ex: Dia A, Segunda)"
          />
        </TitleArea>
        <TopActions>
          {durationPreview && (
            <DurationBadge $warn={!!durationPreview.warning}>
              ⏱ ~{durationPreview.totalMin} min
              {durationPreview.warning && ' ⚠'}
            </DurationBadge>
          )}
          <SaveBtn onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'A guardar...' : isDirty ? 'Guardar' : 'Guardado ✓'}
          </SaveBtn>
        </TopActions>
      </TopBar>

      {durationPreview?.warning && (
        <WarnBanner>{durationPreview.warning}</WarnBanner>
      )}

      {error && <ErrorBanner onClick={() => dispatch(clearError())}>{error} (clica para fechar)</ErrorBanner>}

      {/* ── Canvas ────────────────────────────────────────────────────── */}
      <Canvas onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {blocks.length === 0 ? (
          <EmptyCanvas>
            <EmptyIcon>📋</EmptyIcon>
            <EmptyTitle>Adiciona um bloco para começar</EmptyTitle>
            <EmptyText>Escolhe o tipo de bloco abaixo — sequencial, superset, tabata, cardio ou flexibilidade.</EmptyText>
          </EmptyCanvas>
        ) : (
          blocks.map((block, i) => (
            <BlockCard
              key={block.id}
              block={block}
              index={i}
              isDragging={dragFrom === i}
              onDragStart={setDragFrom}
              onDragOver={setDragOver}
              onDrop={handleDrop}
              clientId={clientId}
              clientLevel={clientProfile?.level ?? 'INTERMEDIO'}
              clientFlags={clientProfile?.flags ?? []}
            />
          ))
        )}
      </Canvas>

      {/* ── Add block panel ───────────────────────────────────────────── */}
      <AddBlockBar>
        <AddBlockToggle onClick={() => setShowBlockPicker(!showBlockPicker)}>
          {showBlockPicker ? '▴ Fechar' : '+ Adicionar Bloco'}
        </AddBlockToggle>
        {showBlockPicker && (
          <BlockPickerGrid>
            {BLOCK_TYPES.map(({ type, label, emoji, desc }) => (
              <BlockPickerItem
                key={type}
                onClick={() => {
                  dispatch(addBlock(type));
                  setShowBlockPicker(false);
                }}
              >
                <BlockPickerEmoji>{emoji}</BlockPickerEmoji>
                <BlockPickerLabel>{label}</BlockPickerLabel>
                <BlockPickerDesc>{desc}</BlockPickerDesc>
              </BlockPickerItem>
            ))}
          </BlockPickerGrid>
        )}
      </AddBlockBar>
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Page = styled.div`min-height:100vh; background:#0a0a0f; display:flex; flex-direction:column;`;
const TopBar = styled.div`display:flex; align-items:center; gap:16px; padding:16px 24px; border-bottom:1px solid #1e1e28; background:#0d0d13; flex-wrap:wrap;`;
const BackBtn = styled.button`background:none; border:none; color:#666677; font-size:12px; cursor:pointer; font-family:'DM Mono',monospace; flex-shrink:0; &:hover{color:#c8f542;}`;
const TitleArea = styled.div`flex:1; display:flex; flex-direction:column; gap:4px;`;
const NameInput = styled.input`background:transparent; border:none; border-bottom:1px solid #2a2a35; color:#e8e8f0; font-family:'Syne',sans-serif; font-size:18px; font-weight:800; padding:2px 0; outline:none; &:focus{border-bottom-color:#c8f542;} &::placeholder{color:#333;}`;
const DayInput = styled.input`background:transparent; border:none; color:#666677; font-family:'DM Mono',monospace; font-size:11px; padding:2px 0; outline:none; &::placeholder{color:#333;}`;
const TopActions = styled.div`display:flex; align-items:center; gap:12px; flex-shrink:0;`;
const DurationBadge = styled.div<{ $warn?: boolean }>`font-family:'DM Mono',monospace; font-size:11px; padding:5px 12px; border-radius:4px; background:${p=>p.$warn?'rgba(255,107,53,0.1)':'rgba(200,245,66,0.08)'}; color:${p=>p.$warn?'#ff8c5a':'#c8f542'}; border:1px solid ${p=>p.$warn?'rgba(255,107,53,0.2)':'rgba(200,245,66,0.2)'};`;
const SaveBtn = styled.button`background:#c8f542; color:#0a0a0f; border:none; border-radius:6px; padding:10px 20px; font-family:'Syne',sans-serif; font-weight:700; font-size:13px; cursor:pointer; transition:all .2s; &:hover:not(:disabled){background:#d4ff55;} &:disabled{opacity:.5;cursor:default;}`;
const WarnBanner = styled.div`background:rgba(255,107,53,0.08); border-bottom:1px solid rgba(255,107,53,0.2); padding:10px 24px; font-family:'DM Mono',monospace; font-size:12px; color:#ff8c5a;`;
const ErrorBanner = styled.div`background:rgba(255,59,59,0.08); border-bottom:1px solid rgba(255,59,59,0.2); padding:10px 24px; font-family:'DM Mono',monospace; font-size:12px; color:#ff6b6b; cursor:pointer;`;
const Canvas = styled.div`flex:1; padding:24px; overflow-y:auto;`;
const EmptyCanvas = styled.div`text-align:center; padding:80px 24px;`;
const EmptyIcon = styled.div`font-size:48px; margin-bottom:16px;`;
const EmptyTitle = styled.h2`font-family:'Syne',sans-serif; font-size:20px; font-weight:700; color:#e8e8f0; margin-bottom:8px;`;
const EmptyText = styled.p`font-family:'DM Mono',monospace; font-size:12px; color:#666677; max-width:400px; margin:0 auto; line-height:1.6;`;
const AddBlockBar = styled.div`border-top:1px solid #1e1e28; background:#0d0d13; padding:16px 24px;`;
const AddBlockToggle = styled.button`background:rgba(200,245,66,0.08); border:1px solid rgba(200,245,66,0.2); color:#c8f542; border-radius:6px; padding:10px 20px; font-family:'DM Mono',monospace; font-size:12px; cursor:pointer; transition:all .15s; &:hover{background:rgba(200,245,66,0.14);}`;
const BlockPickerGrid = styled.div`display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; margin-top:14px;`;
const BlockPickerItem = styled.div`background:#111118; border:1px solid #2a2a35; border-radius:8px; padding:14px; cursor:pointer; transition:all .15s; &:hover{border-color:rgba(200,245,66,0.3);background:rgba(200,245,66,0.04);}`;
const BlockPickerEmoji = styled.div`font-size:20px; margin-bottom:6px;`;
const BlockPickerLabel = styled.div`font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:#e8e8f0; margin-bottom:3px;`;
const BlockPickerDesc = styled.div`font-family:'DM Mono',monospace; font-size:10px; color:#666677;`;
