import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionsRepository } from '../repositories/sessions.repository';
import { CreateSessionDto, UpdateSessionDto, SessionFiltersDto } from '../types/sessions.dto';
import { SessionType } from '@prisma/client';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly repo: SessionsRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateSessionDto) {
    const session = await this.repo.create({
      clientId: dto.clientId,
      programId: dto.programId,
      scheduledAt: new Date(dto.scheduledAt),
      duration: dto.duration ?? 60,
      type: dto.type ?? SessionType.TRAINING,
      notes: dto.notes,
    });

    // Send email reminder (fire-and-forget)
    this.sendSessionEmail(dto.clientId, session).catch(() => {});

    return session;
  }

  private async sendSessionEmail(clientId: string, session: any) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { user: { select: { email: true } } },
    });
    const email = (client as any)?.user?.email;
    if (!email) return;

    const date = new Date(session.scheduledAt);
    await this.emailService.sendSessionReminder(email, {
      clientName: client!.name ?? 'Cliente',
      date: date.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' }),
      time: date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      duration: session.duration,
      type: session.type,
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
