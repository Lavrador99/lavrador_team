import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkoutTemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    description?: string;
    tags?: string[];
    blocks: any[];
    createdBy: string;
    isPublic?: boolean;
  }) {
    return this.prisma.workoutTemplate.create({ data: { ...data, tags: data.tags ?? [] } });
  }

  async findAll(createdBy?: string) {
    return this.prisma.workoutTemplate.findMany({
      where: createdBy ? { OR: [{ createdBy }, { isPublic: true }] } : { isPublic: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.workoutTemplate.findUnique({ where: { id } });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    tags?: string[];
    blocks?: any[];
    isPublic?: boolean;
  }) {
    return this.prisma.workoutTemplate.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.workoutTemplate.delete({ where: { id } });
  }
}
