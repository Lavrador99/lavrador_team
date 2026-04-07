import { Injectable } from "@nestjs/common";
import { Equipment, MovementPattern, TrainingLevel } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateExerciseDto, UpdateExerciseDto } from "../types/exercises.dto";

interface ExerciseFilters {
  pattern?: MovementPattern;
  level?: TrainingLevel;
  equipment?: Equipment[];
  muscle?: string;
  search?: string;
}

@Injectable()
export class ExercisesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ExerciseFilters = {}) {
    const { pattern, level, equipment, muscle, search } = filters;

    return this.prisma.exercise.findMany({
      where: {
        isActive: true,
        ...(pattern && { pattern }),
        ...(level && { level }),
        ...(equipment?.length && { equipment: { hasSome: equipment } }),
        ...(muscle && {
          OR: [
            { primaryMuscles: { has: muscle } },
            { secondaryMuscles: { has: muscle } },
          ],
        }),
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
      },
      orderBy: [{ pattern: "asc" }, { level: "asc" }, { name: "asc" }],
    });
  }

  async findById(id: string) {
    return this.prisma.exercise.findUnique({ where: { id } });
  }

  async findByIds(ids: string[]) {
    return this.prisma.exercise.findMany({
      where: { id: { in: ids }, isActive: true },
    });
  }

  async create(data: CreateExerciseDto) {
    return this.prisma.exercise.create({ data });
  }

  async update(id: string, data: UpdateExerciseDto) {
    return this.prisma.exercise.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.exercise.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByPattern(pattern: MovementPattern, equipment?: Equipment[]) {
    return this.prisma.exercise.findMany({
      where: {
        isActive: true,
        pattern,
        ...(equipment?.length && { equipment: { hasSome: equipment } }),
      },
      orderBy: { level: "asc" },
    });
  }
}
