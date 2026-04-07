import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { updateFormData, nextStep, prevStep } from '../../../store/slices/prescriptionSlice';
import styled from 'styled-components';
import {
  SectionTitle, SectionDescription, CardSection, CardSectionTitle,
  ChipGroup, Chip, BtnRow, BtnPrimary, BtnSecondary, ErrorMsg,
  OptionCard, OptionGrid, OptionIcon, OptionLabel, OptionSub,
  StepperRow, StepperOption,
} from '../Prescription.styles';

const OBJETIVOS: { value: string; icon: string; label: string; sub: string }[] = [
  { value: 'Emagrecimento',              icon: '🔥', label: 'Emagrecimento',       sub: 'Perda de massa gorda' },
  { value: 'Hipertrofia',                icon: '💪', label: 'Hipertrofia',          sub: 'Ganho muscular' },
  { value: 'Força Máxima',               icon: '🏋️', label: 'Força Máxima',         sub: 'Performance de força' },
  { value: 'Resistência Cardiovascular', icon: '❤️', label: 'Resistência Cardio',   sub: 'Capacidade aeróbica' },
  { value: 'Saúde Geral',                icon: '🌿', label: 'Saúde Geral',           sub: 'Bem-estar e qualidade de vida' },
  { value: 'Performance Atlética',       icon: '⚡', label: 'Performance',           sub: 'Rendimento desportivo' },
];

const PRATICA_OPTIONS = [
  { value: 'nao',       icon: '🛋️', label: 'Não',         sub: 'Nunca / recomeçou' },
  { value: 'sim_pouco', icon: '🚶', label: 'Irregular',   sub: 'Menos de 2x/sem' },
  { value: 'sim',       icon: '🏃', label: 'Regular',     sub: '2–3x por semana' },
  { value: 'sim_muito', icon: '⚡', label: 'Intenso',     sub: '4+ vezes por semana' },
];

const LESOES = ['joelho', 'ombro', 'lombar', 'tornozelo', 'cervical'];
const LESAO_LABELS: Record<string, string> = {
  joelho: 'Joelho', ombro: 'Ombro', lombar: 'Lombar',
  tornozelo: 'Tornozelo', cervical: 'Cervical',
};

const EQUIPAMENTOS = [
  'ginasio_completo', 'barra', 'halteres', 'rack', 'maquinas', 'cabo',
  'kettlebell', 'banco', 'cardio_eq', 'peso_corporal', 'barra_fixa',
  'paralelas', 'resistance_band',
];
const EQUIP_LABELS: Record<string, string> = {
  ginasio_completo: 'Ginásio completo', barra: 'Barra', halteres: 'Halteres',
  rack: 'Rack', maquinas: 'Máquinas', cabo: 'Cabo', kettlebell: 'Kettlebell',
  banco: 'Banco', cardio_eq: 'Cardio', peso_corporal: 'Peso corporal',
  barra_fixa: 'Barra fixa', paralelas: 'Paralelas', resistance_band: 'Elásticos',
};

const DIAS = [2, 3, 4, 5, 6];
const DURACAO = [30, 45, 60, 75, 90];
const TEMPO_TREINO = [
  { value: 0, label: '< 1 mês' },
  { value: 1, label: '1 mês' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '1 ano' },
  { value: 24, label: '2 anos' },
  { value: 36, label: '3 anos' },
  { value: 60, label: '5+ anos' },
];

