/**
 * Motor de Regras ACSM 2026
 * Fonte: ACSM Position Stand — Resistance Training Prescription for Muscle
 * Function, Hypertrophy, and Physical Performance in Healthy Adults (2026)
 *
 * Estas são regras determinísticas — não dependem de IA externa.
 * Todos os valores são extraídos directamente das tabelas do documento.
 */

export type TrainingObjective =
  | 'FORCA'         // Força máxima
  | 'HIPERTROFIA'   // Hipertrofia muscular
  | 'RESISTENCIA'   // Resistência muscular
  | 'POTENCIA'      // Potência / explosividade
  | 'SAUDE_GERAL';  // Saúde geral / funcional

export type TrainingLevel = 'INICIANTE' | 'INTERMEDIO' | 'AVANCADO';

export interface AcsmPrescription {
  objective: TrainingObjective;
  // Séries e repetições (Tabela 6, ACSM 2026)
  sets: { min: number; max: number };
  reps: { min: number; max: number } | 'AMRAP';
  // Intensidade
  percentRM: { min: number; max: number };   // % de 1RM
  rirTarget: number;                          // Repetições em reserva (RIR)
  // Repouso (Tabela 4, ACSM 2026)
  restBetweenSetsSeconds: { min: number; max: number };
  // Volume semanal recomendado
  weeklySetsPerPattern: { min: number; optimal: number };
  // Frequência semanal
  sessionsPerWeek: { min: number; max: number };
  // Velocidade de execução
  tempo: string;   // concêntrico:pausa:excêntrico:pausa
  notes: string;
  // Overrides clínicos (optional)
  rpeMaxCap?: number;   // ex: 7 para hipertensão
}

/**
 * Tabela completa de prescrição por objectivo.
 * Baseada em: Table 4 e Table 6, ACSM Position Stand 2026
 */
export const ACSM_GUIDELINES: Record<TrainingObjective, AcsmPrescription> = {
  FORCA: {
    objective: 'FORCA',
    sets:    { min: 2, max: 6 },
    reps:    { min: 1, max: 6 },
    percentRM: { min: 80, max: 100 },   // ≥80% 1RM para força (ACSM 2026, Table 6)
    rirTarget: 2,
    restBetweenSetsSeconds: { min: 120, max: 300 },  // 2–5 min
    weeklySetsPerPattern:   { min: 4, optimal: 6 },
    sessionsPerWeek: { min: 2, max: 4 },
    tempo: '1:1:2:0',  // rápido concêntrico, controlado excêntrico
    notes: 'Força é maximizada com ≥80% 1RM, amplitude completa, e no início da sessão (ACSM 2026).',
  },

  HIPERTROFIA: {
    objective: 'HIPERTROFIA',
    sets:    { min: 3, max: 6 },
    reps:    { min: 6, max: 12 },
    percentRM: { min: 60, max: 80 },
    rirTarget: 2,  // 2–3 RIR — não é necessário treinar até à falha (ACSM 2026)
    restBetweenSetsSeconds: { min: 60, max: 120 },   // 60s–1.5 min
    weeklySetsPerPattern:   { min: 10, optimal: 16 },  // ≥10 séries/grupo/semana (ACSM 2026)
    sessionsPerWeek: { min: 2, max: 5 },
    tempo: '2:0:2:1',
    notes: 'Hipertrofia requer volume ≥10 séries/grupo/semana. Contrações excêntricas aumentam o estímulo (ACSM 2026).',
  },

  RESISTENCIA: {
    objective: 'RESISTENCIA',
    sets:    { min: 2, max: 3 },
    reps:    { min: 15, max: 25 },
    percentRM: { min: 40, max: 60 },
    rirTarget: 3,
    restBetweenSetsSeconds: { min: 30, max: 60 },    // ≤30–60s
    weeklySetsPerPattern:   { min: 4, optimal: 8 },
    sessionsPerWeek: { min: 2, max: 4 },
    tempo: '2:1:2:0',  // controlado
    notes: 'Resistência muscular: cargas leves com alto volume. Repouso curto aumenta o estímulo metabólico.',
  },

  POTENCIA: {
    objective: 'POTENCIA',
    sets:    { min: 3, max: 5 },
    reps:    { min: 3, max: 6 },
    percentRM: { min: 30, max: 70 },  // 30–70% 1RM para potência (ACSM 2026, Table 6)
    rirTarget: 3,
    restBetweenSetsSeconds: { min: 120, max: 300 },  // 2–5 min
    weeklySetsPerPattern:   { min: 3, optimal: 6 },
    sessionsPerWeek: { min: 2, max: 4 },
    tempo: '1:0:1:0',  // máxima velocidade concêntrica
    notes: 'Potência maximizada com 30–70% 1RM, fase concêntrica máxima. Volume baixo-moderado (reps×sets ≤24) (ACSM 2026).',
  },

  SAUDE_GERAL: {
    objective: 'SAUDE_GERAL',
    sets:    { min: 2, max: 3 },
    reps:    { min: 10, max: 15 },
    percentRM: { min: 50, max: 70 },
    rirTarget: 3,
    restBetweenSetsSeconds: { min: 60, max: 120 },
    weeklySetsPerPattern:   { min: 2, optimal: 6 },
    sessionsPerWeek: { min: 2, max: 3 },
    tempo: '2:1:2:0',
    notes: 'Para adultos saudáveis: qualquer forma de treino de resistência melhora força, hipertrofia e função física (ACSM 2026).',
  },
};

