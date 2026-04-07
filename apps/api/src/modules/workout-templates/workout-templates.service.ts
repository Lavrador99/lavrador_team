import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkoutTemplatesRepository } from './workout-templates.repository';

@Injectable()
export class WorkoutTemplatesService {
  constructor(private readonly repo: WorkoutTemplatesRepository) {}

  create(data: {
    name: string;
    description?: string;
    tags?: string[];
    blocks: any[];
    createdBy: string;
    isPublic?: boolean;
  }) {
    return this.repo.create(data);
  }

  findAll(createdBy?: string) {
    return this.repo.findAll(createdBy);
  }

  async findById(id: string) {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException('Template não encontrado');
    return t;
  }

  update(id: string, data: any) {
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.repo.delete(id);
  }
}
