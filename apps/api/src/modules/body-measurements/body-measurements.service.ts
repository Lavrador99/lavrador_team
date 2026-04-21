import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateBodyMeasurementDto {
  clientId: string;
  recordedAt?: string;
  peso?: number;
  altura?: number;
  pctGordura?: number;
  massaMagra?: number;
  cc?: number;
  cq?: number;
  cBraco?: number;
  cCoxa?: number;
  fcRep?: number;
  pas?: number;
  pad?: number;
  notes?: string;
}

@Injectable()
export class BodyMeasurementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBodyMeasurementDto) {
    return this.prisma.bodyMeasurement.create({
      data: {
        clientId:   dto.clientId,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
        peso:       dto.peso,
        altura:     dto.altura,
        pctGordura: dto.pctGordura,
        massaMagra: dto.massaMagra,
        cc:         dto.cc,
        cq:         dto.cq,
        cBraco:     dto.cBraco,
        cCoxa:      dto.cCoxa,
        fcRep:      dto.fcRep,
        pas:        dto.pas,
        pad:        dto.pad,
        notes:      dto.notes,
      },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.bodyMeasurement.findMany({
      where: { clientId },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async findByUser(userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId }, select: { id: true } });
    if (!client) return [];
    return this.findByClient(client.id);
  }

  async delete(id: string) {
    const m = await this.prisma.bodyMeasurement.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Medição não encontrada');
    await this.prisma.bodyMeasurement.delete({ where: { id } });
  }
}
