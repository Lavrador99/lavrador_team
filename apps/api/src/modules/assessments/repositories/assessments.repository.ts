import { Injectable } from "@nestjs/common";
import { TrainingLevel } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AssessmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    level: TrainingLevel;
    data: Record<string, any>;
    flags: string[];
  }) {
    return this.prisma.assessment.create({ data });
  }

  async findByClient(clientId: string) {
    return this.prisma.assessment.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.assessment.findUnique({
      where: { id },
      include: {
        programs: {
          select: { id: true, name: true, status: true, createdAt: true },
        },
      },
    });
  }
}
