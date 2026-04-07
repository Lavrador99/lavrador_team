import { MovementPattern, TrainingLevel } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EngineExercise {
  id: string;
  name: string;
  pattern: MovementPattern;
  clinicalNotes: string[];
}

export interface SelectedExercise {
  exerciseId: string;
  pattern: MovementPattern;
  type: "PREFERRED" | "REQUIRED";
  name?: string;
}

export interface AssessmentEngineInput {
  level: TrainingLevel;
  data: {
    idade: number;
    sexo: "M" | "F";
    diasSemana: number;
    duracaoSessao: number;
    objetivo: string;
    fcRep?: number;
    vo2max?: number;
    rm1Squat?: number;
    rm1Bench?: number;
    lesoes?: string[];
    _computed?: {
      fcmax: number;
      karvonenZones: {
        z1: { low: number; high: number; label: string };
        z2: { low: number; high: number; label: string };
        z3: { low: number; high: number; label: string };
      };
    };
  };
  selectedExercises: SelectedExercise[];
}

// ─── Main generator ──────────────────────────────────────────────────────────

export function generatePrescriptionPlan(input: AssessmentEngineInput) {
  const { level, data, selectedExercises } = input;
  const { diasSemana, duracaoSessao, objetivo, fcRep = 70 } = data;

  const fcmax = data._computed?.fcmax ?? Math.round(207 - 0.7 * data.idade);
  const zones = data._computed?.karvonenZones ?? buildZones(fcmax, fcRep);

  const z1 = `${zones.z1.low}–${zones.z1.high} bpm`;
  const z2 = `${zones.z2.low}–${zones.z2.high} bpm`;
  const z3 = `${zones.z3.low}–${zones.z3.high} bpm`;

  const rm1Squat = data.rm1Squat;
  const rm1Bench = data.rm1Bench;
  const dias = `${diasSemana}x/sem`;

  const preferredByPattern = groupByPattern(
    selectedExercises.filter((e) => e.type === "PREFERRED"),
  );
  const requiredByPattern = groupByPattern(
    selectedExercises.filter((e) => e.type === "REQUIRED"),
  );

  const exerciseBlock = buildExerciseBlock(
    preferredByPattern,
    requiredByPattern,
  );

  if (level === TrainingLevel.INICIANTE) {
    return buildIniciantePhases({
      dias,
      duracaoSessao,
      objetivo,
      z1,
      z2,
      z3,
      rm1Squat,
      rm1Bench,
      exerciseBlock,
    });
  }
  if (level === TrainingLevel.INTERMEDIO) {
    return buildIntermedioPhases({
      dias,
      duracaoSessao,
      objetivo,
      z1,
      z2,
      z3,
      rm1Squat,
      rm1Bench,
      exerciseBlock,
    });
  }
  return buildAvancadoPhases({
    dias,
    objetivo,
    z1,
    z2,
    z3,
    rm1Squat,
    rm1Bench,
    exerciseBlock,
    duracaoSessao,
  });
}

// ─── Exercise block builder (80/20) ──────────────────────────────────────────

function buildExerciseBlock(
  preferred: Record<string, SelectedExercise[]>,
  required: Record<string, SelectedExercise[]>,
): string {
  const patterns = Object.keys({
    ...preferred,
    ...required,
  }) as MovementPattern[];
  if (!patterns.length) return "Exercícios a definir com o cliente";

  const lines = patterns.map((p) => {
    const pref = (preferred[p] ?? [])
      .map((e) => e.name ?? e.exerciseId)
      .join(", ");
    const req = (required[p] ?? [])
      .map((e) => e.name ?? e.exerciseId)
      .join(", ");
    const label = PATTERN_LABELS[p] ?? p;
    const parts = [];
    if (pref) parts.push(`✓ ${pref}`);
    if (req) parts.push(`★ ${req}`);
    return `${label}: ${parts.join(" | ")}`;
  });

  return lines.join("\n");
}

function groupByPattern(
  list: SelectedExercise[],
): Record<string, SelectedExercise[]> {
  return list.reduce(
    (acc, e) => {
      if (!acc[e.pattern]) acc[e.pattern] = [];
      acc[e.pattern].push(e);
      return acc;
    },
    {} as Record<string, SelectedExercise[]>,
  );
}

// ─── Phase builders ───────────────────────────────────────────────────────────