/**
 * Frequência semanal por nível de treino
 * Fonte: Tabela de classificação de nível, ACSM 2026
 */
export const FREQUENCY_BY_LEVEL: Record<TrainingLevel, { min: number; max: number; splitRecommendation: string }> = {
  INICIANTE:  { min: 2, max: 3, splitRecommendation: 'Corpo inteiro (full-body)' },
  INTERMEDIO: { min: 3, max: 4, splitRecommendation: 'Full-body 3x ou dividido 4x (push/pull/legs)' },
  AVANCADO:   { min: 4, max: 6, splitRecommendation: 'Divisão por grupo muscular' },
};

/**
 * Flags clínicos → exercícios a evitar (base interna de corretivos)
 * Extraído das considerações clínicas do documento
 */
export const CLINICAL_FLAGS_RULES: Record<string, {
  avoid: string[];          // padrões de movimento a evitar
  prioritize: string[];     // padrões a incluir como corretivos
  note: string;
}> = {
  evitar_lombar: {
    avoid: ['DOMINANTE_ANCA'],
    prioritize: ['CORE'],
    note: 'Evitar carga axial pesada. Priorizar estabilização lombar e core profundo.',
  },
  evitar_joelho: {
    avoid: ['DOMINANTE_JOELHO'],
    prioritize: ['DOMINANTE_ANCA'],
    note: 'Substituir agachamentos por dominantes de anca. Evitar flexão profunda do joelho.',
  },
  evitar_ombro: {
    avoid: ['EMPURRAR_VERTICAL'],
    prioritize: ['PUXAR_HORIZONTAL'],
    note: 'Evitar press acima da cabeça. Reforçar rotadores externos e romboides.',
  },
  hipertensao: {
    avoid: ['EMPURRAR_VERTICAL'],
    prioritize: ['LOCOMOCAO'],
    note: 'Evitar Valsalva (press acima da cabeça). Não iniciar se PAS >200 ou PAD >110 mmHg. Cap RPE ≤7.',
  },
  joelho: {
    avoid: ['DOMINANTE_JOELHO'],
    prioritize: ['DOMINANTE_ANCA'],
    note: 'Substituir dominantes de joelho por dominantes de anca. Evitar flexão profunda e stress patelofemoral.',
  },
  sedentario: {
    avoid: [],
    prioritize: ['CORE', 'LOCOMOCAO'],
    note: 'Início gradual. Priorizar mobilidade e activação antes de carga.',
  },
};

/**
 * Aplica overrides clínicos à prescrição base com base nos flags do cliente.
 * Actualmente: impõe rpeMaxCap: 7 para hipertensão e perfis contraindicados.
 */
export function applyClinicalOverrides(
  prescription: AcsmPrescription,
  flags: string[],
): AcsmPrescription {
  const sensitiveFlags = ['hipertensao', 'HIPERTENSAO', 'contraindicado', 'CONTRAINDICADO'];
  const hasSensitive = flags.some((f) => sensitiveFlags.includes(f));
  if (!hasSensitive) return prescription;
  return { ...prescription, rpeMaxCap: 7 };
}

// ─── Tipos auxiliares para phase-based defaults ──────────────────────────────

