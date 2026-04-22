import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateSessionPackageDto {
  clientId: string;
  name: string;
  totalSessions: number;
  priceEur: number;
  validUntil?: string;
}

@Injectable()
export class SessionPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionPackageDto) {
    return this.prisma.sessionPackage.create({
      data: {
        clientId:      dto.clientId,
        name:          dto.name,
        totalSessions: dto.totalSessions,
        priceEur:      dto.priceEur,
        validUntil:    dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  async findForClient(clientId: string) {
    return this.prisma.sessionPackage.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMy(userId: string) {
    const client = await this.prisma.client.findFirst({ where: { userId } });
    if (!client) return [];
    return this.findForClient(client.id);
  }

  async useSession(id: string) {
    const pkg = await this.prisma.sessionPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    return this.prisma.sessionPackage.update({
      where: { id },
      data: { usedSessions: Math.min(pkg.usedSessions + 1, pkg.totalSessions) },
    });
  }

  async delete(id: string) {
    return this.prisma.sessionPackage.delete({ where: { id } });
  }
}
