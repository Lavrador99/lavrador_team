import { Injectable } from "@nestjs/common";
import { WorkoutStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return d.toISOString().split("T")[0];
}

@Injectable()
export class WorkoutsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    programId: string;
    clientId: string;
    name: string;
    dayLabel?: string;
    order: number;
    blocks: any[];
    durationEstimatedMin: number;
  }) {
    return this.prisma.workout.create({ data });
  }

  async findByProgram(programId: string) {
    return this.prisma.workout.findMany({
      where: { programId },
      orderBy: { order: "asc" },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.workout.findMany({
      where: { clientId, status: { not: WorkoutStatus.ARCHIVED } },
      orderBy: [{ programId: "asc" }, { order: "asc" }],
      include: { program: { select: { id: true, name: true, status: true } } },
    });
  }

  // CLIENT: resolve userId → clientId, depois devolve ACTIVE + DRAFT
  async findActiveByUser(userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) return [];

    return this.prisma.workout.findMany({
      where: {
        clientId: client.id,
        status: { not: WorkoutStatus.ARCHIVED },
      },
      orderBy: { order: "asc" },
      include: { program: { select: { id: true, name: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.workout.findUnique({
      where: { id },
      include: {
        program: { select: { id: true, name: true, clientId: true } },
        logs: { orderBy: { date: "desc" }, take: 5 },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      dayLabel?: string;
      order?: number;
      status?: WorkoutStatus;
      blocks?: any[];
      durationEstimatedMin?: number;
    },
  ) {
    return this.prisma.workout.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.workout.delete({ where: { id } });
  }

  // Logs
  async createLog(data: {
    workoutId: string;
    clientId: string;
    date: Date;
    entries: any[];
    notes?: string;
    durationMin?: number;
    rpe?: number;
  }) {
    return this.prisma.workoutLog.create({ data });
  }

  async findLogsByWorkout(workoutId: string) {
    return this.prisma.workoutLog.findMany({
      where: { workoutId },
      orderBy: { date: "desc" },
    });
  }

  async findLogsByClient(clientId: string, limit = 20) {
    return this.prisma.workoutLog.findMany({
      where: { clientId },
      orderBy: { date: "desc" },
      take: limit,
      include: { workout: { select: { id: true, name: true } } },
    });
  }

  // ─── Exercise history: all sets for a given exerciseId ────────────────
  async findExerciseHistory(clientId: string, exerciseId: string) {
    // All logs for this client, filter by exerciseId in entries JSON
    const logs = await this.prisma.workoutLog.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
      select: { id: true, date: true, entries: true },
    });

    // Extract sets for the requested exercise from each log
    const history: { date: string; sets: any[] }[] = [];
    for (const log of logs) {
      const entries = log.entries as any[];
      const match = entries.find(
        (e: any) => e.exerciseId === exerciseId || e.exerciseName === exerciseId,
      );
      if (match) {
        history.push({
          date: log.date.toISOString(),
          sets: match.sets ?? [],
        });
      }
    }
    return history;
  }

  // ─── Calendar: dates where client logged a workout ────────────────────
  async findCalendar(clientId: string) {
    const logs = await this.prisma.workoutLog.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        durationMin: true,
        workout: { select: { id: true, name: true } },
      },
    });
    return logs.map((l) => ({
      id: l.id,
      date: l.date.toISOString().split("T")[0],
      workoutName: (l as any).workout?.name ?? null,
      durationMin: l.durationMin,
    }));
  }

  // ─── Muscle volume: sets per muscle group in last N weeks ─────────────
  async findMuscleVolume(clientId: string, weeks = 4) {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const logs = await this.prisma.workoutLog.findMany({
      where: { clientId, date: { gte: since } },
      orderBy: { date: "asc" },
      select: { date: true, entries: true },
    });

    // Accumulate total completed sets per muscle group
    const volumeMap: Record<string, number> = {};
    const weeklyMap: Record<string, Record<string, number>> = {};

    for (const log of logs) {
      const weekLabel = getWeekLabel(log.date);
      const entries = log.entries as any[];
      for (const entry of entries) {
        const muscle: string = entry.muscleGroup ?? "outro";
        const completedSets = (entry.sets as any[]).filter(
          (s: any) => s.completed,
        ).length;
        volumeMap[muscle] = (volumeMap[muscle] ?? 0) + completedSets;
        if (!weeklyMap[weekLabel]) weeklyMap[weekLabel] = {};
        weeklyMap[weekLabel][muscle] =
          (weeklyMap[weekLabel][muscle] ?? 0) + completedSets;
      }
    }

    const totalSets = Object.values(volumeMap).reduce((a, b) => a + b, 0) || 1;
    const cards = Object.entries(volumeMap).map(([muscle, sets]) => ({
      muscle,
      sets,
      pct: Math.round((sets / totalSets) * 100),
    })).sort((a, b) => b.sets - a.sets);

    const weekly = Object.entries(weeklyMap).map(([week, muscles]) => ({
      week,
      ...muscles,
    }));

    return { cards, weekly };
  }
}
