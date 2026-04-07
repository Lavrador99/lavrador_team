import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { updateFormData, nextStep, prevStep } from '../../../store/slices/prescriptionSlice';
import {
  StepLabel, SectionTitle, Grid2, Field, Label, Select,
  ChipGroup, Chip, Divider, SectionLabel, BtnRow, BtnPrimary, BtnSecondary, ErrorMsg,
} from '../Prescription.styles';

const OBJETIVOS = ['Emagrecimento', 'Hipertrofia', 'Força Máxima', 'Resistência Cardiovascular', 'Saúde Geral', 'Performance Atlética'];
const LESOES = ['joelho', 'ombro', 'lombar', 'tornozelo', 'cervical'];
const LESAO_LABELS: Record<string, string> = { joelho: 'Joelho', ombro: 'Ombro', lombar: 'Lombar', tornozelo: 'Tornozelo', cervical: 'Cervical' };
const EQUIPAMENTOS = ['ginasio_completo', 'barra', 'halteres', 'rack', 'maquinas', 'cabo', 'kettlebell', 'banco', 'cardio_eq', 'peso_corporal', 'barra_fixa', 'paralelas', 'resistance_band'];
const EQUIP_LABELS: Record<string, string> = {
  ginasio_completo: 'Ginásio completo', barra: 'Barra', halteres: 'Halteres',
  rack: 'Rack', maquinas: 'Máquinas', cabo: 'Cabo', kettlebell: 'Kettlebell',
  banco: 'Banco', cardio_eq: 'Cardio', peso_corporal: 'Peso Corporal',
  barra_fixa: 'Barra Fixa', paralelas: 'Paralelas', resistance_band: 'Elásticos',
};

export const Step2Sports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData } = useSelector((s: RootState) => s.prescription);

  const [pratica, setPratica] = useState(formData.pratica ?? 'nao');
  const [tempoTreino, setTempoTreino] = useState(formData.tempoTreino?.toString() ?? '0');
  const [diasSemana, setDiasSemana] = useState(formData.diasSemana?.toString() ?? '3');
  const [duracaoSessao, setDuracaoSessao] = useState(formData.duracaoSessao?.toString() ?? '60');
  const [objetivo, setObjetivo] = useState(formData.objetivo ?? '');
  const [lesoes, setLesoes] = useState<string[]>(formData.lesoes ?? []);
  const [equipamento, setEquipamento] = useState<string[]>(formData.equipamento ?? []);
  const [error, setError] = useState('');

  const toggle = (val: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const handleNext = () => {
    if (!objetivo) { setError('Seleciona um objetivo.'); return; }
    if (equipamento.length === 0) { setError('Seleciona pelo menos um equipamento disponível.'); return; }
    dispatch(updateFormData({
      pratica, tempoTreino: parseFloat(tempoTreino),
      diasSemana: parseInt(diasSemana), duracaoSessao: parseInt(duracaoSessao),
      objetivo, lesoes, equipamento,
    }));
    dispatch(nextStep());
  };

  return (
    <div>
      <StepLabel>Passo 02 / 06</StepLabel>
      <SectionTitle>Anamnese Desportiva & Objetivos</SectionTitle>

      <Grid2>
        <Field>
          <Label>Pratica exercício atualmente?</Label>
          <Select value={pratica} onChange={(e) => setPratica(e.target.value)}>
            <option value="nao">Não / recentemente começou</option>
            <option value="sim_pouco">Sim, irregular (&lt;2x/sem)</option>
            <option value="sim">Sim, regular (2–3x/sem)</option>
            <option value="sim_muito">Sim, intenso (4+x/sem)</option>
          </Select>
        </Field>
        <Field><Label>Há quanto tempo (meses)</Label><Select value={tempoTreino} onChange={(e) => setTempoTreino(e.target.value)}>
          {[0,1,2,3,6,9,12,18,24,36,60].map((v) => <option key={v} value={v}>{v === 0 ? 'Nunca / &lt;1 mês' : `${v} meses`}</option>)}
        </Select></Field>
        <Field><Label>Dias disponíveis/semana</Label><Select value={diasSemana} onChange={(e) => setDiasSemana(e.target.value)}>
          {[2,3,4,5,6].map((v) => <option key={v} value={v}>{v} dias</option>)}
        </Select></Field>
        <Field><Label>Duração por sessão</Label><Select value={duracaoSessao} onChange={(e) => setDuracaoSessao(e.target.value)}>
          {[30,45,60,75,90].map((v) => <option key={v} value={v}>{v} min</option>)}
        </Select></Field>
      </Grid2>

      <Divider />
      <SectionLabel>Objetivo principal</SectionLabel>
      <ChipGroup>
        {OBJETIVOS.map((o) => (
          <Chip key={o} $selected={objetivo === o} onClick={() => setObjetivo(o)}>{o}</Chip>
        ))}
      </ChipGroup>

      <Divider />
      <SectionLabel>Problemas ortopédicos / lesões</SectionLabel>
      <ChipGroup>
        {LESOES.map((l) => (
          <Chip key={l} $selected={lesoes.includes(l)} $warn onClick={() => toggle(l, lesoes, setLesoes)}>{LESAO_LABELS[l]}</Chip>
        ))}
        <Chip $selected={lesoes.length === 0} onClick={() => setLesoes([])}>Sem lesões</Chip>
      </ChipGroup>

      <Divider />
      <SectionLabel>Equipamento disponível</SectionLabel>
      <ChipGroup>
        {EQUIPAMENTOS.map((e) => (
          <Chip key={e} $selected={equipamento.includes(e)} onClick={() => toggle(e, equipamento, setEquipamento)}>{EQUIP_LABELS[e]}</Chip>
        ))}
      </ChipGroup>

      {error && <ErrorMsg>{error}</ErrorMsg>}
      <BtnRow>
        <BtnSecondary onClick={() => dispatch(prevStep())}>← Voltar</BtnSecondary>
        <BtnPrimary onClick={handleNext}>Continuar →</BtnPrimary>
      </BtnRow>
    </div>
  );
};