interface PhaseForça {
  series?: string;    // ex: "3-4" ou "3×8-12"
  intervalo?: string; // ex: "60-90s" ou "2-3min"
  [key: string]: unknown;
}

interface ProgramPhaseMin {
  weeks: number;
  forca?: PhaseForça;
}

export interface PhaseDefaults {
  sets?: { min: number; max: number };
  reps?: { min: number; max: number };
  restBetweenSetsSeconds?: { min: number; max: number };
}

/**
 * Dado o array de fases de um programa e a semana actual do treino,
 * devolve os defaults de sets/reps/repouso para essa fase.
 */
export function extractPhaseDefaults(
  phases: ProgramPhaseMin[],
  currentWeek: number,
): PhaseDefaults {
  let accWeeks = 0;
  for (const phase of phases) {
    accWeeks += phase.weeks;
    if (currentWeek <= accWeeks) {
      return parsePhaseToDefaults(phase);
    }
  }
  // Última fase como fallback
  if (phases.length > 0) return parsePhaseToDefaults(phases[phases.length - 1]);
  return {};
}

function parseSeriesString(s: string): { min: number; max: number } | undefined {
  // "3-4" | "3×8-12" → captura primeiros dois números separados por - ou ×
  const m = s.match(/(\d+)[-–×x](\d+)/);
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) };
  const single = s.match(/(\d+)/);
  if (single) { const n = parseInt(single[1]); return { min: n, max: n }; }
  return undefined;
}

function parseIntervalString(s: string): { min: number; max: number } | undefined {
  const secRange = s.match(/(\d+)[-–](\d+)\s*s/i);
  if (secRange) return { min: parseInt(secRange[1]), max: parseInt(secRange[2]) };
  const minRange = s.match(/(\d+)[-–](\d+)\s*min/i);
  if (minRange) return { min: parseInt(minRange[1]) * 60, max: parseInt(minRange[2]) * 60 };
  const singleSec = s.match(/(\d+)\s*s/i);
  if (singleSec) { const n = parseInt(singleSec[1]); return { min: n, max: n }; }
  const singleMin = s.match(/(\d+)\s*min/i);
  if (singleMin) { const n = parseInt(singleMin[1]) * 60; return { min: n, max: n }; }
  return undefined;
}

function parsePhaseToDefaults(phase: ProgramPhaseMin): PhaseDefaults {
  const result: PhaseDefaults = {};
  const f = phase.forca;
  if (!f) return result;
  if (f.series) {
    const parsed = parseSeriesString(f.series);
    if (parsed) result.sets = parsed;
  }
  if (f.intervalo) {
    const parsed = parseIntervalString(f.intervalo);
    if (parsed) result.restBetweenSetsSeconds = parsed;
  }
  return result;
}

/**
 * Dado o objectivo do cliente em texto livre (da avaliação),
 * mapeia para o enum interno de objectivos ACSM.
 */
export function mapObjectiveToAcsm(rawObjective: string): TrainingObjective {
  const o = rawObjective?.toLowerCase() ?? '';

  if (o.includes('força') || o.includes('forca') || o.includes('force'))
    return 'FORCA';
  if (o.includes('hipertrofia') || o.includes('massa') || o.includes('músculo'))
    return 'HIPERTROFIA';
  if (o.includes('resistência') || o.includes('resistencia') || o.includes('endurance'))
    return 'RESISTENCIA';
  if (o.includes('potência') || o.includes('potencia') || o.includes('explosiv'))
    return 'POTENCIA';

  return 'SAUDE_GERAL'; // default
}

// ─── Padrões recomendados por objectivo (ACSM 2026) ──────────────────────────

/**
 * Padrões de movimento que o ACSM 2026 recomenda para cada objectivo de treino.
 * Usados para validar se as selecções do utilizador cobrem os padrões necessários.
 */
