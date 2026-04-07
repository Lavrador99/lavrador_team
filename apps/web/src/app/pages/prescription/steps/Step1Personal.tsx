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
  Chip,
  ChipGroup,
  Divider,
  ErrorMsg,
  Field,
  FlagBox,
  FlagText,
  FlagTitle,
  Grid2,
  Input,
  Label,
  SectionLabel,
  SectionTitle,
  Select,
  StepLabel,
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
  colesterol_alto: "Hipercolesterolemia",
  stress_alto: "Stress elevado",
};

export const Step1Personal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData } = useSelector((s: RootState) => s.prescription);

  const [nome, setNome] = useState(formData.nome ?? "");
  const [idade, setIdade] = useState(formData.idade?.toString() ?? "");
  const [sexo, setSexo] = useState(formData.sexo ?? "M");
  const [profissao, setProfissao] = useState(
    formData.profissao ?? "sedentario",
  );
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
    setList(
      list.includes(val) ? list.filter((x) => x !== val) : [...list, val],
    );
  };

  const flags = buildFlags(parseFloat(pas), parseFloat(pad), sintomas, riscos);

  const handleNext = () => {
    if (!nome || !idade) {
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
      <StepLabel>Passo 01 / 06</StepLabel>
      <SectionTitle>Dados Pessoais & Flags Clínicos</SectionTitle>

      <Grid2>
        <Field>
          <Label>Nome</Label>
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
        <Field>
          <Label>Sexo</Label>
          <Select
            value={sexo}
            onChange={(e) => setSexo(e.target.value as "M" | "F")}
          >
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
          </Select>
        </Field>
        <Field>
          <Label>Estilo de vida</Label>
          <Select
            value={profissao}
            onChange={(e) => setProfissao(e.target.value)}
          >
            <option value="sedentario">Sedentário (escritório)</option>
            <option value="ativo">Moderadamente ativo</option>
            <option value="muito_ativo">Muito ativo / físico</option>
          </Select>
        </Field>
      </Grid2>

      <Divider />
      <SectionLabel>Pressão Arterial</SectionLabel>

      <Grid2>
        <Field>
          <Label>PAS (mmHg)</Label>
          <Input
            type="number"
            value={pas}
            onChange={(e) => {
              setPas(e.target.value);
            }}
            placeholder="120"
          />
        </Field>
        <Field>
          <Label>PAD (mmHg)</Label>
          <Input
            type="number"
            value={pad}
            onChange={(e) => {
              setPad(e.target.value);
            }}
            placeholder="78"
          />
        </Field>
      </Grid2>

      <Divider />
      <SectionLabel>Sintomas / Patologias</SectionLabel>
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

      <SectionLabel>Fatores de risco adicionais</SectionLabel>
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

      {flags.length > 0 && (
        <FlagBox>
          <div style={{ fontSize: 20 }}>⚠️</div>
          <div>
            <FlagTitle>AUTORIZAÇÃO MÉDICA RECOMENDADA</FlagTitle>
            <FlagText>
              Fatores: <strong>{flags.join(", ")}</strong>. Recomenda-se
              avaliação médica prévia.
            </FlagText>
          </div>
        </FlagBox>
      )}

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
  const clinicSintomas = [
    "palpitacoes",
    "dor_peito",
    "dispneia",
    "diabetes",
    "drc",
  ];
  if (sintomas.some((s) => clinicSintomas.includes(s)))
    flags.push("sintomas clínicos");
  if (pas >= 140 || pad >= 90)
    flags.push(`hipertensão arterial (${pas}/${pad} mmHg)`);
  if (riscos.includes("fumador")) flags.push("tabagismo");
  if (sintomas.includes("hist_familiar")) flags.push("história familiar DCV");
  return flags;
}
