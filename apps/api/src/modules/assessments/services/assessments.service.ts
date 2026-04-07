import { Injectable, NotFoundException } from '@nestjs/common';
import { AssessmentsRepository } from '../repositories/assessments.repository';
import { CreateAssessmentDto } from '../types/assessments.dto';
import { classifyAssessment } from './assessment-classifier';

@Injectable()
export class AssessmentsService {
  constructor(private readonly repo: AssessmentsRepository) {}

  async create(dto: CreateAssessmentDto) {
    const classification = classifyAssessment(dto.data as any);

    return this.repo.create({
      clientId: dto.clientId,
      level: classification.level,
      data: {
        ...dto.data,
        _computed: {
          fcmax: classification.fcmax,
          karvonenZones: classification.karvonenZones,
        },
      },
      flags: classification.flags,
    });
  }

  async findByClient(clientId: string) {
    return this.repo.findByClient(clientId);
  }

  async findById(id: string) {
    const assessment = await this.repo.findById(id);
    if (!assessment) throw new NotFoundException('Avaliação não encontrada');
    return assessment;
  }
}
