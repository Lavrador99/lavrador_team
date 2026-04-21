import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateFormCheckDto {
  exerciseName: string;
  videoUrl: string;
  notes?: string;
}

export interface ReviewFormCheckDto {
  ptFeedback: string;
}

@Injectable()
export class FormChecksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async resolveClientId(userId: string): Promise<string> {
    const client = await this.prisma.client.findFirst({ where: { userId } });
    if (!client) throw new NotFoundException('Client not found');
    return client.id;
  }

  async create(userId: string, dto: CreateFormCheckDto) {
    const clientId = await this.resolveClientId(userId);

    const check = await this.prisma.formCheckRequest.create({
      data: { clientId, ...dto },
      include: { client: true },
    });

    // Notify PT
    const ptUser = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (ptUser) {
      await this.notifications.sendToUser(ptUser.id, {
        title: '🎥 Pedido de análise de forma',
        body: `${check.client.name}: ${dto.exerciseName}`,
        url: `/clients/${clientId}`,
      }).catch(() => {});
    }

    return check;
  }

  async findMy(userId: string) {
    const clientId = await this.resolveClientId(userId);
    return this.prisma.formCheckRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.formCheckRequest.findMany({
      where: { status: 'PENDING' },
      include: { client: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findForClient(clientId: string) {
    return this.prisma.formCheckRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(id: string, dto: ReviewFormCheckDto, ptUserId: string) {
    const check = await this.prisma.formCheckRequest.update({
      where: { id },
      data: {
        ptFeedback: dto.ptFeedback,
        status: 'REVIEWED',
        reviewedAt: new Date(),
      },
      include: { client: true },
    });

    // Notify client
    await this.notifications.sendToUser(check.client.userId, {
      title: '✅ Análise de forma disponível',
      body: `O teu PT analisou o teu vídeo de ${check.exerciseName}`,
      url: '/client/form-checks',
    }).catch(() => {});

    return check;
  }
}
