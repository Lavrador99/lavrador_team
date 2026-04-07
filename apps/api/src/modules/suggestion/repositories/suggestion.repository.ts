import { Injectable } from "@nestjs/common";
import { MovementPattern, TrainingLevel } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SuggestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Preference scores ────────────────────────────────────────────────

  async getScoresForContext(
    level: TrainingLevel,
    pattern: MovementPattern,
    objective: string,
    limit = 10,
  ) {
    return this.prisma.exercisePreferenceScore.findMany({
      where: { level, pattern, objective },
      orderBy: { score: "desc" },
      take: limit,
      include: { exercise: true },
    });
  }

  async upsertScore(data: {
    exerciseId: string;
    level: TrainingLevel;
    pattern: MovementPattern;
    objective: string;
    delta: number; // positivo = PT escolheu, negativo = rejeitou
  }) {
    const existing = await this.prisma.exercisePreferenceScore.findUnique({
      where: {
        exerciseId_level_pattern_objective: {
          exerciseId: data.exerciseId,
          level: data.level,
          pattern: data.pattern,
          objective: data.objective,
        },
      },
    });

    if (existing) {
      return this.prisma.exercisePreferenceScore.update({
        where: { id: existing.id },
        data: {
          score: Math.max(0.1, existing.score + data.delta),
          timesUsed: data.delta > 0 ? { increment: 1 } : undefined,
          timesRejected: data.delta < 0 ? { increment: 1 } : undefined,
          lastUsedAt: new Date(),
        },
      });
    }

    return this.prisma.exercisePreferenceScore.create({
      data: {
        exerciseId: data.exerciseId,
        level: data.level,
        pattern: data.pattern,
        objective: data.objective,
        score: Math.max(0.1, 1.0 + data.delta),
        timesUsed: data.delta > 0 ? 1 : 0,
        timesRejected: data.delta < 0 ? 1 : 0,
      },
    });
  }

  // Registo de substituições (X → Y)
  async recordSubstitution(data: {
    fromExId: string;
    toExId: string;
    level: TrainingLevel;
    reason?: string;
  }) {
    // Penaliza o exercício substituído, recompensa o escolhido
    await Promise.all([this.prisma.exerciseSubstitution.create({ data })]);
  }

  // ─── Stats para o threshold ───────────────────────────────────────────

  async countWorkouts(): Promise<number> {
    return this.prisma.workout.count({ where: { status: "ACTIVE" } });
  }

  async countScoreEntries(): Promise<number> {
    return this.prisma.exercisePreferenceScore.count();
  }

  async getTopScores(limit = 20) {
    return this.prisma.exercisePreferenceScore.findMany({
      orderBy: { score: "desc" },
      take: limit,
      include: {
        exercise: { select: { id: true, name: true, pattern: true } },
      },
    });
  }

  // ─── Contexto do PT (para sugestões) ─────────────────────────────────

  async getPatternDistribution() {
    const workouts = await this.prisma.workout.findMany({
      where: { status: "ACTIVE" },
      select: { blocks: true },
    });

    const dist: Record<string, number> = {};
    for (const w of workouts) {
      const blocks = (w.blocks as any[]) ?? [];
      for (const b of blocks) {
        const type: string = b.type;
        dist[type] = (dist[type] ?? 0) + 1;
      }
    }
    return dist;
  }

  async getExerciseFrequency() {
    const selections = await this.prisma.exerciseSelection.groupBy({
      by: ["exerciseId"],
      _count: { exerciseId: true },
      orderBy: { _count: { exerciseId: "desc" } },
      take: 20,
    });

    const ids = selections.map((s) => s.exerciseId);
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, pattern: true, primaryMuscles: true },
    });
    const exMap = new Map(exercises.map((e) => [e.id, e]));

    return selections.map((s) => ({
      exercise: exMap.get(s.exerciseId),
      count: s._count.exerciseId,
    }));
  }
}
