import { Injectable } from "@nestjs/common";
import { MovementPattern, ProgramStatus, SelectionType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProgramsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    assessmentId: string;
    name: string;
    phases: any;
    selections: {
      exerciseId: string;
      pattern: MovementPattern;
      type: SelectionType;
    }[];
  }) {
    return this.prisma.program.create({
      data: {
        clientId: data.clientId,
        assessmentId: data.assessmentId,
        name: data.name,
        phases: data.phases,
        exerciseSelections: {
          create: data.selections.map((s) => ({
            exerciseId: s.exerciseId,
            pattern: s.pattern,
            type: s.type,
          })),
        },
      },
      include: {
        exerciseSelections: { include: { exercise: true } },
        assessment: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.program.findUnique({
      where: { id },
      include: {
        exerciseSelections: { include: { exercise: true } },
        assessment: true,
        client: true,
      },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.program.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        exerciseSelections: { include: { exercise: true } },
        assessment: { select: { level: true, createdAt: true } },
      },
    });
  }

  async updateStatus(id: string, status: ProgramStatus) {
    return this.prisma.program.update({ where: { id }, data: { status } });
  }

  async delete(id: string) {
    return this.prisma.program.delete({ where: { id } });
  }

  async updateSelections(
    programId: string,
    selections: {
      exerciseId: string;
      pattern: MovementPattern;
      type: SelectionType;
    }[],
  ) {
    await this.prisma.exerciseSelection.deleteMany({ where: { programId } });
    return this.prisma.program.update({
      where: { id: programId },
      data: {
        exerciseSelections: {
          create: selections.map((s) => ({
            exerciseId: s.exerciseId,
            pattern: s.pattern,
            type: s.type,
          })),
        },
      },
      include: { exerciseSelections: { include: { exercise: true } } },
    });
  }
}
