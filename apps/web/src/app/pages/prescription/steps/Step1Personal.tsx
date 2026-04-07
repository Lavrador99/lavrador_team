import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store";
import {
  nextStep,
  updateFormData,
} from "../../../store/slices/prescriptionSlice";
import {
  BtnPrimary,
  BtnRow,
  CardSection,
  CardSectionTitle,
  Chip,
  ChipGroup,
  ErrorMsg,
  Field,
  FlagBox,
  FlagText,
  FlagTitle,
  Grid2,
  Input,
  Label,
  OptionCard,
  OptionGrid,
  OptionIcon,
  OptionLabel,
  OptionSub,
  SectionDescription,
  SectionTitle,
} from "../Prescription.styles";

const SINTOMAS = [
  "palpitacoes",
  "dor_peito",
  "dispneia",
  "diabetes",
  "drc",
  "hist_familiar",
];
const SINTOMA_LABELS: Record<string, string> = {
  palpitacoes: "Palpitações",
  dor_peito: "Dor no peito",
  dispneia: "Dispneia",
  diabetes: "Diabetes",
  drc: "Doença Renal",
  hist_familiar: "Hist. familiar DCV",
};
const RISCOS = ["fumador", "colesterol_alto", "stress_alto"];
const RISCO_LABELS: Record<string, string> = {
  fumador: "Fumador",
  colesterol_alto: "Colesterol alto",
  stress_alto: "Stress elevado",
};

const LIFESTYLE_OPTIONS = [
  { value: "sedentario", icon: "💻", label: "Sedentário", sub: "Trabalho de escritório" },
  { value: "ativo", icon: "🚶", label: "Ativo", sub: "Moderadamente ativo" },
  { value: "muito_ativo", icon: "🏃", label: "Muito ativo", sub: "Trabalho físico" },
];

export const Step1Personal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData } = useSelector((s: RootState) => s.prescription);

  const [nome, setNome] = useState(formData.nome ?? "");
  const [idade, setIdade] = useState(formData.idade?.toString() ?? "");
  const [sexo, setSexo] = useState(formData.sexo ?? "M");
  const [profissao, setProfissao] = useState(formData.profissao ?? "sedentario");
  const [pas, setPas] = useState(formData.pas?.toString() ?? "");
  const [pad, setPad] = useState(formData.pad?.toString() ?? "");
  const [sintomas, setSintomas] = useState<string[]>(formData.sintomas ?? []);
  const [riscos, setRiscos] = useState<string[]>(formData.riscos ?? []);
  const [error, setError] = useState("");

  const toggleChip = (
    val: string,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const flags = buildFlags(parseFloat(pas), parseFloat(pad), sintomas, riscos);

  const handleNext = () => {
    if (!nome.trim() || !idade) {
      setError("Nome e idade são obrigatórios.");
      return;
    }
    dispatch(
      updateFormData({
        nome,
        idade: parseFloat(idade),
        sexo: sexo as "M" | "F",
        profissao,
        pas: pas ? parseFloat(pas) : undefined,
        pad: pad ? parseFloat(pad) : undefined,
        sintomas,
        riscos,
      }),
    );
    dispatch(nextStep());
  };

  return (
    <div>
      <SectionTitle>Dados Pessoais</SectionTitle>
      <SectionDescription>
        Informação básica sobre o cliente para contextualizar a prescrição.
      </SectionDescription>

      {/* ── Identificação ─────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Identificação</CardSectionTitle>
        <Grid2>
          <Field>
            <Label>Nome completo</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Sara Costa"
            />
          </Field>
          <Field>
            <Label>Idade</Label>
            <Input
              type="number"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              placeholder="29"
              min="14"
              max="90"
            />
          </Field>
        </Grid2>

        <Field style={{ marginTop: 16 }}>
          <Label>Género</Label>
          <OptionGrid $cols={2}>
            <OptionCard $selected={sexo === "M"} onClick={() => setSexo("M")}>
              <OptionIcon>♂</OptionIcon>
              <OptionLabel $selected={sexo === "M"}>Masculino</OptionLabel>
            </OptionCard>
            <OptionCard $selected={sexo === "F"} onClick={() => setSexo("F")}>
              <OptionIcon>♀</OptionIcon>
              <OptionLabel $selected={sexo === "F"}>Feminino</OptionLabel>
            </OptionCard>
          </OptionGrid>
        </Field>
      </CardSection>

      {/* ── Estilo de vida ────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Estilo de vida</CardSectionTitle>
        <OptionGrid $cols={3}>
          {LIFESTYLE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              $selected={profissao === opt.value}
              onClick={() => setProfissao(opt.value)}
            >
              <OptionIcon>{opt.icon}</OptionIcon>
              <OptionLabel $selected={profissao === opt.value}>
                {opt.label}
              </OptionLabel>
              <OptionSub>{opt.sub}</OptionSub>
            </OptionCard>
          ))}
        </OptionGrid>
      </CardSection>

      {/* ── Pressão arterial ─────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Pressão arterial (opcional)</CardSectionTitle>
        <Grid2>
          <Field>
            <Label>PAS (mmHg)</Label>
            <Input
              type="number"
              value={pas}
              onChange={(e) => setPas(e.target.value)}
              placeholder="120"
            />
          </Field>
          <Field>
            <Label>PAD (mmHg)</Label>
            <Input
              type="number"
              value={pad}
              onChange={(e) => setPad(e.target.value)}
              placeholder="78"
            />
          </Field>
        </Grid2>
      </CardSection>

      {/* ── Flags clínicas ────────────────────────────────────── */}
      <CardSection>
        <CardSectionTitle>Sintomas / Patologias</CardSectionTitle>
        <ChipGroup>
          {SINTOMAS.map((s) => (
            <Chip
              key={s}
              $selected={sintomas.includes(s)}
              $warn
              onClick={() => toggleChip(s, sintomas, setSintomas)}
            >
              {SINTOMA_LABELS[s]}
            </Chip>
          ))}
        </ChipGroup>

        <div style={{ marginTop: 20 }}>
          <CardSectionTitle>Fatores de risco</CardSectionTitle>
          <ChipGroup>
            {RISCOS.map((r) => (
              <Chip
                key={r}
                $selected={riscos.includes(r)}
                $warn
                onClick={() => toggleChip(r, riscos, setRiscos)}
              >
                {RISCO_LABELS[r]}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        {flags.length > 0 && (
          <FlagBox>
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div>
              <FlagTitle>AUTORIZAÇÃO MÉDICA RECOMENDADA</FlagTitle>
              <FlagText>
                Fatores: <strong>{flags.join(", ")}</strong>. Recomenda-se
                avaliação médica prévia ao início do programa.
              </FlagText>
            </div>
          </FlagBox>
        )}
      </CardSection>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <BtnRow>
        <BtnPrimary onClick={handleNext}>Continuar →</BtnPrimary>
      </BtnRow>
    </div>
  );
};

function buildFlags(
  pas: number,
  pad: number,
  sintomas: string[],
  riscos: string[],
): string[] {
  const flags: string[] = [];
  const clinicSintomas = ["palpitacoes", "dor_peito", "dispneia", "diabetes", "drc"];
  if (sintomas.some((s) => clinicSintomas.includes(s)))
    flags.push("sintomas clínicos");
  if (pas >= 140 || pad >= 90)
    flags.push(`hipertensão arterial (${pas}/${pad} mmHg)`);
  if (riscos.includes("fumador")) flags.push("tabagismo");
  if (sintomas.includes("hist_familiar")) flags.push("história familiar DCV");
  return flags;
}
