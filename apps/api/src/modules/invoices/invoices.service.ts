import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesRepository } from './invoices.repository';

@Injectable()
export class InvoicesService {
  constructor(private readonly repo: InvoicesRepository) {}

  create(data: {
    clientId: string;
    amount: number;
    currency?: string;
    description: string;
    dueDate: string;
    notes?: string;
  }) {
    return this.repo.create({ ...data, dueDate: new Date(data.dueDate) });
  }

  findAll(clientId?: string) {
    return this.repo.findAll(clientId);
  }

  async findById(id: string) {
    const inv = await this.repo.findById(id);
    if (!inv) throw new NotFoundException('Factura não encontrada');
    return inv;
  }

  async update(id: string, data: {
    status?: string;
    amount?: number;
    description?: string;
    dueDate?: string;
    notes?: string;
  }) {
    await this.findById(id);
    const paidAt = data.status === 'PAID' ? new Date() : data.status === 'PENDING' ? null : undefined;
    return this.repo.update(id, {
      status: data.status as InvoiceStatus | undefined,
      paidAt,
      amount: data.amount,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      notes: data.notes,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.repo.delete(id);
  }

  markOverdue() {
    return this.repo.markOverdue();
  }

  summaryByClient(clientId: string) {
    return this.repo.summaryByClient(clientId);
  }
}
