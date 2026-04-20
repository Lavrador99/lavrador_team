import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { WorkoutStatus } from "../../../../../../libs/types/src/index";
import { WorkoutsRepository } from "../repositories/workouts.repository";
import {
  CreateWorkoutDto,
  CreateWorkoutLogDto,
  UpdateWorkoutDto,
} from "../types/workouts.dto";
import { calcWorkoutDuration } from "./workout-duration.calculator";
import { workoutBlocksSchema, workoutLogEntriesSchema } from "../schemas/workout.schemas";
import { extractPhaseDefaults } from "../../suggestion/services/acsm-guidelines.engine";
import { EmailService } from "../../email/email.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly repo: WorkoutsRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateWorkoutDto) {
    const rawBlocks = dto.blocks ?? [];
    const blocksResult = workoutBlocksSchema.safeParse(rawBlocks);
    if (!blocksResult.success) {
      throw new BadRequestException(`Blocos inválidos: ${blocksResult.error.issues[0]?.message}`);
    }
    let blocks = blocksResult.data as any[];

    // Aplicar defaults da fase do programa, se disponíveis
    if (dto.programId) {
      const program = await this.prisma.program.findUnique({
        where: { id: dto.programId },
        select: { phases: true },
      });
      if (program?.phases) {
        const phases = program.phases as any[];
        const currentWeek = Math.max(1, (dto.order ?? 0) + 1); // order 0-based → semana 1-based
        const phaseDefaults = extractPhaseDefaults(phases, currentWeek);
        if (phaseDefaults.sets || phaseDefaults.restBetweenSetsSeconds) {
          blocks = blocks.map((block) => ({
            ...block,
            restBetweenSets: phaseDefaults.restBetweenSetsSeconds?.min ?? block.restBetweenSets,
            exercises: (block.exercises ?? []).map((ex: any) => ({
              ...ex,
              sets: phaseDefaults.sets
                ? Math.min(phaseDefaults.sets.max, Math.max(phaseDefaults.sets.min, ex.sets))
                : ex.sets,
            })),
          }));
        }
      }
    }

    const { totalMin } = calcWorkoutDuration(blocks);

    return this.repo.create({
      programId: dto.programId,
      clientId: dto.clientId,
      name: dto.name,
      dayLabel: dto.dayLabel,
      order: dto.order ?? 0,
      blocks,
      durationEstimatedMin: totalMin,
    });
  }

  async findByProgram(programId: string) {
    return this.repo.findByProgram(programId);
  }

  async findByClient(clientId: string) {
    return this.repo.findByClient(clientId);
  }

  async findActiveByUser(userId: string) {
    return this.repo.findActiveByUser(userId);
  }

  async findById(
    id: string,
    requestingUserId?: string,
    requestingRole?: string,
  ) {
    const workout = await this.repo.findById(id);
    if (!workout) throw new NotFoundException("Workout não encontrado");

    // CLIENT só pode ver os seus — resolve userId → clientId primeiro
    if (requestingRole === "CLIENT" && requestingUserId) {
      const clientRecord = await this.prisma.client.findUnique({
        where: { userId: requestingUserId },
      });
      const clientId = clientRecord?.id;
      if (
        !clientId ||
        (workout.program?.clientId !== clientId &&
          workout.clientId !== clientId)
      ) {
        throw new ForbiddenException("Sem acesso");
      }
    }

    return workout;
  }

  async update(id: string, dto: UpdateWorkoutDto) {
    const workout = await this.findById(id);
    let blocks = dto.blocks;
    let durationEstimatedMin: number | undefined;

    if (blocks !== undefined) {
      const blocksResult = workoutBlocksSchema.safeParse(blocks);
      if (!blocksResult.success) {
        throw new BadRequestException(`Blocos inválidos: ${blocksResult.error.issues[0]?.message}`);
      }
      blocks = blocksResult.data as typeof blocks;
      const { totalMin } = calcWorkoutDuration(blocks);
      durationEstimatedMin = totalMin;
    }

    const updated = await this.repo.update(id, {
      ...dto,
      status: dto.status as WorkoutStatus | undefined,
      durationEstimatedMin,
    });

    // Send plan email when workout is activated
    if (dto.status === 'ACTIVE' && workout.status !== 'ACTIVE') {
      this.sendPlanEmail(workout.clientId, updated.name).catch(() => {});
    }

    return updated;
  }

  private async sendPlanEmail(clientId: string, workoutName: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { user: { select: { email: true } } },
    });
    if (!client) return;
    const user = (client as any).user;
    if (!user?.email) return;
    await this.emailService.sendPlanUpdated(user.email, {
      clientName: client.name ?? user.name ?? 'Cliente',
      planName: workoutName,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repo.delete(id);
  }

  // ─── Duration preview (sem guardar) ───────────────────────────────────
  calcDurationPreview(blocks: any[]) {
    return calcWorkoutDuration(blocks);
  }

  // ─── Resolve userId (JWT sub) → Client.id ────────────────────────────
  async resolveClientId(userId: string): Promise<string> {
    const client = await this.prisma.client.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!client) throw new UnprocessableEntityException('Perfil de cliente não encontrado para este utilizador');
    return client.id;
  }

  // ─── Logs ──────────────────────────────────────────────────────────────
  async createLog(dto: CreateWorkoutLogDto, userId: string) {
    await this.findById(dto.workoutId);

    // userId (JWT sub) → Client.id (FK in WorkoutLog)
    const clientId = await this.resolveClientId(userId);

    const entriesResult = workoutLogEntriesSchema.safeParse(dto.entries);
    if (!entriesResult.success) {
      throw new BadRequestException(`Entradas inválidas: ${entriesResult.error.issues[0]?.message}`);
    }

    const log = await this.repo.createLog({
      workoutId: dto.workoutId,
      clientId,
      date: dto.date ? new Date(dto.date) : new Date(),
      entries: dto.entries,
      notes: dto.notes,
      durationMin: dto.durationMin,
      rpe: dto.rpe,
    });

    // Auto-detect PRs (best 1RM per exercise in this log)
    this.detectAndSavePersonalRecords(clientId, dto.entries).catch(() => {});

    // Recalculate and persist client metrics
    this.recalculateClientMetrics(clientId).catch(() => {});

    return log;
  }

  private async detectAndSavePersonalRecords(clientId: string, entries: any[]) {
    for (const entry of entries) {
      let best1RM = 0;
      let bestLoad = 0;
      let bestReps = 0;

      for (const set of entry.sets ?? []) {
        if (!set.completed) continue;
        const load = Number(set.load ?? 0);
        const reps = Number(set.reps ?? 0);
        if (load > 0 && reps >= 1) {
          const rm1 = load * (1 + reps / 30);
          if (rm1 > best1RM) { best1RM = rm1; bestLoad = load; bestReps = reps; }
        }
      }

      if (best1RM === 0) continue;
      const roundedRM = Math.round(best1RM);

      // Check if this beats the existing record
      const existing = await this.prisma.personalRecord.findFirst({
        where: { clientId, exerciseName: entry.exerciseName, type: 'WEIGHT_KG' },
        orderBy: { value: 'desc' },
      });

      if (!existing || roundedRM > existing.value) {
        await this.prisma.personalRecord.create({
          data: {
            clientId,
            exerciseId: entry.exerciseId || undefined,
            exerciseName: entry.exerciseName,
            type: 'WEIGHT_KG',
            value: roundedRM,
            notes: `Auto-detectado: ${bestLoad}kg × ${bestReps} reps (Epley)`,
            recordedAt: new Date(),
          },
        });
      }
    }
  }

  private async recalculateClientMetrics(clientId: string) {
    const logs = await this.prisma.workoutLog.findMany({
      where: { clientId },
      select: { date: true, entries: true },
      orderBy: { date: 'desc' },
    });

    const totalWorkouts = logs.length;
    const lastWorkoutDate = logs[0]?.date ?? null;

    // Streak: count consecutive unique days going backwards from today
    const daySet = new Set(logs.map((l) => l.date.toISOString().split('T')[0]));
    let streak = 0;
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    while (true) {
      const key = cur.toISOString().split('T')[0];
      if (daySet.has(key)) { streak++; cur.setDate(cur.getDate() - 1); } else break;
    }

    // Total volume: sum of load × reps for all completed sets
    let totalVolumeKg = 0;
    for (const log of logs) {
      const entries = Array.isArray(log.entries) ? log.entries as any[] : [];
      for (const entry of entries) {
        for (const set of entry.sets ?? []) {
          if (set.completed && set.load && set.reps) {
            totalVolumeKg += (Number(set.load) || 0) * (Number(set.reps) || 0);
          }
        }
      }
    }

    await this.prisma.clientMetrics.upsert({
      where: { clientId },
      update: { totalWorkouts, workoutStreak: streak, lastWorkoutDate, totalVolumeKg },
      create: { clientId, totalWorkouts, workoutStreak: streak, lastWorkoutDate, totalVolumeKg },
    });
  }

  async getLogsByWorkout(workoutId: string) {
    return this.repo.findLogsByWorkout(workoutId);
  }

  async getLogsByClient(clientId: string) {
    return this.repo.findLogsByClient(clientId);
  }

  async getExerciseHistory(clientId: string, exerciseId: string) {
    return this.repo.findExerciseHistory(clientId, exerciseId);
  }

  async getCalendar(clientId: string) {
    return this.repo.findCalendar(clientId);
  }

  async getMuscleVolume(clientId: string, weeks = 4) {
    return this.repo.findMuscleVolume(clientId, weeks);
  }

  async getLastLog(workoutId: string, userId: string) {
    const clientId = await this.resolveClientId(userId);
    return this.repo.findLastLogByWorkout(workoutId, clientId);
  }
}
