import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateReadinessDto {
  sleep: number;    // 1-5
  stress: number;   // 1-5
  energy: number;   // 1-5
  soreness: number; // 1-5
  notes?: string;
}

@Injectable()
export class ReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveClientId(userId: string): Promise<string> {
    const client = await this.prisma.client.findFirst({ where: { userId } });
    if (!client) throw new NotFoundException('Client not found');
    return client.id;
  }

  async create(userId: string, dto: CreateReadinessDto) {
    const clientId = await this.resolveClientId(userId);
    return this.prisma.readinessLog.create({
      data: { clientId, ...dto },
    });
  }

  async findMy(userId: string, limit = 30) {
    const clientId = await this.resolveClientId(userId);
    return this.prisma.readinessLog.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async findForClient(clientId: string, limit = 30) {
    return this.prisma.readinessLog.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async todayScore(userId: string) {
    const clientId = await this.resolveClientId(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const log = await this.prisma.readinessLog.findFirst({
      where: { clientId, date: { gte: today } },
      orderBy: { date: 'desc' },
    });
    return log;
  }

  // Score 0-100 for "readiness to train" (high sleep+energy, low stress+soreness)
  static computeScore(log: { sleep: number; stress: number; energy: number; soreness: number }): number {
    const positive = (log.sleep + log.energy) / 2;          // 1-5
    const negative = (log.stress + log.soreness) / 2;       // 1-5
    return Math.round(((positive - negative + 4) / 8) * 100); // 0-100
  }
}
