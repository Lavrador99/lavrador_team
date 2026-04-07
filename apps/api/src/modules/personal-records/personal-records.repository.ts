import { Injectable } from '@nestjs/common';
import { RecordType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonalRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    exerciseId?: string;
    exerciseName: string;
    type: RecordType;
    value: number;
    notes?: string;
    recordedAt?: Date;
  }) {
    return this.prisma.personalRecord.create({ data });
  }

  async findByClient(clientId: string) {
    return this.prisma.personalRecord.findMany({
      where: { clientId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async findBestByClient(clientId: string) {
    // Retorna o melhor registo por exercício+tipo
    const records = await this.prisma.personalRecord.findMany({
      where: { clientId },
      orderBy: { value: 'desc' },
    });

    const best = new Map<string, typeof records[0]>();
    for (const r of records) {
      const key = `${r.exerciseName}::${r.type}`;
      if (!best.has(key)) best.set(key, r);
    }
    return [...best.values()].sort((a, b) =>
      a.exerciseName.localeCompare(b.exerciseName),
    );
  }

  async findHistoryForExercise(clientId: string, exerciseName: string) {
    return this.prisma.personalRecord.findMany({
      where: { clientId, exerciseName },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async delete(id: string) {
    return this.prisma.personalRecord.delete({ where: { id } });
  }
}
