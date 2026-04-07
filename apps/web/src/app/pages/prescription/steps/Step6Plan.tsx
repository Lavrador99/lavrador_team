import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { resetPrescription } from '../../../store/slices/prescriptionSlice';
import { programsApi } from '../../../utils/api/prescription.api';
import { ProgramPhase } from '@libs/types';
import {
  StepLabel, SectionTitle, Divider, BtnRow, BtnPrimary, BtnSecondary,
} from '../Prescription.styles';
import styled from 'styled-components';

export const Step6Plan: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { program } = useSelector((s: RootState) => s.prescription);
  const [openPhase, setOpenPhase] = useState<number>(0);

  if (!program) return <div style={{ color: '#666677', fontFamily: 'DM Mono', padding: 40 }}>Plano não encontrado.</div>;

  const phases = program.phases as unknown as ProgramPhase[];

  return (
    <div>
      <StepLabel>Passo 06 / 06</StepLabel>
      <SectionTitle>Plano de Prescrição</SectionTitle>

      <PlanHeader>
        <PlanName>{program.name}</PlanName>
        <PlanMeta>{phases.length} fases · {phases.reduce((a, p) => a + (p.weeks || 0), 0)} semanas</PlanMeta>
      </PlanHeader>

      {phases.map((phase, i) => (
        <PhaseBlock key={i}>
          <PhaseHead onClick={() => setOpenPhase(openPhase === i ? -1 : i)}>
            <PhaseNum>{String(i + 1).padStart(2, '0')}</PhaseNum>
            <PhaseInfo>
              <PhaseName dangerouslySetInnerHTML={{ __html: phase.name }} />
              <PhaseSub>{phase.sub}</PhaseSub>
            </PhaseInfo>
            <PhaseToggle>{openPhase === i ? '▴' : '▾'}</PhaseToggle>
          </PhaseHead>

          {openPhase === i && (
            <PhaseBody>
              <PhaseDesc>{phase.description}</PhaseDesc>
              <MethodTags>
                {phase.method.map((m) => <MethodTag key={m}>{m}</MethodTag>)}
              </MethodTags>

              <FittSection $color="#42a5f5">🏃 Cardiovascular</FittSection>
              <FittGrid>
                <FittCard><FittLabel>Frequência</FittLabel><FittVal>{phase.cardio.freq}</FittVal></FittCard>
                <FittCard><FittLabel>Intensidade</FittLabel><FittVal>{phase.cardio.intensidade}</FittVal></FittCard>
                <FittCard><FittLabel>Tempo</FittLabel><FittVal>{phase.cardio.tempo}</FittVal></FittCard>
                <FittCard><FittLabel>Tipo</FittLabel><FittVal>{phase.cardio.tipo}</FittVal></FittCard>
                <FittCard><FittLabel>Volume</FittLabel><FittVal>{phase.cardio.volume}</FittVal></FittCard>
                <FittCard><FittLabel>Progressão</FittLabel><FittVal>{phase.cardio.progressao}</FittVal></FittCard>
              </FittGrid>

              <FittSection $color="#c8f542">💪 Força / Resistência Muscular</FittSection>
              <FittGrid>
                <FittCard><FittLabel>Frequência</FittLabel><FittVal>{phase.forca.freq}</FittVal></FittCard>
                <FittCard><FittLabel>Intensidade</FittLabel><FittVal>{phase.forca.intensidade}</FittVal></FittCard>
                <FittCard><FittLabel>Séries × Reps</FittLabel><FittVal>{phase.forca.series}</FittVal></FittCard>
                <FittCard><FittLabel>Intervalo</FittLabel><FittVal>{phase.forca.intervalo}</FittVal></FittCard>
                <FittCard><FittLabel>Velocidade</FittLabel><FittVal>{phase.forca.velocidade}</FittVal></FittCard>
                <FittCard style={{ gridColumn: '1/-1' }}><FittLabel>Exercícios (80/20)</FittLabel>
                  <FittVal style={{ whiteSpace: 'pre-line' }}>{phase.forca.exercicios}</FittVal></FittCard>
                <FittCard style={{ gridColumn: '1/-1' }}><FittLabel>Progressão</FittLabel><FittVal>{phase.forca.progressao}</FittVal></FittCard>
              </FittGrid>

              <FittSection $color="#ff8c5a">🧘 Flexibilidade / Mobilidade</FittSection>
              <FittGrid>
                <FittCard><FittLabel>Frequência</FittLabel><FittVal>{phase.flex.freq}</FittVal></FittCard>
                <FittCard><FittLabel>Tipo</FittLabel><FittVal>{phase.flex.tipo}</FittVal></FittCard>
                <FittCard><FittLabel>Tempo</FittLabel><FittVal>{phase.flex.tempo}</FittVal></FittCard>
                <FittCard><FittLabel>Volume</FittLabel><FittVal>{phase.flex.volume}</FittVal></FittCard>
                <FittCard style={{ gridColumn: '1/-1' }}><FittLabel>Foco especial</FittLabel><FittVal>{phase.flex.foco}</FittVal></FittCard>
              </FittGrid>

              <WeekTable>
                <thead>
                  <tr><Th>Semana</Th><Th>Força</Th><Th>Cardio</Th><Th>Flex</Th></tr>
                </thead>
                <tbody>
                  {phase.weekByWeek.map((w, wi) => (
                    <tr key={wi}>
                      <Td style={{ fontFamily: 'DM Mono', fontSize: 11, color: '#666677' }}>S{w.wk}</Td>
                      <Td>{w.forca}</Td>
                      <Td>{w.cardio}</Td>
                      <Td>{w.flex}</Td>
                    </tr>
                  ))}
                </tbody>
              </WeekTable>
            </PhaseBody>
          )}
        </PhaseBlock>
      ))}

      <BtnRow>
        <BtnPrimary as="a" href={programsApi.exportJson(program.id)} download>
          ⬇ Exportar JSON
        </BtnPrimary>
        <BtnSecondary onClick={() => dispatch(resetPrescription())}>
          ↺ Nova Prescrição
        </BtnSecondary>
      </BtnRow>
    </div>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const PlanHeader = styled.div`
  background: rgba(200,245,66,0.06);
  border: 1px solid rgba(200,245,66,0.15);
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 24px;
`;
const PlanName = styled.h2`font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #e8e8f0;`;
const PlanMeta = styled.p`font-family: 'DM Mono', monospace; font-size: 11px; color: #666677; margin-top: 4px;`;

const PhaseBlock = styled.div`background: #111118; border: 1px solid #2a2a35; border-radius: 10px; margin-bottom: 12px; overflow: hidden;`;
const PhaseHead = styled.div`display: flex; align-items: center; gap: 14px; padding: 16px 20px; cursor: pointer; transition: background 0.2s; &:hover { background: #18181f; }`;
const PhaseNum = styled.div`width: 34px; height: 34px; border-radius: 6px; background: rgba(200,245,66,0.08); border: 1px solid rgba(200,245,66,0.2); display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-size: 12px; color: #c8f542; flex-shrink: 0;`;
const PhaseInfo = styled.div`flex: 1;`;
const PhaseName = styled.div`font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #e8e8f0;`;
const PhaseSub = styled.div`font-family: 'DM Mono', monospace; font-size: 10px; color: #666677; margin-top: 2px;`;
const PhaseToggle = styled.div`font-size: 16px; color: #666677;`;
const PhaseBody = styled.div`padding: 0 20px 20px;`;
const PhaseDesc = styled.p`font-size: 13px; color: #666677; line-height: 1.6; margin-bottom: 12px;`;
const MethodTags = styled.div`display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;`;
const MethodTag = styled.span`font-family: 'DM Mono', monospace; font-size: 10px; padding: 3px 10px; border-radius: 3px; background: rgba(66,165,245,0.08); border: 1px solid rgba(66,165,245,0.2); color: #42a5f5;`;
const FittSection = styled.div<{ $color: string }>`font-family: 'DM Mono', monospace; font-size: 11px; color: ${p => p.$color}; margin: 16px 0 8px;`;
const FittGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;`;
const FittCard = styled.div`background: #18181f; border-radius: 6px; padding: 10px 12px; border: 1px solid #2a2a35;`;
const FittLabel = styled.div`font-family: 'DM Mono', monospace; font-size: 9px; color: #666677; letter-spacing: 2px; margin-bottom: 4px;`;
const FittVal = styled.div`font-size: 13px; color: #e8e8f0; line-height: 1.5;`;
const WeekTable = styled.table`width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px;`;
const Th = styled.th`text-align: left; padding: 8px; font-family: 'DM Mono', monospace; font-size: 9px; color: #666677; letter-spacing: 2px; border-bottom: 1px solid #2a2a35;`;
const Td = styled.td`padding: 9px 8px; border-bottom: 1px solid #1a1a22; vertical-align: top; color: #c0c0cc; line-height: 1.4;`;
