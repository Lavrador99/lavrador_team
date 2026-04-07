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

    return this.repo.createLog({
      workoutId: dto.workoutId,
      clientId,
      date: dto.date ? new Date(dto.date) : new Date(),
      entries: dto.entries,
      notes: dto.notes,
      durationMin: dto.durationMin,
      rpe: dto.rpe,
    });
  }

  async getLogsByWorkout(workoutId: string) {
    return this.repo.findLogsByWorkout(workoutId);
  }

  async getLogsByClient(clientId: string) {
    return this.repo.findLogsByClient(clientId);
  }
}
