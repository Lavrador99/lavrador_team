import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { updateFormData, nextStep, prevStep } from '../../../store/slices/prescriptionSlice';
import {
  StepLabel, SectionTitle, Grid2, Grid3, Field, Label, Input, Select,
  Divider, SectionLabel, BtnRow, BtnPrimary, BtnSecondary, NoteBox,
} from '../Prescription.styles';

export const Step3Physical: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData } = useSelector((s: RootState) => s.prescription);

  const [altura, setAltura] = useState(formData.altura?.toString() ?? '');
  const [peso, setPeso] = useState(formData.peso?.toString() ?? '');
  const [pctGordura, setPctGordura] = useState(formData.pctGordura?.toString() ?? '');
  const [cc, setCc] = useState(formData.cc?.toString() ?? '');
  const [fcRep, setFcRep] = useState(formData.fcRep?.toString() ?? '70');
  const [vo2max, setVo2max] = useState(formData.vo2max?.toString() ?? '');
  const [pushup, setPushup] = useState(formData.pushup?.toString() ?? '');
  const [rm1Squat, setRm1Squat] = useState(formData.rm1Squat?.toString() ?? '');
  const [rm1Bench, setRm1Bench] = useState(formData.rm1Bench?.toString() ?? '');
  const [mobOmbro, setMobOmbro] = useState(formData.mobOmbro?.toString() ?? '3');
  const [mobCF, setMobCF] = useState(formData.mobCF?.toString() ?? '3');
  const [sarVal, setSarVal] = useState(formData.sarVal?.toString() ?? '');

  const imc = altura && peso
    ? (parseFloat(peso) / Math.pow(parseFloat(altura) / 100, 2)).toFixed(1)
    : '';

  const fcmax = formData.idade
    ? Math.round(207 - 0.7 * formData.idade)
    : null;

  const fcrep = parseFloat(fcRep) || 70;
  const z2Low = fcmax ? Math.round((fcmax - fcrep) * 0.60 + fcrep) : null;
  const z2High = fcmax ? Math.round((fcmax - fcrep) * 0.75 + fcrep) : null;

  const handleNext = () => {
    dispatch(updateFormData({
      altura: altura ? parseFloat(altura) : undefined,
      peso: peso ? parseFloat(peso) : undefined,
      pctGordura: pctGordura ? parseFloat(pctGordura) : undefined,
      cc: cc ? parseFloat(cc) : undefined,
      fcRep: parseFloat(fcRep),
      vo2max: vo2max ? parseFloat(vo2max) : undefined,
      pushup: pushup ? parseInt(pushup) : undefined,
      rm1Squat: rm1Squat ? parseFloat(rm1Squat) : undefined,
      rm1Bench: rm1Bench ? parseFloat(rm1Bench) : undefined,
      mobOmbro: parseInt(mobOmbro),
      mobCF: parseInt(mobCF),
      sarVal: sarVal ? parseFloat(sarVal) : undefined,
    }));
    dispatch(nextStep());
  };

  return (
    <div>
      <StepLabel>Passo 03 / 06</StepLabel>
      <SectionTitle>Avaliação Física</SectionTitle>

      <SectionLabel>Antropometria</SectionLabel>
      <Grid3>
        <Field><Label>Altura (cm)</Label><Input type="number" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="170" /></Field>
        <Field><Label>Peso (kg)</Label><Input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="75" /></Field>
        <Field><Label>IMC calculado</Label><Input readOnly value={imc ? `${imc} kg/m²` : '—'} /></Field>
        <Field><Label>% Gordura</Label><Input type="number" value={pctGordura} onChange={(e) => setPctGordura(e.target.value)} placeholder="25" step="0.1" /></Field>
        <Field><Label>Circ. Cintura (cm)</Label><Input type="number" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="85" /></Field>
        <Field><Label>FC Repouso (bpm)</Label><Input type="number" value={fcRep} onChange={(e) => setFcRep(e.target.value)} placeholder="70" /></Field>
      </Grid3>

      {fcmax && z2Low && (
        <NoteBox>
          <strong>Karvonen · FCmáx = {fcmax} bpm</strong><br />
          Zona 1 (50–60%): {Math.round((fcmax - fcrep) * 0.5 + fcrep)}–{Math.round((fcmax - fcrep) * 0.6 + fcrep)} bpm &nbsp;|&nbsp;
          Zona 2 (60–75%): {z2Low}–{z2High} bpm &nbsp;|&nbsp;
          Zona 3 (75–90%): {Math.round((fcmax - fcrep) * 0.75 + fcrep)}–{Math.round((fcmax - fcrep) * 0.9 + fcrep)} bpm
        </NoteBox>
      )}

      <Divider />
      <SectionLabel>Componente Cardiovascular</SectionLabel>
      <Grid2>
        <Field><Label>VO₂máx (ml/kg/min)</Label><Input type="number" value={vo2max} onChange={(e) => setVo2max(e.target.value)} placeholder="35" step="0.1" /></Field>
        <Field><Label>Push-up (repetições)</Label><Input type="number" value={pushup} onChange={(e) => setPushup(e.target.value)} placeholder="15" /></Field>
      </Grid2>

      <Divider />
      <SectionLabel>Força & Mobilidade</SectionLabel>
      <Grid3>
        <Field><Label>1RM Squat estimado (kg)</Label><Input type="number" value={rm1Squat} onChange={(e) => setRm1Squat(e.target.value)} placeholder="60" /></Field>
        <Field><Label>1RM Bench estimado (kg)</Label><Input type="number" value={rm1Bench} onChange={(e) => setRm1Bench(e.target.value)} placeholder="50" /></Field>
        <Field><Label>Sit-and-reach (cm)</Label><Input type="number" value={sarVal} onChange={(e) => setSarVal(e.target.value)} placeholder="25" /></Field>
        <Field><Label>Mobilidade ombro (1–3)</Label>
          <Select value={mobOmbro} onChange={(e) => setMobOmbro(e.target.value)}>
            <option value="1">1 — Limitada</option>
            <option value="2">2 — Moderada</option>
            <option value="3">3 — Boa</option>
          </Select>
        </Field>
        <Field><Label>Mobilidade coxo-femoral (1–3)</Label>
          <Select value={mobCF} onChange={(e) => setMobCF(e.target.value)}>
            <option value="1">1 — Limitada</option>
            <option value="2">2 — Moderada</option>
            <option value="3">3 — Boa</option>
          </Select>
        </Field>
      </Grid3>

      <BtnRow>
        <BtnSecondary onClick={() => dispatch(prevStep())}>← Voltar</BtnSecondary>
        <BtnPrimary onClick={handleNext}>Continuar →</BtnPrimary>
      </BtnRow>
    </div>
  );
};
