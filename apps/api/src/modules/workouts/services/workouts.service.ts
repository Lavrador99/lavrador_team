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

@Injectable()
export class WorkoutsService {
  constructor(private readonly repo: WorkoutsRepository) {}

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

  async findActiveByClient(clientId: string) {
    return this.repo.findActiveByClient(clientId);
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
        // Verificar via clientId directamente
        if (workout.clientId !== requestingUserId) {
          throw new ForbiddenException("Sem acesso");
        }
      }
    }

    return workout;
  }

  async update(id: string, dto: UpdateWorkoutDto) {
    await this.findById(id);
    const blocks = dto.blocks;
    let durationEstimatedMin: number | undefined;

    if (blocks !== undefined) {
      const { totalMin } = calcWorkoutDuration(blocks);
      durationEstimatedMin = totalMin;
    }

    return this.repo.update(id, {
      ...dto,
      status: dto.status as WorkoutStatus | undefined,
      durationEstimatedMin,
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
    const workout = await this.findById(dto.workoutId);

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
