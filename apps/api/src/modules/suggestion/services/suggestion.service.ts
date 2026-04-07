import { Injectable } from "@nestjs/common";
import { Equipment, MovementPattern, TrainingLevel } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SuggestionRepository } from "../repositories/suggestion.repository";
import {
  ACSM_GUIDELINES,
  AcsmPrescription,
  CLINICAL_FLAGS_RULES,
  FREQUENCY_BY_LEVEL,
  mapObjectiveToAcsm,
  TrainingObjective,
  validatePrescription,
} from "./acsm-guidelines.engine";

const THRESHOLD_WORKOUTS = 10; // mínimo de workouts para activar sugestões com peso do PT

export interface SuggestionRequest {
  clientId: string;
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
    const prescription = ACSM_GUIDELINES[objective];
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

    // ─── Equipamento disponível ─────────────────────────────────────────
    const equipmentFilter =
      req.equipment.length > 0
        ? { hasSome: req.equipment as Equipment[] }
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
