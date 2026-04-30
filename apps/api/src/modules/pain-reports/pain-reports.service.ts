import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesService } from '../messages/messages.service';
import { PainIntensity } from '@prisma/client';

export interface CreatePainReportDto {
  bodyPart: string;
  intensity: PainIntensity;
  description?: string;
  workoutLogId?: string;
}

@Injectable()
export class PainReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly messages: MessagesService,
  ) {}

  private async resolveClientId(userId: string): Promise<string> {
    const client = await this.prisma.client.findFirst({ where: { userId } });
    if (!client) throw new NotFoundException('Client not found');
    return client.id;
  }

  async create(userId: string, dto: CreatePainReportDto) {
    const clientId = await this.resolveClientId(userId);

    const report = await this.prisma.painReport.create({
      data: { clientId, ...dto },
      include: { client: true },
    });

    // Alert PT via push notification and direct message
    const ptUser = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (ptUser) {
      const intensityLabel = { MILD: 'leve', MODERATE: 'moderada', SEVERE: 'severa' }[dto.intensity];
      const clientUser = await this.prisma.user.findUnique({ where: { id: report.client.userId } });

      await this.notifications.sendToUser(ptUser.id, {
        title: '⚠️ Reporte de dor',
        body: `${report.client.name}: dor ${intensityLabel} em ${dto.bodyPart}`,
        url: `/clients/${clientId}`,
      }).catch(() => {});

      if (clientUser) {
        const descPart = dto.description ? ` — "${dto.description}"` : '';
        await this.messages.send(
          clientUser.id,
          ptUser.id,
          `⚠️ Reporte de dor: ${intensityLabel} em ${dto.bodyPart}${descPart}`,
        ).catch(() => {});
      }
    }

    return report;
  }

  async findMy(userId: string) {
    const clientId = await this.resolveClientId(userId);
    return this.prisma.painReport.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async findForClient(clientId: string) {
    return this.prisma.painReport.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: string) {
    return this.prisma.painReport.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
  }
}
