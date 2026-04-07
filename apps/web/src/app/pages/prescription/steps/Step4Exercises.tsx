import { ExerciseDto, MovementPattern } from "@libs/types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { MuscleMap } from "../../../components/MuscleMap";
import { useExercises } from "../../../hooks/useExercises";
import { AppDispatch, RootState } from "../../../store";
import {
  addSelection,
  nextStep,
  prevStep,
  replaceSelection,
} from "../../../store/slices/prescriptionSlice";
import {
  BtnPrimary,
  BtnRow,
  BtnSecondary,
  CardSection,
  CardSectionTitle,
  NoteBox,
  SectionDescription,
  SectionTitle,
} from "../Prescription.styles";

const PATTERNS: { key: MovementPattern; label: string; icon: string }[] = [
  { key: "empurrar_horizontal", label: "Peito",      icon: "◈" },
  { key: "puxar_vertical",      label: "Costas V.",  icon: "↑" },
  { key: "puxar_horizontal",    label: "Costas H.",  icon: "→" },
  { key: "empurrar_vertical",   label: "Ombros",     icon: "↑" },
  { key: "dominante_joelho",    label: "Pernas Q.",  icon: "◉" },
  { key: "dominante_anca",      label: "Pernas G.",  icon: "◉" },
  { key: "core",                label: "Core",       icon: "▣" },
  { key: "locomocao",           label: "Full Body",  icon: "⟳" },
];

const EQUIP_MAP: Record<string, string> = {
  ginasio_completo: "BARRA,HALTERES,RACK,MAQUINAS,CABO,KETTLEBELL,BANCO,CARDIO_EQ,BARRA_FIXA,PARALELAS,RESISTANCE_BAND,PESO_CORPORAL",
  barra: "BARRA", halteres: "HALTERES", rack: "RACK", maquinas: "MAQUINAS",
  cabo: "CABO", kettlebell: "KETTLEBELL", banco: "BANCO", cardio_eq: "CARDIO_EQ",
  peso_corporal: "PESO_CORPORAL", barra_fixa: "BARRA_FIXA", paralelas: "PARALELAS",
  resistance_band: "RESISTANCE_BAND",
};

const LEVEL_LABEL: Record<string, string> = {
  INICIANTE: "Iniciante", INTERMEDIO: "Intermédio", AVANCADO: "Avançado",
};
const LEVEL_COLOR: Record<string, string> = {
  INICIANTE: "#42a5f5", INTERMEDIO: "#c8f542", AVANCADO: "#ff8c5a",
};

