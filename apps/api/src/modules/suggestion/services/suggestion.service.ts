import { Injectable } from "@nestjs/common";
import { Equipment, MovementPattern, TrainingLevel } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SuggestionRepository } from "../repositories/suggestion.repository";
import {
  ACSM_GUIDELINES,
  AcsmPrescription,
  CLINICAL_FLAGS_RULES,
  FREQUENCY_BY_LEVEL,
  KarvonenZonesInput,
  applyClinicalOverrides,
  mapObjectiveToAcsm,
  TrainingObjective,
  validatePrescription,
  validatePatternSelection,
} from "./acsm-guidelines.engine";

const THRESHOLD_WORKOUTS = 10; // mínimo de workouts para activar sugestões com peso do PT

export interface SuggestionRequest {
  clientId: string;
  assessmentId?: string; // opcional — activa Karvonen se presente
  // Contexto da avaliação
  level: TrainingLevel;
  objective: string; // texto livre → mapeia para ACSM
  flags: string[]; // ex: ['evitar_joelho', 'sedentario']
  equipment: string[]; // ex: ['HALTERES', 'BARRA_FIXA']
  pattern?: MovementPattern; // padrão específico, ou todos
}

export interface ExerciseSuggestion {
  exerciseId: string;
  name: string;
  pattern: MovementPattern;
  primaryMuscles: string[];
  score: number; // score calculado (0–10+)
  origin: "PT_PREFERENCE" | "ACSM_DEFAULT" | "CORRECTIVE";
  notes?: string;
}

export interface SuggestionResult {
  prescription: AcsmPrescription;
  frequencyRecommendation: string;
  suggestions: ExerciseSuggestion[];
  correctiveExercises: ExerciseSuggestion[];
  warnings: string[]; // avisos ACSM se algo estiver fora dos parâmetros
  systemStatus: {
    threshold: number;
    currentWorkouts: number;
    learningActive: boolean;
    message: string;
  };
}

