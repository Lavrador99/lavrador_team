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
    avoid: [],
    prioritize: ['LOCOMOCAO'],
    note: 'Evitar Valsalva. Não iniciar se PAS >200 ou PAD >110 mmHg.',
  },
  sedentario: {
    avoid: [],
    prioritize: ['CORE', 'LOCOMOCAO'],
    note: 'Início gradual. Priorizar mobilidade e activação antes de carga.',
  },
};

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
