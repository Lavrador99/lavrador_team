import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDetailById(clientId: string) {
    return this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: true,
        programs: {
          include: {
            exerciseSelections: { include: { exercise: true } },
            sessions: true,
          },
        },
        sessions: true,
        assessments: true,
      },
    });
  }
}
