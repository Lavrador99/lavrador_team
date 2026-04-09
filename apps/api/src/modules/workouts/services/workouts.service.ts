import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { WorkoutStatus } from "../../../../../../libs/types/src/index";
import { WorkoutsRepository } from "../repositories/workouts.repository";
import {
  CreateWorkoutDto,
  CreateWorkoutLogDto,
  UpdateWorkoutDto,
} from "../types/workouts.dto";
import { calcWorkoutDuration } from "./workout-duration.calculator";
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
    const blocks = dto.blocks ?? [];
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

    // CLIENT só pode ver os seus
    if (requestingRole === "CLIENT" && requestingUserId) {
      if (workout.program?.clientId !== requestingUserId) {
        if (workout.clientId !== requestingUserId) {
          throw new ForbiddenException("Sem acesso");
        }
      }
    }

    return workout;
  }

  async update(id: string, dto: UpdateWorkoutDto) {
    const workout = await this.findById(id);
    const blocks = dto.blocks;
    let durationEstimatedMin: number | undefined;

    if (blocks !== undefined) {
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

  // ─── Logs ──────────────────────────────────────────────────────────────
  async createLog(dto: CreateWorkoutLogDto, clientId: string) {
    await this.findById(dto.workoutId);

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
}