function buildIniciantePhases(ctx: PhaseCtx) {
  return [
    {
      name: "FASE 1 — Adaptação Anatómica",
      sub: `Semanas 1–4 · ${ctx.dias} · ${ctx.duracaoSessao} min`,
      weeks: 4,
      description:
        "Preparar o sistema neuromuscular, articular e cardiovascular. Foco em qualidade técnica e adesão.",
      method: ["Full Body", "Máquinas + Pesos Livres leves"],
      cardio: buildCardio(
        `${Math.min(3, parseInt(ctx.dias))}x/sem`,
        `Ligeira · Zona 1 (${ctx.z1})`,
        "20–30 min",
        "Contínuo Extensivo",
        "60–90 min/sem",
        "Aumentar 5 min/sessão a cada 2 semanas",
      ),
      forca: buildForca(
        ctx.dias,
        "50–60% 1RM",
        "2–3 × 12–15 reps",
        "≤ 30 seg",
        "Lenta (2:0:2:1)",
        formatExercises(
          ctx.exerciseBlock,
          "8–10 exercícios · 80% preferidos · 20% corretivos",
        ),
        "Aumentar 1 série na semana 3",
      ),
      flex: buildFlex(
        `${ctx.dias} (final de sessão)`,
        "Estático passivo",
        "10–20 seg",
        "2 rep/grupo",
        "Grandes grupos musculares",
      ),
      weekByWeek: [
        {
          wk: 1,
          forca: "2×12 · 50% 1RM · foco técnico",
          cardio: "20 min Zona 1",
          flex: "2×10s cada grupo",
        },
        {
          wk: 2,
          forca: "2×14 · 50% 1RM · consolidar",
          cardio: "25 min Zona 1",
          flex: "2×15s cada grupo",
        },
        {
          wk: 3,
          forca: "3×12 · 55% 1RM",
          cardio: "25 min Zona 1–2",
          flex: "2×20s cada grupo",
        },
        {
          wk: 4,
          forca: "3×12 · 55% · deload",
          cardio: "20 min Zona 1 (deload)",
          flex: "2×20s · reavaliação",
        },
      ],
    },
    {
      name: "FASE 2 — Resistência & Base Aeróbia",
      sub: `Semanas 5–12 · ${ctx.dias} · ${ctx.duracaoSessao} min`,
      weeks: 8,
      description:
        "2 ciclos de 4 semanas. Consolidar base de resistência muscular e aeróbia com progressão gradual.",
      method: ["Full Body", "Upper/Lower split (semanas 9–12)"],
      cardio: buildCardio(
        `${Math.min(3, parseInt(ctx.dias))}x/sem`,
        `Moderada · Zona 2 (${ctx.z2})`,
        "30–45 min",
        "Contínuo Extensivo → Fartlek (sem. 9–12)",
        "90–150 min/sem",
        "Aumentar 5 min/sem até 45 min",
      ),
      forca: buildForca(
        ctx.dias,
        "55–65% 1RM",
        "3 × 12–15 → 3×10–12",
        "30–60 seg",
        "Moderada (2:1:2:0)",
        formatExercises(
          ctx.exerciseBlock,
          "Progressão nos exercícios selecionados · 80/20 mantido",
        ),
        "Aumentar 2.5–5kg quando completar todas as reps",
      ),
      flex: buildFlex(
        "Mínimo 3x/sem",
        "Estático + Mobilidade dinâmica",
        "20–30 seg",
        "2–3 rep/grupo",
        "Mobilidade coxo-femoral e torácica",
      ),
      weekByWeek: [
        {
          wk: "5–6",
          forca: "3×12–15 · 55% 1RM",
          cardio: "30 min Zona 2",
          flex: "3×20s + mobilidade",
        },
        {
          wk: "7–8",
          forca: "3×12 · 60% 1RM",
          cardio: "35 min Zona 2",
          flex: "3×25s",
        },
        {
          wk: 9,
          forca: "2×12 · 55% (deload)",
          cardio: "25 min Zona 1",
          flex: "Mobilidade",
        },
        {
          wk: "10–11",
          forca: "3×10–12 · 65% · Upper/Lower",
          cardio: "40 min Zona 2 / Fartlek",
          flex: "3×30s",
        },
        {
          wk: 12,
          forca: "Reavaliação 1RM / push-up",
          cardio: "Reavaliação VO₂",
          flex: "Sit-and-reach",
        },
      ],
    },
    {
      name: "FASE 3 — Progressão ao Método Principal",
      sub: `Semanas 13+ · ${ctx.dias}`,
      weeks: 0,
      description: buildPhase3Desc(ctx.objetivo, ctx.rm1Squat, ctx.rm1Bench),
      method: buildPhase3Methods(ctx.objetivo, parseInt(ctx.dias)),
      cardio: buildCardio(
        "2–3x/sem",
        `Moderada-Vigorosa · Z2–Z3 (${ctx.z2} / ${ctx.z3})`,
        "30–45 min",
        ctx.objetivo === "Força Máxima"
          ? "LISS recuperativo"
          : "Intervalado + Contínuo",
        ctx.objetivo === "Força Máxima" ? "75 min/sem" : "150 min/sem",
        "Conforme tolerância",
      ),
      forca: buildForca(
        ctx.dias,
        buildPhase3Intensity(ctx.objetivo),
        buildPhase3Series(ctx.objetivo),
        buildPhase3Rest(ctx.objetivo),
        "Progressiva",
        formatExercises(
          ctx.exerciseBlock,
          buildPhase3ExerciseNote(ctx.objetivo, ctx.rm1Squat, ctx.rm1Bench),
        ),
        buildPhase3Progression(ctx.objetivo),
      ),
      flex: buildFlex(
        "3–4x/sem",
        "PNF + Estático + Mobilidade",
        "20–30s · PNF: 6s + 20s",
        "2–4 rep/grupo",
        "Mobilidade funcional para os padrões de movimento usados",
      ),
      weekByWeek: buildPhase3Weeks(ctx.objetivo, ctx.rm1Squat, ctx.rm1Bench),
    },
  ];
}

