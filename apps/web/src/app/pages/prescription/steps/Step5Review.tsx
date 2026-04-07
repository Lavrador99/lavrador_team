import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { AppDispatch, RootState } from "../../../store";
import {
  generateProgram,
  prevStep,
  saveAssessment,
} from "../../../store/slices/prescriptionSlice";
import {
  BtnPrimary,
  BtnRow,
  BtnSecondary,
  Divider,
  ErrorMsg,
  FlagBox,
  FlagText,
  FlagTitle,
  NoteBox,
  ScoreBadge,
  ScoreBadgeLabel,
  ScoreBadgeVal,
  ScoreRow,
  SectionTitle,
  StepLabel,
} from "../Prescription.styles";

const NIVEL_LABEL: Record<string, string> = {
  INICIANTE: "Iniciante",
  INTERMEDIO: "Intermédio",
  AVANCADO: "Avançado",
};
const NIVEL_COLOR: Record<string, string> = {
  INICIANTE: "#ff8c5a",
  INTERMEDIO: "#42a5f5",
  AVANCADO: "#c8f542",
};

export const Step5Review: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData, selections, clientId, assessment, loading, error } =
    useSelector((s: RootState) => s.prescription);

  const {
    idade = 30,
    fcRep = 70,
    peso,
    altura,
    pctGordura,
    vo2max,
    objetivo,
  } = formData;

  const fcmax = Math.round(207 - 0.7 * idade);
  const imc =
    peso && altura ? (peso / Math.pow(altura / 100, 2)).toFixed(1) : null;

  const z1Low = Math.round((fcmax - fcRep) * 0.5 + fcRep);
  const z1High = Math.round((fcmax - fcRep) * 0.6 + fcRep);
  const z2Low = Math.round((fcmax - fcRep) * 0.6 + fcRep);
  const z2High = Math.round((fcmax - fcRep) * 0.75 + fcRep);
  const z3Low = Math.round((fcmax - fcRep) * 0.75 + fcRep);
  const z3High = Math.round((fcmax - fcRep) * 0.9 + fcRep);

  const hasFlags = buildFlagList(formData).length > 0;

  const handleGenerate = async () => {
    if (!clientId) return;

    let assessmentId = assessment?.id;

    if (!assessmentId) {
      const result = await dispatch(
        saveAssessment({ clientId, data: formData as any }),
      );
      if (saveAssessment.rejected.match(result)) return;
      assessmentId = (result.payload as any).id;
    }

    if (!assessmentId) return;

    dispatch(generateProgram({ assessmentId, clientId, selections }));
  };

  return (
    <div>
      <StepLabel>Passo 05 / 06</StepLabel>
      <SectionTitle>Revisão do Perfil</SectionTitle>

      <ScoreRow>
        <ScoreBadge>
          <ScoreBadgeLabel>CLIENTE</ScoreBadgeLabel>
          <ScoreBadgeVal style={{ fontSize: 16 }}>
            {formData.nome}
          </ScoreBadgeVal>
        </ScoreBadge>
        <ScoreBadge>
          <ScoreBadgeLabel>OBJETIVO</ScoreBadgeLabel>
          <ScoreBadgeVal $color="#c8f542" style={{ fontSize: 14 }}>
            {objetivo}
          </ScoreBadgeVal>
        </ScoreBadge>
        {imc && (
          <ScoreBadge>
            <ScoreBadgeLabel>IMC</ScoreBadgeLabel>
            <ScoreBadgeVal
              $color={parseFloat(imc) > 25 ? "#ff8c5a" : "#c8f542"}
            >
              {imc}
            </ScoreBadgeVal>
          </ScoreBadge>
        )}
        {pctGordura && (
          <ScoreBadge>
            <ScoreBadgeLabel>% GORDURA</ScoreBadgeLabel>
            <ScoreBadgeVal $color={pctGordura > 28 ? "#ff3b3b" : "#42a5f5"}>
              {pctGordura}%
            </ScoreBadgeVal>
          </ScoreBadge>
        )}
        <ScoreBadge>
          <ScoreBadgeLabel>FC MÁX</ScoreBadgeLabel>
          <ScoreBadgeVal $color="#42a5f5">{fcmax} bpm</ScoreBadgeVal>
        </ScoreBadge>
      </ScoreRow>

      <NoteBox>
        <strong>Zonas Karvonen</strong> · FCmáx = {fcmax} bpm · FCrep = {fcRep}{" "}
        bpm
        <br />
        Z1 (50–60%):{" "}
        <strong>
          {z1Low}–{z1High}
        </strong>{" "}
        &nbsp;|&nbsp; Z2 (60–75%):{" "}
        <strong>
          {z2Low}–{z2High}
        </strong>{" "}
        &nbsp;|&nbsp; Z3 (75–90%):{" "}
        <strong>
          {z3Low}–{z3High}
        </strong>{" "}
        bpm
      </NoteBox>

      <Divider />

      <ReviewRow>
        <ReviewKey>Disponibilidade</ReviewKey>
        <ReviewVal>
          {formData.diasSemana}x/sem · {formData.duracaoSessao} min/sessão
        </ReviewVal>
      </ReviewRow>
      <ReviewRow>
        <ReviewKey>Exercício atual</ReviewKey>
        <ReviewVal>
          {formData.pratica} · {formData.tempoTreino} meses
        </ReviewVal>
      </ReviewRow>
      <ReviewRow>
        <ReviewKey>Lesões</ReviewKey>
        <ReviewVal>{formData.lesoes?.join(", ") || "Nenhuma"}</ReviewVal>
      </ReviewRow>
      <ReviewRow>
        <ReviewKey>Equipamento</ReviewKey>
        <ReviewVal>{formData.equipamento?.join(", ")}</ReviewVal>
      </ReviewRow>
      <ReviewRow>
        <ReviewKey>Exercícios selecionados</ReviewKey>
        <ReviewVal>
          {selections.length} exercícios (
          {selections.filter((s) => s.type === "PREFERRED").length} preferidos)
        </ReviewVal>
      </ReviewRow>

      {hasFlags && (
        <FlagBox style={{ marginTop: 20 }}>
          <div style={{ fontSize: 20 }}>⚠️</div>
          <div>
            <FlagTitle>FLAGS CLÍNICOS DETETADOS</FlagTitle>
            <FlagText>{buildFlagList(formData).join(" · ")}</FlagText>
          </div>
        </FlagBox>
      )}

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <BtnRow>
        <BtnSecondary onClick={() => dispatch(prevStep())}>
          ← Voltar
        </BtnSecondary>
        <BtnPrimary onClick={handleGenerate} disabled={loading}>
          {loading ? "A gerar plano..." : "Gerar Plano →"}
        </BtnPrimary>
      </BtnRow>
    </div>
  );
};

function buildFlagList(formData: any): string[] {
  const flags: string[] = [];
  if (
    formData.sintomas?.some((s: string) =>
      ["palpitacoes", "dor_peito", "dispneia", "diabetes", "drc"].includes(s),
    )
  ) {
    flags.push("Sintomas clínicos");
  }
  if ((formData.pas ?? 0) >= 140 || (formData.pad ?? 0) >= 90)
    flags.push("Hipertensão arterial");
  if (formData.riscos?.includes("fumador")) flags.push("Tabagismo");
  return flags;
}

const ReviewRow = styled.div`
  display: flex;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #1e1e28;
  &:last-of-type {
    border-bottom: none;
  }
`;
const ReviewKey = styled.span`
  font-family: "DM Mono", monospace;
  font-size: 11px;
  color: #666677;
  min-width: 160px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-top: 2px;
`;
const ReviewVal = styled.span`
  font-size: 13px;
  color: #e8e8f0;
`;
