import { Injectable } from "@nestjs/common";
import { WorkoutStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

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

  // CLIENT: activos
  async findActiveByClient(clientId: string) {
    return this.prisma.workout.findMany({
      where: { clientId, status: WorkoutStatus.ACTIVE },
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
}
