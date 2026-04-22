import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateContractDto {
  clientId: string;
  title: string;
  content: string;
}

export interface SignContractDto {
  signatureName: string;
}

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto) {
    return this.prisma.digitalContract.create({ data: dto });
  }

  async findForClient(clientId: string) {
    return this.prisma.digitalContract.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMy(userId: string) {
    const client = await this.prisma.client.findFirst({ where: { userId } });
    if (!client) return [];
    return this.findForClient(client.id);
  }

  async sign(id: string, userId: string, dto: SignContractDto) {
    const client = await this.prisma.client.findFirst({ where: { userId } });
    if (!client) throw new NotFoundException('Client not found');

    const contract = await this.prisma.digitalContract.findFirst({
      where: { id, clientId: client.id },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.signedAt) throw new BadRequestException('Already signed');

    return this.prisma.digitalContract.update({
      where: { id },
      data: { signedAt: new Date(), signatureName: dto.signatureName },
    });
  }

  async delete(id: string) {
    return this.prisma.digitalContract.delete({ where: { id } });
  }
}
