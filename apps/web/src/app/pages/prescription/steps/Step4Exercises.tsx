import { ExerciseDto, MovementPattern } from "@libs/types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
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
  Divider,
  NoteBox,
  SectionLabel,
  SectionTitle,
  StepLabel,
} from "../Prescription.styles";

const PATTERNS: { key: MovementPattern; label: string; emoji: string }[] = [
  { key: "empurrar_horizontal", label: "Peito / Empurrar H.", emoji: "🧠" },
  { key: "puxar_vertical", label: "Costas / Puxar V.", emoji: "🦾" },
  { key: "puxar_horizontal", label: "Costas / Puxar H.", emoji: "🦾" },
  { key: "empurrar_vertical", label: "Ombros / Empurrar V.", emoji: "💪" },
  { key: "dominante_joelho", label: "Pernas / Dom. Joelho", emoji: "🦵" },
  { key: "dominante_anca", label: "Pernas / Dom. Anca", emoji: "🦵" },
  { key: "core", label: "Core / Abdómen", emoji: "🧱" },
  { key: "locomocao", label: "Full Body / Cardio", emoji: "🧩" },
];

// Equipamento do form → enum do backend
const EQUIP_MAP: Record<string, string> = {
  ginasio_completo:
    "BARRA,HALTERES,RACK,MAQUINAS,CABO,KETTLEBELL,BANCO,CARDIO_EQ,BARRA_FIXA,PARALELAS,RESISTANCE_BAND,PESO_CORPORAL",
  barra: "BARRA",
  halteres: "HALTERES",
  rack: "RACK",
  maquinas: "MAQUINAS",
  cabo: "CABO",
  kettlebell: "KETTLEBELL",
  banco: "BANCO",
  cardio_eq: "CARDIO_EQ",
  peso_corporal: "PESO_CORPORAL",
  barra_fixa: "BARRA_FIXA",
  paralelas: "PARALELAS",
  resistance_band: "RESISTANCE_BAND",
};

