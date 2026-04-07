import { Injectable } from "@nestjs/common";

import { SessionStatus, SessionType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

interface SessionFilters {
  clientId?: string;
  status?: SessionStatus;
  from?: Date;
  to?: Date;
}

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    programId?: string;
    scheduledAt: Date;
    duration: number;
    type: SessionType;
    notes?: string;
  }) {
    return this.prisma.session.create({
      data,
      include: {
        client: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(filters: SessionFilters = {}) {
    const { clientId, status, from, to } = filters;
    return this.prisma.session.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(status && { status }),
        ...(from || to
          ? {
              scheduledAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
              },
            }
          : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  async findById(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });
  }

  async update(
    id: string,
    data: {
      scheduledAt?: Date;
      duration?: number;
      type?: SessionType;
      status?: SessionStatus;
      notes?: string;
      programId?: string;
    },
  ) {
    return this.prisma.session.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.session.delete({ where: { id } });
  }

  async findUpcomingForClient(clientId: string, limit = 5) {
    return this.prisma.session.findMany({
      where: {
        clientId,
        status: SessionStatus.SCHEDULED,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });
  }

  async countByStatus(clientId: string) {
    return this.prisma.session.groupBy({
      by: ["status"],
      where: { clientId },
      _count: { id: true },
    });
  }
}
