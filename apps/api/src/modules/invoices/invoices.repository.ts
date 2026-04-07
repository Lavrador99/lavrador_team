import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    amount: number;
    currency?: string;
    description: string;
    dueDate: Date;
    notes?: string;
  }) {
    return this.prisma.invoice.create({ data: { ...data, currency: data.currency ?? 'EUR' } });
  }

  async findAll(clientId?: string) {
    return this.prisma.invoice.findMany({
      where: clientId ? { clientId } : undefined,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: {
    status?: InvoiceStatus;
    paidAt?: Date | null;
    amount?: number;
    description?: string;
    dueDate?: Date;
    notes?: string;
  }) {
    return this.prisma.invoice.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }

  async markOverdue() {
    const now = new Date();
    return this.prisma.invoice.updateMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      data: { status: 'OVERDUE' },
    });
  }

  async summaryByClient(clientId: string) {
    const invoices = await this.prisma.invoice.findMany({ where: { clientId } });
    const total = invoices.reduce((s, i) => s + i.amount, 0);
    const paid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
    const pending = invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0);
    const overdue = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.amount, 0);
    return { total, paid, pending, overdue, count: invoices.length };
  }
}