export const REQUIRED_PATTERNS_BY_OBJECTIVE: Record<TrainingObjective, string[]> = {
  FORCA:       ['DOMINANTE_JOELHO', 'DOMINANTE_ANCA', 'EMPURRAR_HORIZONTAL', 'PUXAR_VERTICAL'],
  HIPERTROFIA: ['DOMINANTE_JOELHO', 'DOMINANTE_ANCA', 'EMPURRAR_HORIZONTAL', 'EMPURRAR_VERTICAL', 'PUXAR_HORIZONTAL', 'PUXAR_VERTICAL', 'CORE'],
  RESISTENCIA: ['DOMINANTE_JOELHO', 'DOMINANTE_ANCA', 'EMPURRAR_HORIZONTAL', 'PUXAR_HORIZONTAL', 'CORE', 'LOCOMOCAO'],
  POTENCIA:    ['DOMINANTE_JOELHO', 'DOMINANTE_ANCA', 'LOCOMOCAO'],
  SAUDE_GERAL: ['DOMINANTE_JOELHO', 'DOMINANTE_ANCA', 'EMPURRAR_HORIZONTAL', 'PUXAR_HORIZONTAL', 'CORE'],
};

// ─── Zonas de Karvonen esperadas por nível e fase (ACSM 2026) ─────────────────

/**
 * Zona de Karvonen correcta para cada fase de treino por nível.
 * Fonte: ACSM 2026 — Cardio prescription progressions (Tabela 5).
 * allowZ3: a fase admite progressão até Zona 3 no final do ciclo.
 */
export const CARDIO_ZONE_BY_LEVEL_PHASE: Record<
  TrainingLevel,
  Record<number, { zoneKey: 'z1' | 'z2' | 'z3'; allowZ3?: boolean; label: string }>
> = {
  INICIANTE: {
    1: { zoneKey: 'z1', label: 'Zona 1 (50–60%) — adaptação anatómica' },
    2: { zoneKey: 'z2', label: 'Zona 2 (60–75%) — base aeróbia' },
    3: { zoneKey: 'z2', allowZ3: true, label: 'Zona 2–3 (60–90%) — progressão' },
  },
  INTERMEDIO: {
    1: { zoneKey: 'z2', label: 'Zona 2 (60–75%) — consolidação' },
    2: { zoneKey: 'z2', allowZ3: true, label: 'Zona 2–3 (60–90%) — intensificação' },
  },
  AVANCADO: {
    1: { zoneKey: 'z1', label: 'Zona 1 (50–60%) — deload regenerativo' },
    2: { zoneKey: 'z2', allowZ3: true, label: 'Zona 2–3 (60–90%) — base aeróbia avançada' },
  },
};

export interface KarvonenZoneRange {
  low: number;
  high: number;
  label?: string;
}

export interface KarvonenZonesInput {
  z1: KarvonenZoneRange;
  z2: KarvonenZoneRange;
  z3: KarvonenZoneRange;
}

// ─── Validação 1: Volume semanal por padrão ───────────────────────────────────

/**
 * Valida se o volume semanal estimado de séries por padrão de movimento respeita
 * os mínimos ACSM 2026 para o objectivo prescrito.
 *
 * @param setsPerSession  — séries por exercício por sessão
 * @param sessionsPerWeek — número de sessões semanais
 * @param activePatternCount — padrões de movimento distintos no plano
 * @param objective       — objectivo ACSM
 */
export function validateWeeklyVolume(
  setsPerSession: number,
  sessionsPerWeek: number,
  activePatternCount: number,
  objective: TrainingObjective,
): string[] {
  const guide = ACSM_GUIDELINES[objective];
  const warnings: string[] = [];

  if (activePatternCount < 1 || setsPerSession < 1 || sessionsPerWeek < 1) return warnings;

  const totalSets = setsPerSession * sessionsPerWeek;
  const setsPerPattern = totalSets / activePatternCount;

  if (setsPerPattern < guide.weeklySetsPerPattern.min) {
    warnings.push(
      `ACSM 2026: Volume semanal insuficiente para ${objective}. ` +
      `Estimativa: ${Math.round(setsPerPattern)} séries/padrão/semana — ` +
      `mínimo recomendado: ${guide.weeklySetsPerPattern.min} séries/padrão/semana.`,
    );
  }

  return warnings;
}

// ─── Validação 2: Zona de Karvonen por nível e fase ───────────────────────────

/**
 * Valida se os limites de FC de um bloco cardio (bpm) estão alinhados com as
 * zonas de Karvonen calculadas para o cliente, dado o seu nível e fase actual.
 * Tolerância de ±5 bpm aplicada para evitar falsos positivos.
 */
