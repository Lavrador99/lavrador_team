import { Injectable, NotFoundException } from '@nestjs/common';
import { RecordType } from '@prisma/client';
import { PersonalRecordsRepository } from './personal-records.repository';

@Injectable()
export class PersonalRecordsService {
  constructor(private readonly repo: PersonalRecordsRepository) {}

  create(dto: {
    clientId: string;
    exerciseId?: string;
    exerciseName: string;
    type: RecordType;
    value: number;
    notes?: string;
    recordedAt?: string;
  }) {
    return this.repo.create({
      ...dto,
      recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : undefined,
    });
  }

  getByClient(clientId: string) {
    return this.repo.findByClient(clientId);
  }

  getBestByClient(clientId: string) {
    return this.repo.findBestByClient(clientId);
  }

  getHistory(clientId: string, exerciseName: string) {
    return this.repo.findHistoryForExercise(clientId, exerciseName);
  }

  async delete(id: string) {
    const record = await this.repo['prisma'].personalRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Registo não encontrado');
    return this.repo.delete(id);
  }
}