function buildIntermedioPhases(ctx: PhaseCtx) {
  return [
    {
      name: "FASE 1 — Reavaliação & Consolidação",
      sub: `Semanas 1–4 · ${ctx.dias} · ${ctx.duracaoSessao} min`,
      weeks: 4,
      description:
        "Identificar desequilíbrios, corrigir técnica, estabelecer nova baseline.",
      method: ["Upper/Lower ou Full Body", "Avaliação técnica dos compostos"],
      cardio: buildCardio(
        "2–3x/sem",
        `Zona 2 (${ctx.z2})`,
        "30 min",
        "Contínuo + reavaliação VO₂",
        "90 min/sem",
        "Manter volume, ajustar após avaliação",
      ),
      forca: buildForca(
        ctx.dias,
        "65–70% 1RM · Técnica",
        "3×8–10",
        "90 seg",
        "Controlada (3:1:2:0)",
        formatExercises(
          ctx.exerciseBlock,
          "Foco em técnica nos exercícios selecionados",
        ),
        "Foco em técnica, não em carga",
      ),
      flex: buildFlex(
        "3–4x/sem",
        "Estático + PNF",
        "20–30s",
        "2–3 rep/grupo",
        "Mobilidade articular específica",
      ),
      weekByWeek: [
        {
          wk: 1,
          forca: "3×10 · 65% · avaliação técnica",
          cardio: "30 min Zona 2",
          flex: "PNF ancas + ombros",
        },
        {
          wk: 2,
          forca: "3×10 · 67.5%",
          cardio: "30 min",
          flex: "Estático + mobilidade torácica",
        },
        {
          wk: 3,
          forca: "3×8 · 70%",
          cardio: "35 min",
          flex: "PNF isquiotibiais",
        },
        {
          wk: 4,
          forca: "2×8 · 65% (deload)",
          cardio: "25 min (deload)",
          flex: "Mobilidade + reavaliação",
        },
      ],
    },
    {
      name: "FASE 2 — Método Principal",
      sub: `Semanas 5–16 · ${ctx.dias}`,
      weeks: 12,
      description:
        "3 ciclos de 4 semanas com progressão de volume e intensidade.",
      method: buildPhase3Methods(ctx.objetivo, parseInt(ctx.dias)),
      cardio: buildCardio(
        "2–3x/sem",
        `Zona 2–3 (${ctx.z2}/${ctx.z3})`,
        "30–45 min",
        "Fartlek + HIIT (1:1)",
        "120–150 min/sem",
        "Aumentar intensidade a cada ciclo",
      ),
      forca: buildForca(
        ctx.dias,
        buildPhase3Intensity(ctx.objetivo),
        buildPhase3Series(ctx.objetivo),
        buildPhase3Rest(ctx.objetivo),
        "Progressiva",
        formatExercises(
          ctx.exerciseBlock,
          buildPhase3ExerciseNote(ctx.objetivo, ctx.rm1Squat, ctx.rm1Bench),
        ),
        buildPhase3Progression(ctx.objetivo),
      ),
      flex: buildFlex(
        "4x/sem",
        "PNF + Mobilidade dinâmica pré-treino",
        "6s contração + 20–30s",
        "3 rep/grupo",
        "Mobilidade funcional para os padrões de treino",
      ),
      weekByWeek: buildPhase3Weeks(ctx.objetivo, ctx.rm1Squat, ctx.rm1Bench),
    },
  ];
}

