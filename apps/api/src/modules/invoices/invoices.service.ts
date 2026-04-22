import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesRepository } from './invoices.repository';
import Stripe from 'stripe';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly repo: InvoicesRepository) {}

  async createPaymentLink(invoiceId: string) {
    const invoice = await this.repo.findById(invoiceId);
    if (!invoice) throw new NotFoundException('Factura não encontrada');
    if (!['PENDING', 'OVERDUE'].includes(invoice.status)) {
      throw new BadRequestException('Só é possível criar link de pagamento para facturas pendentes ou em atraso');
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('Stripe não configurado (STRIPE_SECRET_KEY em falta)');
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' });
    const appUrl = process.env.APP_URL ?? process.env.PLATFORM_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: { name: invoice.description },
          unit_amount: Math.round(invoice.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/client/invoices?paid=true`,
      cancel_url: `${appUrl}/client/invoices`,
      metadata: { invoiceId },
    });

    await this.repo.update(invoiceId, {
      stripeCheckoutUrl: session.url ?? undefined,
      stripeSessionId: session.id,
    });

    return { checkoutUrl: session.url };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET não configurado');
      return { received: true };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

    let event: ReturnType<typeof stripe.webhooks.constructEvent>;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook inválido: ${(err as Error).message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: Record<string, string> | null };
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        await this.repo.update(invoiceId, {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        });
        this.logger.log(`Factura ${invoiceId} marcada como PAGA via Stripe`);
      }
    }

    return { received: true };
  }

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
