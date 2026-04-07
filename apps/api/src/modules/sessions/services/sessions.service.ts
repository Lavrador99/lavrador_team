import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionsRepository } from '../repositories/sessions.repository';
import { CreateSessionDto, UpdateSessionDto, SessionFiltersDto } from '../types/sessions.dto';
import { SessionType } from '@prisma/client';

@Injectable()
export class SessionsService {
  constructor(private readonly repo: SessionsRepository) {}

  async create(dto: CreateSessionDto) {
    return this.repo.create({
      clientId: dto.clientId,
      programId: dto.programId,
      scheduledAt: new Date(dto.scheduledAt),
      duration: dto.duration ?? 60,
      type: dto.type ?? SessionType.TRAINING,
      notes: dto.notes,
    });
  }

  async findAll(filtersDto: SessionFiltersDto) {
    return this.repo.findAll({
      clientId: filtersDto.clientId,
      status: filtersDto.status,
      from: filtersDto.from ? new Date(filtersDto.from) : undefined,
      to: filtersDto.to ? new Date(filtersDto.to) : undefined,
    });
  }

  async findById(id: string) {
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Sessão não encontrada');
    return session;
  }

  async update(id: string, dto: UpdateSessionDto) {
    await this.findById(id);
    return this.repo.update(id, {
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      duration: dto.duration,
      type: dto.type,
      status: dto.status,
      notes: dto.notes,
      programId: dto.programId,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repo.delete(id);
  }

  async getUpcomingForClient(clientId: string) {
    return this.repo.findUpcomingForClient(clientId);
  }

  async getStatsForClient(clientId: string) {
    return this.repo.countByStatus(clientId);
  }
}