function buildAvancadoPhases(ctx: PhaseCtx) {
  const tm_s = ctx.rm1Squat ? Math.round(ctx.rm1Squat * 0.9) : "?";
  const tm_b = ctx.rm1Bench ? Math.round(ctx.rm1Bench * 0.9) : "?";

  return [
    {
      name: "FASE 1 — Deload & Análise",
      sub: `Semanas 1–2 · ${ctx.dias}`,
      weeks: 2,
      description:
        "Deload estratégico e reavaliação de 1RM. Definição de novos Training Max.",
      method: ["Deload ativo", "Técnica e mobilidade"],
      cardio: buildCardio(
        "2x/sem",
        `Zona 1 (${ctx.z1})`,
        "20–30 min",
        "LISS regenerativo",
        "40–60 min/sem",
        "N/A — período de recuperação",
      ),
      forca: buildForca(
        `${Math.min(4, parseInt(ctx.dias))}x/sem`,
        "50–60% 1RM",
        "2–3×5–8",
        "2 min",
        "Controlada · foco técnico",
        formatExercises(
          ctx.exerciseBlock,
          "Movimentos principais: Squat, Bench, DL, OHP",
        ),
        "Reavaliação de 1RM na semana 2",
      ),
      flex: buildFlex(
        "Diário",
        "PNF + mobilidade articular completa",
        "30s+",
        "3–4 rep/grupo",
        "Full body — preparação para fase pesada",
      ),
      weekByWeek: [
        {
          wk: 1,
          forca: "Deload · 50% 1RM · técnica",
          cardio: "20 min Zona 1",
          flex: "Full body PNF",
        },
        {
          wk: 2,
          forca: "Reavaliação 1RM estimado",
          cardio: "VO₂ reavaliação",
          flex: "Mobilidade + avaliação",
        },
      ],
    },
    {
      name: "FASE 2 — 5/3/1 (Wendler)",
      sub: `Semanas 3–14 · ${ctx.dias}`,
      weeks: 12,
      description: `3 ciclos de 4 semanas. Training Max = 90% do 1RM. Squat TM: ${tm_s}kg · Bench TM: ${tm_b}kg`,
      method: buildPhase3Methods(ctx.objetivo, parseInt(ctx.dias)),
      cardio: buildCardio(
        "2–3x/sem",
        `Zona 2–3 (${ctx.z2}/${ctx.z3})`,
        "20–40 min",
        "LISS + HIIT alternado",
        "75–120 min/sem",
        "Manter base aeróbia sem comprometer recuperação",
      ),
      forca: buildForca(
        ctx.dias,
        `S1: 65/75/85% TM · S2: 70/80/90% · S3: 75/85/95%`,
        "S1: 5×5 · S2: 3×3 · S3: 5/3/1+ AMRAP",
        "3–5 min (compostos pesados)",
        "Explosiva (excêntrica controlada)",
        formatExercises(
          ctx.exerciseBlock,
          `Squat TM=${tm_s}kg · Bench TM=${tm_b}kg · DL · OHP + acessórios 3×8–12`,
        ),
        `+2.5kg (upper) / +5kg (lower) ao TM após cada ciclo`,
      ),
      flex: buildFlex(
        "4–5x/sem",
        "PNF + Mobilidade dinâmica pré + estático pós",
        "Pré: dinâmica 5–10 min · Pós: 20–30s",
        "3–4 rep/grupo",
        "Específico para os movimentos do dia",
      ),
      weekByWeek: [
        {
          wk: "C1 S1",
          forca: `5×5 · 65% TM (Squat: ${ctx.rm1Squat ? Math.round(ctx.rm1Squat * 0.9 * 0.65) : "?"}kg)`,
          cardio: "LISS 20 min",
          flex: "Mobilidade pré + estático pós",
        },
        {
          wk: "C1 S2",
          forca: `3×3 · 80% TM`,
          cardio: "LISS 25 min",
          flex: "PNF ancas",
        },
        {
          wk: "C1 S3",
          forca: `5/3/1+ · 85–95% TM`,
          cardio: "LISS 20 min",
          flex: "Estático pós-treino",
        },
        {
          wk: "C1 S4",
          forca: "Deload · 40–50% TM",
          cardio: "30 min Zona 1",
          flex: "Full body",
        },
        {
          wk: "C2 S1",
          forca: `+2.5/5kg ao TM — repetir estrutura`,
          cardio: "LISS 20 min",
          flex: "Mobilidade específica",
        },
      ],
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface PhaseCtx {
  dias: string;
  duracaoSessao: number;
  objetivo: string;
  z1: string;
  z2: string;
  z3: string;
  rm1Squat?: number;
  rm1Bench?: number;
  exerciseBlock: string;
}

function buildCardio(
  freq: string,
  intensidade: string,
  tempo: string,
  tipo: string,
  volume: string,
  progressao: string,
) {
  return { freq, intensidade, tempo, tipo, volume, progressao };
}

function buildForca(
  freq: string,
  intensidade: string,
  series: string,
  intervalo: string,
  velocidade: string,
  exercicios: string,
  progressao: string,
) {
  return {
    freq,
    intensidade,
    series,
    intervalo,
    velocidade,
    exercicios,
    progressao,
  };
}

function buildFlex(
  freq: string,
  tipo: string,
  tempo: string,
  volume: string,
  foco: string,
) {
  return { freq, tipo, tempo, volume, foco };
}

function formatExercises(block: string, note: string): string {
  return `${block}\n---\n${note}`;
}

function buildZones(fcmax: number, fcrep: number) {
  const k = (pct: number) => Math.round((fcmax - fcrep) * pct + fcrep);
  return {
    z1: { low: k(0.5), high: k(0.6), label: "50–60%" },
    z2: { low: k(0.6), high: k(0.75), label: "60–75%" },
    z3: { low: k(0.75), high: k(0.9), label: "75–90%" },
  };
}

function buildPhase3Desc(
  objetivo: string,
  rm1Squat?: number,
  rm1Bench?: number,
): string {
  if (objetivo === "Força Máxima")
    return `Progressão de força estruturada. 5/3/1. ${rm1Squat ? `Squat TM: ${Math.round(rm1Squat * 0.9)}kg` : ""} ${rm1Bench ? `Bench TM: ${Math.round(rm1Bench * 0.9)}kg` : ""}`;
  if (objetivo === "Hipertrofia")
    return "Programa de hipertrofia estruturado. 10–20 séries/grupo muscular/semana.";
  if (objetivo === "Emagrecimento")
    return "Combinação força + cardio para défice calórico. Zona 2–3.";
  return "Programa misto de saúde e condicionamento com progressão sustentável.";
}

function buildPhase3Methods(objetivo: string, dias: number): string[] {
  if (objetivo === "Força Máxima")
    return dias >= 4
      ? ["5/3/1 (Wendler) — 4 dias", "Squat / Bench / DL / OHP"]
      : ["5/3/1 (Wendler) — 3 dias"];
  if (objetivo === "Hipertrofia")
    return dias >= 5
      ? ["Push / Pull / Legs (PPL)"]
      : dias >= 4
        ? ["Upper / Lower — 4 dias"]
        : ["Full Body intensificado"];
  if (objetivo === "Emagrecimento")
    return ["Full Body + HIIT", "Circuito metabólico"];
  return ["Full Body", "Progressão linear"];
}

function buildPhase3Intensity(objetivo: string): string {
  if (objetivo === "Força Máxima")
    return "Semana 1: 65/75/85% TM · S2: 70/80/90% · S3: 75/85/95% · S4: Deload";
  if (objetivo === "Hipertrofia") return "65–80% 1RM";
  return "60–75% 1RM";
}

function buildPhase3Series(objetivo: string): string {
  if (objetivo === "Força Máxima") return "5×5 / 3×3 / 5/3/1+";
  if (objetivo === "Hipertrofia") return "3–6 × 6–12 reps";
  return "3 × 10–15 reps";
}

function buildPhase3Rest(objetivo: string): string {
  if (objetivo === "Força Máxima") return "3–5 min (compostos)";
  if (objetivo === "Hipertrofia") return "30s–1.5 min";
  return "30–60 seg";
}

function buildPhase3ExerciseNote(
  objetivo: string,
  rm1Squat?: number,
  rm1Bench?: number,
): string {
  if (objetivo === "Força Máxima") {
    return `Compostos principais + acessórios 3×8–12. ${rm1Squat ? `TM Squat: ${Math.round(rm1Squat * 0.9)}kg` : ""} ${rm1Bench ? `TM Bench: ${Math.round(rm1Bench * 0.9)}kg` : ""}`;
  }
  if (objetivo === "Hipertrofia")
    return "10–20 séries/grupo/semana. Progressão dupla (volume → carga).";
  return "Full Body · padrões compostos prioritários.";
}

function buildPhase3Progression(objetivo: string): string {
  if (objetivo === "Força Máxima")
    return "+2.5kg (upper) / +5kg (lower) ao TM por ciclo de 4 semanas";
  if (objetivo === "Hipertrofia")
    return "Aumentar volume (+1 série) antes de aumentar carga";
  return "Progressão linear de carga";
}

function buildPhase3Weeks(
  objetivo: string,
  rm1Squat?: number,
  rm1Bench?: number,
) {
  if (objetivo === "Força Máxima") {
    return [
      {
        wk: "C1 S1",
        forca: `5×5 · 65% TM`,
        cardio: "LISS 20 min",
        flex: "Mobilidade pré + estático pós",
      },
      {
        wk: "C1 S2",
        forca: `3×3 · 80% TM`,
        cardio: "LISS 25 min",
        flex: "PNF ancas",
      },
      {
        wk: "C1 S3",
        forca: `5/3/1+ · 85–95% TM`,
        cardio: "LISS 20 min",
        flex: "Estático pós",
      },
      {
        wk: "C1 S4",
        forca: "Deload · 40–50% TM",
        cardio: "30 min Zona 1",
        flex: "Full body",
      },
    ];
  }
  if (objetivo === "Hipertrofia") {
    return [
      {
        wk: 1,
        forca: "3×12 · 65%",
        cardio: "30 min Zona 2",
        flex: "Dinâmica + estático",
      },
      {
        wk: 2,
        forca: "4×10 · 67.5%",
        cardio: "30 min",
        flex: "PNF ombros + ancas",
      },
      { wk: 3, forca: "4×8 · 72.5%", cardio: "35 min", flex: "Estático pós" },
      {
        wk: 4,
        forca: "3×8 · 60% (deload)",
        cardio: "25 min Zona 1",
        flex: "Mobilidade completa",
      },
    ];
  }
  return [
    {
      wk: "1–2",
      forca: "3×12–15 · base",
      cardio: "30 min Zona 2",
      flex: "Estático 2–3x",
    },
    {
      wk: "3–4",
      forca: "3×10–12 · +carga",
      cardio: "35 min",
      flex: "PNF introdução",
    },
    {
      wk: "5–6",
      forca: "3×8–10",
      cardio: "40 min Zona 2–3",
      flex: "PNF + mobilidade",
    },
    {
      wk: "7–8",
      forca: "Deload + reavaliação",
      cardio: "VO₂ reavaliação",
      flex: "Sit-and-reach",
    },
  ];
}

const PATTERN_LABELS: Record<string, string> = {
  DOMINANTE_JOELHO: "Dom. Joelho",
  DOMINANTE_ANCA: "Dom. Anca",
  EMPURRAR_HORIZONTAL: "Empurrar H.",
  EMPURRAR_VERTICAL: "Empurrar V.",
  PUXAR_HORIZONTAL: "Puxar H.",
  PUXAR_VERTICAL: "Puxar V.",
  CORE: "Core",
  LOCOMOCAO: "Locomoção",
};
