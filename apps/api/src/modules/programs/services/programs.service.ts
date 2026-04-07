import { Injectable, NotFoundException } from "@nestjs/common";
import { MovementPattern, SelectionType } from "@prisma/client";
import { AssessmentsService } from "../../assessments/services/assessments.service";
import { ExercisesService } from "../../exercises/services/exercises.service";
import { ProgramsRepository } from "../repositories/programs.repository";
import { GenerateProgramDto, UpdateSelectionsDto } from "../types/programs.dto";
import { generatePrescriptionPlan } from "./prescription-engine";

@Injectable()
export class ProgramsService {
  constructor(
    private readonly repo: ProgramsRepository,
    private readonly assessmentsService: AssessmentsService,
    private readonly exercisesService: ExercisesService,
  ) {}

  async generate(dto: GenerateProgramDto) {
    const assessment = await this.assessmentsService.findById(dto.assessmentId);

    // Enriquecer as selecções com o nome do exercício para o motor
    const exerciseIds = dto.selectedExercises.map((e) => e.exerciseId);
    const exercises =
      await this.exercisesService["exercisesRepository"].findByIds(exerciseIds);
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    const selectedWithNames = dto.selectedExercises.map((sel) => ({
      ...sel,
      name: exerciseMap.get(sel.exerciseId)?.name ?? sel.exerciseId,
    }));

    // Gerar plano
    const phases = generatePrescriptionPlan({
      level: assessment.level,
      data: assessment.data as any,
      selectedExercises: selectedWithNames,
    });

    const data = assessment.data as any;
    const nome = data?.nome ?? "Cliente";
    const objetivo = data?.objetivo ?? "Saúde Geral";

    const program = await this.repo.create({
      clientId: dto.clientId,
      assessmentId: dto.assessmentId,
      name: `${nome} · ${objetivo} · ${new Date().toLocaleDateString("pt-PT")}`,
      phases,
      selections: dto.selectedExercises.map((e) => ({
        exerciseId: e.exerciseId,
        pattern: e.pattern as MovementPattern,
        type: e.type as SelectionType,
      })),
    });

    return program;
  }

  async findById(id: string) {
    const program = await this.repo.findById(id);
    if (!program) throw new NotFoundException("Plano não encontrado");
    return program;
  }

  async findByClient(clientId: string) {
    return this.repo.findByClient(clientId);
  }

  async archive(id: string) {
    await this.findById(id);
    return this.repo.updateStatus(id, "ARCHIVED");
  }

  async delete(id: string) {
    await this.findById(id);
    return this.repo.delete(id);
  }

  async updateSelections(id: string, dto: UpdateSelectionsDto) {
    await this.findById(id);
    return this.repo.updateSelections(
      id,
      dto.selections.map((s) => ({
        exerciseId: s.exerciseId,
        pattern: s.pattern,
        type: s.type,
      })),
    );
  }

  async exportJson(id: string) {
    const program = await this.findById(id);
    return {
      exportedAt: new Date().toISOString(),
      program: {
        id: program.id,
        name: program.name,
        status: program.status,
        createdAt: program.createdAt,
        assessment: program.assessment,
        phases: program.phases,
        exerciseSelections: program.exerciseSelections,
      },
    };
  }
}
