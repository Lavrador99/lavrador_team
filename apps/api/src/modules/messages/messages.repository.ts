import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { fromUserId: string; toUserId: string; content: string }) {
    return this.prisma.message.create({
      data,
      include: {
        fromUser: { select: { id: true, email: true, role: true } },
        toUser:   { select: { id: true, email: true, role: true } },
      },
    });
  }

  async findConversation(userA: string, userB: string, take = 50) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: userA, toUserId: userB },
          { fromUserId: userB, toUserId: userA },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take,
      include: {
        fromUser: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async markRead(toUserId: string, fromUserId: string) {
    return this.prisma.message.updateMany({
      where: { toUserId, fromUserId, read: false },
      data: { read: true },
    });
  }

  async countUnread(toUserId: string) {
    return this.prisma.message.count({ where: { toUserId, read: false } });
  }

  /** List of distinct conversation partners for a user */
  async findConversationPartners(userId: string) {
    const sent = await this.prisma.message.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true, createdAt: true },
      distinct: ['toUserId'],
      orderBy: { createdAt: 'desc' },
    });
    const received = await this.prisma.message.findMany({
      where: { toUserId: userId },
      select: { fromUserId: true, createdAt: true },
      distinct: ['fromUserId'],
      orderBy: { createdAt: 'desc' },
    });

    const partnerIds = new Set<string>();
    sent.forEach((m) => partnerIds.add(m.toUserId));
    received.forEach((m) => partnerIds.add(m.fromUserId));

    return this.prisma.user.findMany({
      where: { id: { in: Array.from(partnerIds) } },
      select: {
        id: true,
        email: true,
        role: true,
        client: { select: { name: true } },
      },
    });
  }
}