export const Step4Exercises: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData, selections } = useSelector((s: RootState) => s.prescription);

  const [activePattern, setActivePattern] = useState<MovementPattern>("empurrar_horizontal");
  const [swapTarget, setSwapTarget]         = useState<string | null>(null);
  const [showAll, setShowAll]               = useState(false);
  const [detailEx, setDetailEx]             = useState<ExerciseDto | null>(null);

  const equipmentFilter = (formData.equipamento ?? [])
    .flatMap((e) => EQUIP_MAP[e]?.split(",") ?? [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(",");

  const { exercises, loading } = useExercises({
    pattern: activePattern,
    equipment: equipmentFilter || undefined,
  });

  const visible = showAll ? exercises : exercises.slice(0, 4);

  const preferredForPattern = selections.filter(
    (s) => s.pattern === activePattern && s.type === "PREFERRED",
  );

  const isSelected  = (id: string) => selections.some((s) => s.exerciseId === id);
  const isDone      = (key: MovementPattern) => selections.some((s) => s.pattern === key);

  const handleSelect = (ex: ExerciseDto) => {
    if (isSelected(ex.id)) return;
    if (swapTarget && swapTarget !== "_browse") {
      dispatch(replaceSelection({
        oldId: swapTarget,
        newSelection: { exerciseId: ex.id, pattern: activePattern, type: "PREFERRED", name: ex.name },
      }));
      setSwapTarget(null);
    } else {
      dispatch(addSelection({ exerciseId: ex.id, pattern: activePattern, type: "PREFERRED", name: ex.name }));
      setSwapTarget(null);
    }
    setShowAll(false);
    setDetailEx(null);
  };

  const handlePatternChange = (p: MovementPattern) => {
    setActivePattern(p);
    setSwapTarget(null);
    setShowAll(false);
    setDetailEx(null);
  };

  return (
    <div>
      <SectionTitle>Seleção de Exercícios</SectionTitle>
      <SectionDescription>
        Escolhe os exercícios preferidos para cada padrão de movimento.
        O motor injetará automaticamente 20% de exercícios corretivos.
      </SectionDescription>

      {/* ── Pattern tabs ──────────────────────────────────────── */}
      <PatternGrid>
        {PATTERNS.map((p) => (
          <PatternTab
            key={p.key}
            $active={activePattern === p.key}
            $done={isDone(p.key)}
            onClick={() => handlePatternChange(p.key)}
          >
            <PatternIcon>{p.icon}</PatternIcon>
            <PatternLabel>{p.label}</PatternLabel>
            {isDone(p.key) && <DoneBadge>✓</DoneBadge>}
          </PatternTab>
        ))}
      </PatternGrid>

      {/* ── Selected for this pattern ─────────────────────────── */}
      {preferredForPattern.length > 0 && (
        <CardSection>
          <CardSectionTitle>Selecionados — {PATTERNS.find(p => p.key === activePattern)?.label}</CardSectionTitle>
          {preferredForPattern.map((sel) => (
            <SelectedItem key={sel.exerciseId}>
              <CheckMark>✓</CheckMark>
              <SelectedName>{sel.name}</SelectedName>
              <SwapBtn onClick={() => { setSwapTarget(sel.exerciseId); setShowAll(true); }}>
                Trocar
              </SwapBtn>
            </SelectedItem>
          ))}
        </CardSection>
      )}

      {swapTarget && (
        <SwapBanner>
          <span>
            {swapTarget === "_browse"
              ? "A mostrar todos — escolhe um para adicionar"
              : "Modo substituição — escolhe o novo exercício"}
          </span>
          <CancelBtn onClick={() => { setSwapTarget(null); setShowAll(false); }}>
            Cancelar
          </CancelBtn>
        </SwapBanner>
      )}

      {/* ── Exercise list ─────────────────────────────────────── */}
      <ListHeader>
        {loading
          ? "A carregar exercícios..."
          : `${exercises.length} exercícios disponíveis`}
      </ListHeader>

      {loading ? (
        <LoadingMsg>A carregar...</LoadingMsg>
      ) : exercises.length === 0 ? (
        <EmptyMsg>Nenhum exercício encontrado para o equipamento selecionado.</EmptyMsg>
      ) : (
        <ExerciseList>
          {visible.map((ex) => (
            <ExerciseCard
              key={ex.id}
              $selected={isSelected(ex.id)}
              onClick={() => setDetailEx(detailEx?.id === ex.id ? null : ex)}
            >
              <ExerciseCardTop>
                <ExerciseInfo>
                  <ExerciseName $selected={isSelected(ex.id)}>{ex.name}</ExerciseName>
                  <ExerciseMeta>
                    {ex.primaryMuscles.slice(0, 3).join(", ")}
                    {(ex.clinicalNotes?.length ?? 0) > 0 && (
                      <WarnFlag> · ⚠ {ex.clinicalNotes?.map(n => n.replace('evitar_', '')).join(', ')}</WarnFlag>
                    )}
                  </ExerciseMeta>
                </ExerciseInfo>
                <RightSide>
                  <LevelBadge $color={LEVEL_COLOR[ex.level]}>
                    {LEVEL_LABEL[ex.level]}
                  </LevelBadge>
                  {isSelected(ex.id)
                    ? <SelectedTag>✓</SelectedTag>
                    : <AddBtn>+ Selecionar</AddBtn>
                  }
                </RightSide>
              </ExerciseCardTop>

              {/* Expanded detail */}
              {detailEx?.id === ex.id && (
                <ExerciseDetail onClick={(e) => e.stopPropagation()}>
                  <DetailLayout>
                    {/* GIF or placeholder */}
                    <GifArea>
                      {ex.gifUrl
                        ? <GifImg src={ex.gifUrl} alt={ex.name} />
                        : <GifPlaceholder>
                            <PlaceholderIcon>🏋️</PlaceholderIcon>
                            <PlaceholderText>GIF não disponível</PlaceholderText>
                          </GifPlaceholder>
                      }
                    </GifArea>

                    {/* Muscle map */}
                    <MapArea>
                      <MuscleMap
                        primaryMuscles={ex.primaryMuscles}
                        secondaryMuscles={ex.secondaryMuscles}
                      />
                    </MapArea>
                  </DetailLayout>

                  {/* Muscles list */}
                  <MusclesList>
                    <MuscleGroup>
                      <MuscleGroupLabel>Principal</MuscleGroupLabel>
                      {ex.primaryMuscles.map(m => (
                        <MusclePill key={m} $primary>{m.replace(/_/g, ' ')}</MusclePill>
                      ))}
                    </MuscleGroup>
                    {ex.secondaryMuscles.length > 0 && (
                      <MuscleGroup>
                        <MuscleGroupLabel>Secundário</MuscleGroupLabel>
                        {ex.secondaryMuscles.map(m => (
                          <MusclePill key={m}>{m.replace(/_/g, ' ')}</MusclePill>
                        ))}
                      </MuscleGroup>
                    )}
                  </MusclesList>

                  {!isSelected(ex.id) && (
                    <SelectFromDetail onClick={() => handleSelect(ex)}>
                      + Adicionar ao plano
                    </SelectFromDetail>
                  )}
                </ExerciseDetail>
              )}
            </ExerciseCard>
          ))}

          {!showAll && exercises.length > 4 && (
            <ShowMoreBtn onClick={() => { setShowAll(true); setSwapTarget("_browse"); }}>
              Ver todos os {exercises.length} exercícios
            </ShowMoreBtn>
          )}
        </ExerciseList>
      )}

      {/* ── Summary ───────────────────────────────────────────── */}
      <SummaryBar>
        <SummaryText>
          {selections.length} exercícios selecionados
        </SummaryText>
        <PatternProgress>
          {PATTERNS.map((p) => (
            <ProgressDot key={p.key} $done={isDone(p.key)} title={p.label} />
          ))}
        </PatternProgress>
      </SummaryBar>

      <BtnRow>
        <BtnSecondary onClick={() => dispatch(prevStep())}>← Voltar</BtnSecondary>
        <BtnPrimary onClick={() => dispatch(nextStep())}>Continuar →</BtnPrimary>
      </BtnRow>
    </div>
  );
};

// ─── Styled components ────────────────────────────────────────────────────────

const PatternGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 24px;
  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
`;

const PatternTab = styled.button<{ $active?: boolean; $done?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: 10px;
  border: 1.5px solid ${({ $active, $done }) =>
    $active ? '#c8f542' : $done ? 'rgba(200,245,66,0.3)' : '#1e1e28'};
  background: ${({ $active }) =>
    $active ? 'rgba(200,245,66,0.07)' : '#111118'};
  cursor: pointer;
  transition: all 0.18s;
  &:hover { border-color: rgba(200,245,66,0.5); }
`;

const PatternIcon = styled.div`
  font-size: 16px;
  color: #555566;
`;

const PatternLabel = styled.div<{ $active?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #555566;
  letter-spacing: 0.5px;
  text-align: center;
`;

const DoneBadge = styled.div`
  position: absolute;
  top: 6px; right: 8px;
  font-size: 10px;
  color: #c8f542;
`;

const SelectedItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(200,245,66,0.04);
  border: 1px solid rgba(200,245,66,0.15);
  border-radius: 8px;
  margin-bottom: 8px;
`;

const CheckMark = styled.div`
  color: #c8f542;
  font-size: 14px;
  flex-shrink: 0;
`;

const SelectedName = styled.div`
  flex: 1;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #c8f542;
`;

const SwapBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  color: #555566;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #c8f542; color: #c8f542; }
`;

const SwapBanner = styled.div`
  background: rgba(255,165,0,0.06);
  border: 1px solid rgba(255,165,0,0.25);
  border-radius: 8px;
  padding: 10px 16px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #ffaa00;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,165,0,0.3);
  color: #ffaa00;
  padding: 4px 12px;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
  font-family: 'DM Mono', monospace;
  white-space: nowrap;
`;

const ListHeader = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #333342;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
`;

const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
`;

const ExerciseCard = styled.div<{ $selected?: boolean }>`
  background: ${({ $selected }) => ($selected ? 'rgba(200,245,66,0.03)' : '#111118')};
  border: 1.5px solid ${({ $selected }) => ($selected ? 'rgba(200,245,66,0.25)' : '#1e1e28')};
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.18s;
  overflow: hidden;
  &:hover { border-color: ${({ $selected }) => ($selected ? 'rgba(200,245,66,0.35)' : 'rgba(200,245,66,0.4)')}; }
`;

const ExerciseCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 12px;
`;

const ExerciseInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ExerciseName = styled.div<{ $selected?: boolean }>`
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: ${({ $selected }) => ($selected ? '#c8f542' : '#e8e8f0')};
  margin-bottom: 4px;
`;

const ExerciseMeta = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const WarnFlag = styled.span`
  color: #ff8c5a;
`;

const RightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const LevelBadge = styled.div<{ $color: string }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: ${({ $color }) => $color};
  letter-spacing: 1px;
  border: 1px solid ${({ $color }) => $color}44;
  border-radius: 4px;
  padding: 2px 7px;
`;

const SelectedTag = styled.span`
  font-size: 14px;
  color: #c8f542;
`;

const AddBtn = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #42a5f5;
  letter-spacing: 0.5px;
  white-space: nowrap;
`;

/* ── Exercise detail ────── */

const ExerciseDetail = styled.div`
  padding: 0 16px 16px;
  border-top: 1px solid #1a1a24;
  margin-top: 0;
  animation: detailIn 0.2s ease;
  @keyframes detailIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const DetailLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const GifArea = styled.div`
  border-radius: 8px;
  overflow: hidden;
  background: #0e0e15;
  border: 1px solid #1e1e28;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GifImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const GifPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
`;

const PlaceholderIcon = styled.div`
  font-size: 32px;
  opacity: 0.3;
`;

const PlaceholderText = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #333342;
  letter-spacing: 1px;
`;

const MapArea = styled.div`
  padding: 8px;
`;

const MusclesList = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 14px;
  flex-wrap: wrap;
`;

const MuscleGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
`;

const MuscleGroupLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #333342;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-right: 4px;
`;

const MusclePill = styled.div<{ $primary?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 20px;
  background: ${({ $primary }) => ($primary ? 'rgba(200,245,66,0.1)' : 'rgba(200,245,66,0.04)')};
  border: 1px solid ${({ $primary }) => ($primary ? 'rgba(200,245,66,0.3)' : '#1e1e28')};
  color: ${({ $primary }) => ($primary ? '#c8f542' : '#555566')};
`;

const SelectFromDetail = styled.button`
  margin-top: 14px;
  padding: 10px 20px;
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 7px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s;
  &:hover { background: #d4ff55; }
`;

const ShowMoreBtn = styled.button`
  background: transparent;
  border: 1px dashed #1e1e28;
  color: #444455;
  padding: 12px;
  border-radius: 8px;
  width: 100%;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #444455; color: #888899; }
`;

const LoadingMsg = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #444455;
  padding: 24px 0;
  text-align: center;
`;

const EmptyMsg = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #ff8c5a;
  padding: 24px 0;
  text-align: center;
`;

const SummaryBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 10px;
  margin-top: 8px;
`;

const SummaryText = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #555566;
`;

const PatternProgress = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const ProgressDot = styled.div<{ $done?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $done }) => ($done ? '#c8f542' : '#1e1e28')};
  border: 1px solid ${({ $done }) => ($done ? '#c8f542' : '#2a2a35')};
  transition: all 0.2s;
`;
