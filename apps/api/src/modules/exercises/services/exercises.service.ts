import { Injectable, NotFoundException } from '@nestjs/common';
import { Equipment, MovementPattern } from '@prisma/client';
import { ExercisesRepository } from '../repositories/exercises.repository';
import {
  CreateExerciseDto,
  UpdateExerciseDto,
  ExerciseFiltersDto,
} from '../types/exercises.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly exercisesRepository: ExercisesRepository) {}

  async findAll(filtersDto: ExerciseFiltersDto) {
    const equipment = filtersDto.equipment
      ? (filtersDto.equipment.split(',').map((e) => e.trim()) as Equipment[])
      : undefined;

    return this.exercisesRepository.findAll({
      pattern: filtersDto.pattern,
      level: filtersDto.level,
      equipment,
      muscle: filtersDto.muscle,
      search: filtersDto.search,
    });
  }

  async findById(id: string) {
    const exercise = await this.exercisesRepository.findById(id);
    if (!exercise) throw new NotFoundException('Exercício não encontrado');
    return exercise;
  }

  async create(dto: CreateExerciseDto) {
    return this.exercisesRepository.create(dto);
  }

  async update(id: string, dto: UpdateExerciseDto) {
    await this.findById(id); // valida existência
    return this.exercisesRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.exercisesRepository.softDelete(id);
  }

  // Usado pelo motor de prescrição (Fase 2)
  // Devolve os melhores exercícios por padrão de movimento, filtrados pelo equipamento do cliente
  async getSuggestionsForPattern(
    pattern: MovementPattern,
    clientEquipment: Equipment[],
    limit = 3,
  ) {
    const exercises = await this.exercisesRepository.findByPattern(
      pattern,
      clientEquipment,
    );
    return exercises.slice(0, limit);
  }
}