export const Step2Sports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData } = useSelector((s: RootState) => s.prescription);

  const [pratica, setPratica] = useState(formData.pratica ?? 'nao');
  const [tempoTreino, setTempoTreino] = useState(formData.tempoTreino?.toString() ?? '0');
  const [diasSemana, setDiasSemana] = useState(formData.diasSemana ?? 3);
  const [duracaoSessao, setDuracaoSessao] = useState(formData.duracaoSessao ?? 60);
  const [objetivo, setObjetivo] = useState(formData.objetivo ?? '');
  const [lesoes, setLesoes] = useState<string[]>(formData.lesoes ?? []);
  const [equipamento, setEquipamento] = useState<string[]>(formData.equipamento ?? []);
  const [error, setError] = useState('');

  const toggle = (val: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const handleNext = () => {
    if (!objetivo) { setError('Seleciona um objetivo principal.'); return; }
    if (equipamento.length === 0) { setError('Seleciona pelo menos um equipamento disponível.'); return; }
    dispatch(updateFormData({
      pratica,
      tempoTreino: parseFloat(tempoTreino),
      diasSemana,
      duracaoSessao,
      objetivo,
      lesoes,
      equipamento,
    }));
    dispatch(nextStep());
  };

  return (
    <div>
      <SectionTitle>Anamnese Desportiva</SectionTitle>
      <SectionDescription>
        Historial de treino, objetivos e equipamento disponível.
      </SectionDescription>

      {/* ── Objetivo ──────────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Objetivo principal</CardSectionTitle>
        <ObjectiveGrid>
          {OBJETIVOS.map((o) => (
            <OptionCard
              key={o.value}
              $selected={objetivo === o.value}
              onClick={() => setObjetivo(o.value)}
            >
              <OptionIcon>{o.icon}</OptionIcon>
              <OptionLabel $selected={objetivo === o.value}>{o.label}</OptionLabel>
              <OptionSub>{o.sub}</OptionSub>
            </OptionCard>
          ))}
        </ObjectiveGrid>
      </CardSection>

      {/* ── Historial ─────────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Nível de atividade atual</CardSectionTitle>
        <OptionGrid $cols={4}>
          {PRATICA_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              $selected={pratica === o.value}
              onClick={() => setPratica(o.value)}
            >
              <OptionIcon>{o.icon}</OptionIcon>
              <OptionLabel $selected={pratica === o.value}>{o.label}</OptionLabel>
              <OptionSub>{o.sub}</OptionSub>
            </OptionCard>
          ))}
        </OptionGrid>

        <div style={{ marginTop: 20 }}>
          <CardSectionTitle>Há quanto tempo treina?</CardSectionTitle>
          <TempoGrid>
            {TEMPO_TREINO.map((t) => (
              <TempoOption
                key={t.value}
                $selected={tempoTreino === t.value.toString()}
                onClick={() => setTempoTreino(t.value.toString())}
              >
                {t.label}
              </TempoOption>
            ))}
          </TempoGrid>
        </div>
      </CardSection>

      {/* ── Disponibilidade ───────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Disponibilidade semanal</CardSectionTitle>

        <AvailRow>
          <AvailGroup>
            <AvailLabel>Dias por semana</AvailLabel>
            <StepperRow>
              {DIAS.map((d) => (
                <StepperOption
                  key={d}
                  $selected={diasSemana === d}
                  onClick={() => setDiasSemana(d)}
                >
                  {d}
                </StepperOption>
              ))}
            </StepperRow>
          </AvailGroup>

          <AvailGroup>
            <AvailLabel>Duração por sessão</AvailLabel>
            <StepperRow>
              {DURACAO.map((d) => (
                <DuracaoOption
                  key={d}
                  $selected={duracaoSessao === d}
                  onClick={() => setDuracaoSessao(d)}
                >
                  {d}'
                </DuracaoOption>
              ))}
            </StepperRow>
          </AvailGroup>
        </AvailRow>
      </CardSection>

      {/* ── Lesões ────────────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Problemas ortopédicos / lesões</CardSectionTitle>
        <ChipGroup>
          {LESOES.map((l) => (
            <Chip key={l} $selected={lesoes.includes(l)} $warn onClick={() => toggle(l, lesoes, setLesoes)}>
              {LESAO_LABELS[l]}
            </Chip>
          ))}
          <Chip $selected={lesoes.length === 0} onClick={() => setLesoes([])}>
            Sem lesões
          </Chip>
        </ChipGroup>
      </CardSection>

      {/* ── Equipamento ───────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Equipamento disponível</CardSectionTitle>
        <ChipGroup>
          {EQUIPAMENTOS.map((e) => (
            <Chip key={e} $selected={equipamento.includes(e)} onClick={() => toggle(e, equipamento, setEquipamento)}>
              {EQUIP_LABELS[e]}
            </Chip>
          ))}
        </ChipGroup>
      </CardSection>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <BtnRow>
        <BtnSecondary onClick={() => dispatch(prevStep())}>← Voltar</BtnSecondary>
        <BtnPrimary onClick={handleNext}>Continuar →</BtnPrimary>
      </BtnRow>
    </div>
  );
};

// ─── Local styles ─────────────────────────────────────────────────────────────

const ObjectiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  @media (max-width: 640px) { grid-template-columns: 1fr 1fr; }
`;

const TempoGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TempoOption = styled.button<{ $selected?: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1.5px solid ${({ $selected }) => ($selected ? '#c8f542' : '#1e1e28')};
  background: ${({ $selected }) => ($selected ? 'rgba(200,245,66,0.07)' : '#0e0e15')};
  color: ${({ $selected }) => ($selected ? '#c8f542' : '#555566')};
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #c8f542; color: #e8e8f0; }
`;

const AvailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const AvailGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AvailLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const DuracaoOption = styled.button<{ $selected?: boolean }>`
  width: 64px;
  height: 52px;
  border-radius: 10px;
  border: 1.5px solid ${({ $selected }) => ($selected ? '#c8f542' : '#1e1e28')};
  background: ${({ $selected }) => ($selected ? 'rgba(200,245,66,0.07)' : '#111118')};
  color: ${({ $selected }) => ($selected ? '#c8f542' : '#555566')};
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #c8f542; color: #e8e8f0; }
`;
