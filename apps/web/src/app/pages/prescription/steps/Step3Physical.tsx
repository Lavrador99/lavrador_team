import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { updateFormData, nextStep, prevStep } from '../../../store/slices/prescriptionSlice';
import {
  SectionTitle, SectionDescription, CardSection, CardSectionTitle,
  Grid2, Grid3, Field, Label, Input,
  BtnRow, BtnPrimary, BtnSecondary, NoteBox,
  OptionGrid, OptionCard, OptionLabel,
} from '../Prescription.styles';

const MOB_OPTIONS = [
  { value: '1', label: 'Limitada' },
  { value: '2', label: 'Moderada' },
  { value: '3', label: 'Boa' },
];

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

  const imc =
    altura && peso
      ? (parseFloat(peso) / Math.pow(parseFloat(altura) / 100, 2)).toFixed(1)
      : '';

  const fcmax = formData.idade ? Math.round(207 - 0.7 * formData.idade) : null;
  const fcrep = parseFloat(fcRep) || 70;
  const z2Low = fcmax ? Math.round((fcmax - fcrep) * 0.6 + fcrep) : null;
  const z2High = fcmax ? Math.round((fcmax - fcrep) * 0.75 + fcrep) : null;

  const handleNext = () => {
    dispatch(
      updateFormData({
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
      }),
    );
    dispatch(nextStep());
  };

  return (
    <div>
      <SectionTitle>Avaliação Física</SectionTitle>
      <SectionDescription>
        Dados antropométricos e de aptidão. Todos os campos são opcionais — preenche o que tiveres disponível.
      </SectionDescription>

      {/* ── Antropometria ─────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Antropometria</CardSectionTitle>
        <Grid3>
          <Field>
            <Label>Altura (cm)</Label>
            <Input
              type="number"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="170"
            />
          </Field>
          <Field>
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="75"
            />
          </Field>
          <Field>
            <Label>IMC calculado</Label>
            <Input readOnly value={imc ? `${imc} kg/m²` : '—'} />
          </Field>
          <Field>
            <Label>% Gordura</Label>
            <Input
              type="number"
              value={pctGordura}
              onChange={(e) => setPctGordura(e.target.value)}
              placeholder="25"
              step="0.1"
            />
          </Field>
          <Field>
            <Label>Circ. Cintura (cm)</Label>
            <Input
              type="number"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="85"
            />
          </Field>
          <Field>
            <Label>FC Repouso (bpm)</Label>
            <Input
              type="number"
              value={fcRep}
              onChange={(e) => setFcRep(e.target.value)}
              placeholder="70"
            />
          </Field>
        </Grid3>

        {fcmax && z2Low && (
          <NoteBox style={{ marginTop: 16, marginBottom: 0 }}>
            <strong>Karvonen · FCmáx = {fcmax} bpm</strong>
            <br />
            Zona 1 (50–60%): {Math.round((fcmax - fcrep) * 0.5 + fcrep)}–
            {Math.round((fcmax - fcrep) * 0.6 + fcrep)} bpm &nbsp;·&nbsp;
            Zona 2 (60–75%): {z2Low}–{z2High} bpm &nbsp;·&nbsp;
            Zona 3 (75–90%): {Math.round((fcmax - fcrep) * 0.75 + fcrep)}–
            {Math.round((fcmax - fcrep) * 0.9 + fcrep)} bpm
          </NoteBox>
        )}
      </CardSection>

      {/* ── Cardio ────────────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Aptidão cardiovascular</CardSectionTitle>
        <Grid2>
          <Field>
            <Label>VO₂máx (ml/kg/min)</Label>
            <Input
              type="number"
              value={vo2max}
              onChange={(e) => setVo2max(e.target.value)}
              placeholder="35"
              step="0.1"
            />
          </Field>
          <Field>
            <Label>Push-up (reps máx.)</Label>
            <Input
              type="number"
              value={pushup}
              onChange={(e) => setPushup(e.target.value)}
              placeholder="15"
            />
          </Field>
        </Grid2>
      </CardSection>

      {/* ── Força ─────────────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Força</CardSectionTitle>
        <Grid3>
          <Field>
            <Label>1RM Squat estimado (kg)</Label>
            <Input
              type="number"
              value={rm1Squat}
              onChange={(e) => setRm1Squat(e.target.value)}
              placeholder="60"
            />
          </Field>
          <Field>
            <Label>1RM Bench estimado (kg)</Label>
            <Input
              type="number"
              value={rm1Bench}
              onChange={(e) => setRm1Bench(e.target.value)}
              placeholder="50"
            />
          </Field>
          <Field>
            <Label>Sit-and-reach (cm)</Label>
            <Input
              type="number"
              value={sarVal}
              onChange={(e) => setSarVal(e.target.value)}
              placeholder="25"
            />
          </Field>
        </Grid3>
      </CardSection>

      {/* ── Mobilidade ────────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Mobilidade articular</CardSectionTitle>
        <Grid2>
          <Field>
            <Label>Ombro</Label>
            <OptionGrid $cols={3}>
              {MOB_OPTIONS.map((o) => (
                <OptionCard
                  key={o.value}
                  $selected={mobOmbro === o.value}
                  onClick={() => setMobOmbro(o.value)}
                >
                  <OptionLabel $selected={mobOmbro === o.value}>
                    {o.label}
                  </OptionLabel>
                </OptionCard>
              ))}
            </OptionGrid>
          </Field>
          <Field>
            <Label>Coxo-femoral</Label>
            <OptionGrid $cols={3}>
              {MOB_OPTIONS.map((o) => (
                <OptionCard
                  key={o.value}
                  $selected={mobCF === o.value}
                  onClick={() => setMobCF(o.value)}
                >
                  <OptionLabel $selected={mobCF === o.value}>
                    {o.label}
                  </OptionLabel>
                </OptionCard>
              ))}
            </OptionGrid>
          </Field>
        </Grid2>
      </CardSection>

      <BtnRow>
        <BtnSecondary onClick={() => dispatch(prevStep())}>← Voltar</BtnSecondary>
        <BtnPrimary onClick={handleNext}>Continuar →</BtnPrimary>
      </BtnRow>
    </div>
  );
};
