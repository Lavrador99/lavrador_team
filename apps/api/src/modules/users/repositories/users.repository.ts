import { Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { client: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { client: true },
    });
  }

  async findAllClients() {
    return this.prisma.user.findMany({
      where: { role: Role.CLIENT },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateClient(
    userId: string,
    data: { name?: string; birthDate?: Date; phone?: string; notes?: string },
  ) {
    return this.prisma.client.update({
      where: { userId },
      data,
    });
  }
}