export function validateCardioZone(
  cardioZoneLow: number,
  cardioZoneHigh: number,
  karvonenZones: KarvonenZonesInput,
  level: TrainingLevel,
  phase: number,
): string[] {
  const warnings: string[] = [];
  const phaseSpec = CARDIO_ZONE_BY_LEVEL_PHASE[level]?.[phase];
  if (!phaseSpec) return warnings;

  const expectedZone = karvonenZones[phaseSpec.zoneKey];
  const maxAllowedHigh = phaseSpec.allowZ3 ? karvonenZones.z3.high : expectedZone.high;
  const TOLERANCE = 5;

  if (cardioZoneLow < expectedZone.low - TOLERANCE) {
    warnings.push(
      `ACSM 2026 Karvonen: FC mínima do bloco (${cardioZoneLow} bpm) abaixo do esperado ` +
      `para ${level} Fase ${phase} — ${phaseSpec.label} (mínimo: ${expectedZone.low} bpm).`,
    );
  }

  if (cardioZoneHigh > maxAllowedHigh + TOLERANCE) {
    warnings.push(
      `ACSM 2026 Karvonen: FC máxima do bloco (${cardioZoneHigh} bpm) acima do esperado ` +
      `para ${level} Fase ${phase} — ${phaseSpec.label} (máximo: ${maxAllowedHigh} bpm).`,
    );
  }

  return warnings;
}

// ─── Validação 3: Padrões de movimento por objectivo ─────────────────────────

const PATTERN_LABELS_PT: Record<string, string> = {
  DOMINANTE_JOELHO:    'dominante de joelho',
  DOMINANTE_ANCA:      'dominante de anca',
  EMPURRAR_HORIZONTAL: 'empurrar horizontal',
  EMPURRAR_VERTICAL:   'empurrar vertical',
  PUXAR_HORIZONTAL:    'puxar horizontal',
  PUXAR_VERTICAL:      'puxar vertical',
  CORE:                'core',
  LOCOMOCAO:           'locomoção',
};

/**
 * Valida se os padrões de movimento seleccionados cobrem os padrões recomendados
 * pelo ACSM 2026 para o objectivo. Flags clínicos justificam ausências esperadas.
 */
export function validatePatternSelection(
  selectedPatterns: string[],
  objective: TrainingObjective,
  flags: string[] = [],
): string[] {
  const required = REQUIRED_PATTERNS_BY_OBJECTIVE[objective];
  const warnings: string[] = [];

  const clinicallyExcluded = new Set<string>();
  for (const flag of flags) {
    const rule = CLINICAL_FLAGS_RULES[flag];
    if (rule) rule.avoid.forEach((p) => clinicallyExcluded.add(p));
  }

  const selectedSet = new Set(selectedPatterns);
  const missing = required.filter((p) => !selectedSet.has(p) && !clinicallyExcluded.has(p));

  if (missing.length > 0) {
    const labels = missing.map((p) => PATTERN_LABELS_PT[p] ?? p).join(', ');
    warnings.push(
      `ACSM 2026: Para ${objective}, os seguintes padrões de movimento são recomendados ` +
      `mas estão ausentes: ${labels}.`,
    );
  }

  return warnings;
}

// ─── Validação de prescrição base ─────────────────────────────────────────────

/**
 * Verifica se a prescrição respeita os limites ACSM.
 * Devolve lista de avisos (pode estar vazia).
 */
export function validatePrescription(
  sets: number,
  reps: number,
  percentRM: number,
  objective: TrainingObjective,
): string[] {
  const guide = ACSM_GUIDELINES[objective];
  const warnings: string[] = [];

  if (sets < guide.sets.min) warnings.push(`ACSM recomenda mínimo ${guide.sets.min} séries para ${objective}.`);
  if (sets > guide.sets.max) warnings.push(`ACSM recomenda máximo ${guide.sets.max} séries para ${objective}.`);
  if (typeof guide.reps !== 'string') {
    if (reps < guide.reps.min) warnings.push(`ACSM recomenda mínimo ${guide.reps.min} reps para ${objective}.`);
    if (reps > guide.reps.max) warnings.push(`ACSM recomenda máximo ${guide.reps.max} reps para ${objective}.`);
  }
  if (percentRM > 0) {
    if (percentRM < guide.percentRM.min) warnings.push(`Intensidade baixa para ${objective}: ACSM recomenda ≥${guide.percentRM.min}% 1RM.`);
    if (percentRM > guide.percentRM.max) warnings.push(`Intensidade muito alta para ${objective}: ACSM recomenda ≤${guide.percentRM.max}% 1RM.`);
  }

  return warnings;
}