@Injectable()
export class SuggestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: SuggestionRepository,
  ) {}

  async suggest(req: SuggestionRequest): Promise<SuggestionResult> {
    const objective = mapObjectiveToAcsm(req.objective);
    const basePrescription = ACSM_GUIDELINES[objective];
    const prescription = applyClinicalOverrides(basePrescription, req.flags);
    const freqRec = FREQUENCY_BY_LEVEL[req.level];

    // ─── Estado do sistema (threshold) ─────────────────────────────────
    const workoutCount = await this.repo.countWorkouts();
    const learningActive = workoutCount >= THRESHOLD_WORKOUTS;

    const systemStatus = {
      threshold: THRESHOLD_WORKOUTS,
      currentWorkouts: workoutCount,
      learningActive,
      message: learningActive
        ? `Sistema de aprendizagem activo — baseado em ${workoutCount} treinos do PT.`
        : `Cria mais ${THRESHOLD_WORKOUTS - workoutCount} treinos para activar sugestões personalizadas. A usar regras ACSM 2026.`,
    };

    // ─── Flags clínicos → padrões a evitar / priorizar ─────────────────
    const avoidPatterns = new Set<string>();
    const prioritizePatterns = new Set<string>();
    const clinicalNotes: string[] = [];

    for (const flag of req.flags) {
      const rule = CLINICAL_FLAGS_RULES[flag];
      if (rule) {
        rule.avoid.forEach((p) => avoidPatterns.add(p));
        rule.prioritize.forEach((p) => prioritizePatterns.add(p));
        clinicalNotes.push(rule.note);
      }
    }

    // ─── Equipamento disponível (fallback para assessment do cliente) ────
    let equipment = req.equipment;
    if (equipment.length === 0 && req.clientId) {
      const latestAssessment = await this.prisma.assessment.findFirst({
        where: { clientId: req.clientId },
        orderBy: { createdAt: 'desc' },
        select: { data: true },
      });
      const assessmentData = latestAssessment?.data as Record<string, unknown> | null;
      const fromAssessment = assessmentData?.equipamento;
      if (Array.isArray(fromAssessment) && fromAssessment.length > 0) {
        equipment = fromAssessment as string[];
      }
    }
    const equipmentFilter =
      equipment.length > 0
        ? { hasSome: equipment as Equipment[] }
        : undefined;

    // ─── Padrões a sugerir ──────────────────────────────────────────────
    const patterns: MovementPattern[] = req.pattern
      ? [req.pattern]
      : this.getPatternsForObjective(objective);

    const validPatterns = patterns.filter((p) => !avoidPatterns.has(p));

    // ─── Buscar exercícios da base filtrados ────────────────────────────
    const exercises = await this.prisma.exercise.findMany({
      where: {
        isActive: true,
        level: { in: this.getLevelsForClient(req.level) },
        pattern: validPatterns.length > 0 ? { in: validPatterns } : undefined,
        equipment: equipmentFilter,
      },
      select: {
        id: true,
        name: true,
        pattern: true,
        primaryMuscles: true,
        clinicalNotes: true,
        preferenceScores: {
          where: {
            level: req.level,
            objective: objective,
          },
          select: { score: true, timesUsed: true },
        },
      },
    });

    // ─── Calcular score de cada exercício ───────────────────────────────
    const scored: ExerciseSuggestion[] = exercises.map((ex) => {
      const prefScore = ex.preferenceScores[0];
      let score = 1.0; // base
      let origin: ExerciseSuggestion["origin"] = "ACSM_DEFAULT";

      if (prefScore) {
        // Usa preferências do PT sempre que existam; amplifica após threshold
        const amplifier = learningActive
          ? 1 + Math.log(prefScore.timesUsed + 1) * 0.3
          : 1;
        score = prefScore.score * amplifier;
        origin = learningActive ? "PT_PREFERENCE" : "ACSM_DEFAULT";
      }

      // Bónus por padrão prioritário (corretivo clínico)
      if (prioritizePatterns.has(ex.pattern)) {
        score += 2.0;
        origin = "CORRECTIVE";
      }

      return {
        exerciseId: ex.id,
        name: ex.name,
        pattern: ex.pattern,
        primaryMuscles: ex.primaryMuscles,
        score: Math.round(score * 100) / 100,
        origin,
      };
    });

    // ─── Ordenar por score e separar corretivos ─────────────────────────
    scored.sort((a, b) => b.score - a.score);

    const correctives = scored
      .filter((e) => e.origin === "CORRECTIVE")
      .slice(0, 2)
      .map((e) => ({ ...e, notes: clinicalNotes[0] }));

    // 80% preferidos + 20% é preenchido pelos corretivos
    const mainSuggestions = scored
      .filter((e) => e.origin !== "CORRECTIVE")
      .slice(0, 8);

    // ─── Avisos ACSM ────────────────────────────────────────────────────
    const warnings: string[] = [...clinicalNotes];
    // Aviso de volume semanal
    if (prescription.weeklySetsPerPattern.min > 0) {
      warnings.push(
        `ACSM 2026: Para ${objective}, o volume óptimo é ${prescription.weeklySetsPerPattern.optimal} séries/padrão/semana.`,
      );
    }
    // Aviso de RPE cap clínico
    if (prescription.rpeMaxCap) {
      warnings.push(`Limite de esforço clínico: RPE ≤${prescription.rpeMaxCap} (flag de risco cardiovascular).`);
    }
    // Validação de padrões de movimento vs. objectivo
    if (req.pattern) {
      // Padrão específico pedido — verificar se é recomendado para o objectivo
      const patternWarnings = validatePatternSelection([req.pattern], objective, req.flags);
      warnings.push(...patternWarnings);
    }
    // Karvonen: se assessmentId presente, verificar zonas de FC
    if (req.assessmentId) {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: req.assessmentId },
        select: { data: true, flags: true },
      });
      if (assessment) {
        const data = assessment.data as Record<string, unknown>;
        const computed = data?._computed as Record<string, unknown> | undefined;
        // Usar o tipo correcto das zonas de Karvonen (z1/z2/z3, não zone2Max)
        const zones = computed?.karvonenZones as KarvonenZonesInput | undefined;
        const allFlags = [...req.flags, ...assessment.flags];
        const isSedentary = allFlags.includes('sedentario');
        if (zones?.z2?.high) {
          if (isSedentary && prescription.percentRM.max > 60) {
            warnings.push(
              `Karvonen: perfil sedentário — manter %RM ≤60 nas primeiras 4 semanas (zona 2 FC: ≤${zones.z2.high} bpm).`,
            );
          } else if (!isSedentary) {
            warnings.push(
              `Karvonen: zonas de FC calculadas — Z1: ${zones.z1.low}–${zones.z1.high} bpm · ` +
              `Z2: ${zones.z2.low}–${zones.z2.high} bpm · Z3: ${zones.z3.low}–${zones.z3.high} bpm.`,
            );
          }
        }
      }
    }

    return {
      prescription,
      frequencyRecommendation: `${freqRec.min}–${freqRec.max}x/semana — ${freqRec.splitRecommendation}`,
      suggestions: mainSuggestions,
      correctiveExercises: correctives,
      warnings,
      systemStatus,
    };
  }

  // ─── Registar escolha do PT (aprende) ────────────────────────────────

  async recordChoice(data: {
    exerciseId: string;
    level: TrainingLevel;
    pattern: MovementPattern;
    objective: string;
    chosen: boolean; // true = PT escolheu, false = PT rejeitou
  }) {
    const objective = mapObjectiveToAcsm(data.objective);
    const delta = data.chosen ? +1.0 : -0.5;

    await this.repo.upsertScore({
      exerciseId: data.exerciseId,
      level: data.level,
      pattern: data.pattern,
      objective,
      delta,
    });

    return {
      ok: true,
      delta,
      message: data.chosen ? "Score aumentado" : "Score reduzido",
    };
  }

  // Registar substituição explícita X → Y
  async recordSubstitution(data: {
    fromExId: string;
    toExId: string;
    level: TrainingLevel;
    pattern: MovementPattern;
    objective: string;
    reason?: string;
  }) {
    const objective = mapObjectiveToAcsm(data.objective);

    // Penaliza X, recompensa Y
    await Promise.all([
      this.repo.upsertScore({
        exerciseId: data.fromExId,
        level: data.level,
        pattern: data.pattern,
        objective,
        delta: -1.0,
      }),
      this.repo.upsertScore({
        exerciseId: data.toExId,
        level: data.level,
        pattern: data.pattern,
        objective,
        delta: +1.5,
      }),
      this.repo.recordSubstitution({
        fromExId: data.fromExId,
        toExId: data.toExId,
        level: data.level,
        pattern: data.pattern,
        objective,
        reason: data.reason,
      }),
    ]);

    return { ok: true };
  }

  // ─── Dashboard de aprendizagem ────────────────────────────────────────

  async getLearningStatus() {
    const [workoutCount, scoreCount, topScores, patternDist, exFreq] =
      await Promise.all([
        this.repo.countWorkouts(),
        this.repo.countScoreEntries(),
        this.repo.getTopScores(10),
        this.repo.getPatternDistribution(),
        this.repo.getExerciseFrequency(),
      ]);

    return {
      threshold: THRESHOLD_WORKOUTS,
      currentWorkouts: workoutCount,
      learningActive: workoutCount >= THRESHOLD_WORKOUTS,
      totalPreferenceEntries: scoreCount,
      topExercises: topScores.map((s) => ({
        name: s.exercise.name,
        pattern: s.exercise.pattern,
        score: s.score,
        timesUsed: s.timesUsed,
        level: s.level,
        objective: s.objective,
      })),
      blockTypeDistribution: patternDist,
      mostUsedExercises: exFreq.slice(0, 10),
    };
  }

  // ─── Validar prescrição manual ────────────────────────────────────────

  validateManual(
    sets: number,
    reps: number,
    percentRM: number,
    objectiveRaw: string,
  ) {
    const objective = mapObjectiveToAcsm(objectiveRaw);
    const warnings = validatePrescription(sets, reps, percentRM, objective);
    const prescription = ACSM_GUIDELINES[objective];
    return {
      objective,
      prescription,
      warnings,
      isValid: warnings.length === 0,
    };
  }

  // ─── Alternativas rápidas para substituição durante treino ────────────
  // Dado um exercício, devolve alternativas do mesmo padrão de movimento.

  async getAlternatives(exerciseId: string, clientFlags: string[] = [], limit = 6) {
    const original = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, name: true, pattern: true, level: true, equipment: true },
    });
    if (!original) return [];

    const avoidPatterns = new Set<string>();
    for (const flag of clientFlags) {
      const rule = CLINICAL_FLAGS_RULES[flag];
      if (rule) rule.avoid.forEach((p) => avoidPatterns.add(p));
    }

    if (avoidPatterns.has(original.pattern)) return [];

    // Levels broadened: always include INICIANTE + original level tier
    const levels = this.getLevelsForClient(original.level);

    const candidates = await this.prisma.exercise.findMany({
      where: {
        isActive: true,
        id: { not: exerciseId },
        pattern: original.pattern,
        level: { in: levels },
        NOT: clientFlags.length
          ? {
              clinicalNotes: {
                hasSome: clientFlags,
              },
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        pattern: true,
        primaryMuscles: true,
        equipment: true,
        preferenceScores: {
          select: { score: true, timesUsed: true },
          take: 1,
          orderBy: { score: 'desc' },
        },
      },
      take: limit * 3,
    });

    // If no candidates with same level, broaden to all levels
    const pool = candidates.length > 0 ? candidates : await this.prisma.exercise.findMany({
      where: {
        isActive: true,
        id: { not: exerciseId },
        pattern: original.pattern,
      },
      select: {
        id: true, name: true, pattern: true, primaryMuscles: true, equipment: true,
        preferenceScores: { select: { score: true }, take: 1, orderBy: { score: 'desc' } },
      },
      take: limit * 3,
    });

    return pool
      .map((ex) => ({
        exerciseId: ex.id,
        name: ex.name,
        pattern: ex.pattern,
        primaryMuscles: ex.primaryMuscles,
        equipment: ex.equipment,
        score: ex.preferenceScores[0]?.score ?? 1.0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private getPatternsForObjective(
    objective: TrainingObjective,
  ): MovementPattern[] {
    const all: MovementPattern[] = [
      "DOMINANTE_JOELHO",
      "DOMINANTE_ANCA",
      "EMPURRAR_HORIZONTAL",
      "EMPURRAR_VERTICAL",
      "PUXAR_HORIZONTAL",
      "PUXAR_VERTICAL",
      "CORE",
      "LOCOMOCAO",
    ];

    switch (objective) {
      case "FORCA":
        return [
          "DOMINANTE_JOELHO",
          "DOMINANTE_ANCA",
          "EMPURRAR_HORIZONTAL",
          "PUXAR_VERTICAL",
        ];
      case "HIPERTROFIA":
        return all.filter((p) => p !== "LOCOMOCAO");
      case "RESISTENCIA":
        return all;
      case "POTENCIA":
        return ["DOMINANTE_JOELHO", "DOMINANTE_ANCA", "LOCOMOCAO"];
      default:
        return all;
    }
  }

  private getLevelsForClient(level: TrainingLevel): TrainingLevel[] {
    if (level === "INICIANTE") return ["INICIANTE"];
    if (level === "INTERMEDIO") return ["INICIANTE", "INTERMEDIO"];
    return ["INICIANTE", "INTERMEDIO", "AVANCADO"];
  }
}