export const Step4Exercises: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData, selections } = useSelector(
    (s: RootState) => s.prescription,
  );
  const [activePattern, setActivePattern] = useState<MovementPattern>(
    "empurrar_horizontal",
  );
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Equipamento disponível do cliente
  const equipmentFilter = (formData.equipamento ?? [])
    .flatMap((e) => EQUIP_MAP[e]?.split(",") ?? [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(",");

  // Filtros passados directamente — o hook reage a cada mudança de padrão
  const { exercises, loading } = useExercises({
    pattern: activePattern,
    equipment: equipmentFilter || undefined,
  });

  const suggestions = showAll ? exercises : exercises.slice(0, 3);

  const preferredForPattern = selections.filter(
    (s) => s.pattern === activePattern && s.type === "PREFERRED",
  );

  const isSelected = (id: string) =>
    selections.some((s) => s.exerciseId === id);

  const handleSelect = (ex: ExerciseDto) => {
    if (isSelected(ex.id)) return;
    if (swapTarget && swapTarget !== "_browse") {
      dispatch(
        replaceSelection({
          oldId: swapTarget,
          newSelection: {
            exerciseId: ex.id,
            pattern: activePattern,
            type: "PREFERRED",
            name: ex.name,
          },
        }),
      );
      setSwapTarget(null);
    } else {
      dispatch(
        addSelection({
          exerciseId: ex.id,
          pattern: activePattern,
          type: "PREFERRED",
          name: ex.name,
        }),
      );
      setSwapTarget(null);
    }
    setShowAll(false);
  };

  const handlePatternChange = (p: MovementPattern) => {
    setActivePattern(p);
    setSwapTarget(null);
    setShowAll(false);
  };

  return (
    <div>
      <StepLabel>Passo 04 / 06</StepLabel>
      <SectionTitle>Seleção de Exercícios</SectionTitle>

      <NoteBox>
        <strong>Regra 80/20:</strong> 80% dos exercícios serão os que o cliente
        prefere, 20% serão corretivos injectados pelo motor. Filtramos pelo
        equipamento disponível.
      </NoteBox>

      <PatternTabs>
        {PATTERNS.map((p) => {
          const hasSel = selections.some((s) => s.pattern === p.key);
          return (
            <PatternTab
              key={p.key}
              $active={activePattern === p.key}
              $done={hasSel}
              onClick={() => handlePatternChange(p.key)}
            >
              {p.emoji} {p.label}
              {hasSel && <DoneDot />}
            </PatternTab>
          );
        })}
      </PatternTabs>

      <Divider />

      {/* Exercícios já seleccionados para este padrão */}
      {preferredForPattern.length > 0 && (
        <SelectedBlock>
          <SectionLabel>Selecionados para este padrão</SectionLabel>
          {preferredForPattern.map((sel) => (
            <SelectedItem key={sel.exerciseId}>
              <span>✓ {sel.name}</span>
              <SwapBtn
                onClick={() => {
                  setSwapTarget(sel.exerciseId);
                  setShowAll(true);
                }}
              >
                Trocar
              </SwapBtn>
            </SelectedItem>
          ))}
        </SelectedBlock>
      )}

      {swapTarget && (
        <SwapBanner>
          {swapTarget === "_browse"
            ? "A mostrar todos os exercícios — escolhe um para adicionar"
            : "A substituir — escolhe o novo exercício abaixo"}
          <CancelBtn
            onClick={() => {
              setSwapTarget(null);
              setShowAll(false);
            }}
          >
            Cancelar
          </CancelBtn>
        </SwapBanner>
      )}

      <SectionLabel>
        {loading
          ? "A carregar..."
          : swapTarget
            ? `${exercises.length} exercícios disponíveis`
            : `Sugestões para este padrão (${exercises.length} disponíveis)`}
      </SectionLabel>

      {loading ? (
        <LoadingMsg>A carregar exercícios...</LoadingMsg>
      ) : exercises.length === 0 ? (
        <EmptyMsg>
          Nenhum exercício encontrado para o equipamento disponível.
        </EmptyMsg>
      ) : (
        <ExerciseList>
          {suggestions.map((ex) => (
            <ExerciseRow
              key={ex.id}
              $selected={isSelected(ex.id)}
              onClick={() => handleSelect(ex)}
            >
              <ExerciseInfo>
                <ExerciseName>{ex.name}</ExerciseName>
                <ExerciseMeta>
                  {ex.primaryMuscles.slice(0, 2).join(", ")}
                  {(ex.clinicalNotes?.length ?? 0) > 0 &&
                    " · ⚠ " +
                      ex.clinicalNotes
                        ?.map((n) => n.replace("evitar_", ""))
                        .join(", ")}
                </ExerciseMeta>
              </ExerciseInfo>
              {isSelected(ex.id) ? (
                <SelectedTag>✓</SelectedTag>
              ) : (
                <AddBtn>+ Selecionar</AddBtn>
              )}
            </ExerciseRow>
          ))}

          {!showAll && exercises.length > 3 && (
            <ShowMoreBtn
              onClick={() => {
                setShowAll(true);
                setSwapTarget("_browse");
              }}
            >
              Ver todos os {exercises.length} exercícios deste padrão
            </ShowMoreBtn>
          )}
        </ExerciseList>
      )}

      <Divider />
      <SummaryLabel>
        {selections.length} exercícios selecionados no total (
        {selections.filter((s) => s.type === "PREFERRED").length} preferidos)
      </SummaryLabel>

      <BtnRow>
        <BtnSecondary onClick={() => dispatch(prevStep())}>
          ← Voltar
        </BtnSecondary>
        <BtnPrimary onClick={() => dispatch(nextStep())}>
          Continuar →
        </BtnPrimary>
      </BtnRow>
    </div>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const PatternTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
`;

const PatternTab = styled.button<{ $active?: boolean; $done?: boolean }>`
  position: relative;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid ${({ $active }) => ($active ? "#c8f542" : "#2a2a35")};
  background: ${({ $active }) =>
    $active ? "rgba(200,245,66,0.08)" : "#18181f"};
  color: ${({ $active, $done }) =>
    $active ? "#c8f542" : $done ? "#aaa" : "#666677"};
  font-size: 12px;
  font-family: "DM Mono", monospace;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #c8f542;
  }
`;

const DoneDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #c8f542;
  border-radius: 50%;
  margin-left: 6px;
  vertical-align: middle;
`;

const SelectedBlock = styled.div`
  margin-bottom: 16px;
`;

const SelectedItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(200, 245, 66, 0.04);
  border: 1px solid rgba(200, 245, 66, 0.15);
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #c8f542;
`;

const SwapBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  color: #666677;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-family: "DM Mono", monospace;
  cursor: pointer;
  &:hover {
    border-color: #c8f542;
    color: #c8f542;
  }
`;

const SwapBanner = styled.div`
  background: rgba(255, 165, 0, 0.08);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #ffaa00;
  font-family: "DM Mono", monospace;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 165, 0, 0.4);
  color: #ffaa00;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  font-family: "DM Mono", monospace;
  margin-left: auto;
`;

const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const ExerciseRow = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${({ $selected }) =>
    $selected ? "rgba(200,245,66,0.04)" : "#18181f"};
  border: 1px solid
    ${({ $selected }) => ($selected ? "rgba(200,245,66,0.2)" : "#2a2a35")};
  border-radius: 8px;
  cursor: ${({ $selected }) => ($selected ? "default" : "pointer")};
  transition: border-color 0.15s;
  opacity: ${({ $selected }) => ($selected ? 0.7 : 1)};
  &:hover {
    border-color: ${({ $selected }) =>
      $selected ? "rgba(200,245,66,0.2)" : "#c8f542"};
  }
`;

const ExerciseInfo = styled.div`
  flex: 1;
`;
const ExerciseName = styled.div`
  font-size: 14px;
  color: #e8e8f0;
  font-weight: 500;
  margin-bottom: 2px;
`;
const ExerciseMeta = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  color: #666677;
`;
const SelectedTag = styled.span`
  font-size: 14px;
  color: #c8f542;
`;
const AddBtn = styled.span`
  font-size: 11px;
  color: #42a5f5;
  font-family: "DM Mono", monospace;
`;

const ShowMoreBtn = styled.button`
  background: transparent;
  border: 1px dashed #2a2a35;
  color: #666677;
  padding: 10px;
  border-radius: 6px;
  width: 100%;
  font-size: 12px;
  font-family: "DM Mono", monospace;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #666677;
    color: #e8e8f0;
  }
`;

const LoadingMsg = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 12px;
  color: #666677;
  padding: 20px 0;
`;
const EmptyMsg = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 12px;
  color: #ff8c5a;
  padding: 20px 0;
`;
const SummaryLabel = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 12px;
  color: #666677;
  margin-bottom: 4px;
`;
