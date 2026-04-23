import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { InvoicesRepository } from './invoices.repository';

jest.mock('stripe', () => {
  const mockCreate = jest.fn();
  const MockStripe = jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockCreate } },
  }));
  (MockStripe as any).__mockCreate = mockCreate;
  return { default: MockStripe };
});

describe('InvoicesService', () => {
  let service: InvoicesService;

  const mockRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    markOverdue: jest.fn(),
    summaryByClient: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: InvoicesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates an invoice converting dueDate string to Date', async () => {
      const dto = { clientId: 'c-1', amount: 50, description: 'Mensalidade', dueDate: '2026-05-01' };
      mockRepo.create.mockResolvedValue({ id: 'inv-1', ...dto });

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith({
        ...dto,
        dueDate: new Date('2026-05-01'),
      });
      expect(result).toMatchObject({ id: 'inv-1' });
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all invoices when no clientId given', async () => {
      mockRepo.findAll.mockResolvedValue([{ id: 'inv-1' }]);

      const result = await service.findAll();

      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
    });

    it('filters by clientId when provided', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      await service.findAll('c-1');

      expect(mockRepo.findAll).toHaveBeenCalledWith('c-1');
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns invoice when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'inv-1' });

      const result = await service.findById('inv-1');

      expect(result).toEqual({ id: 'inv-1' });
    });

    it('throws NotFoundException when invoice does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    beforeEach(() => {
      mockRepo.findById.mockResolvedValue({ id: 'inv-1', status: 'PENDING' });
    });

    it('sets paidAt to now when status changed to PAID', async () => {
      mockRepo.update.mockResolvedValue({ id: 'inv-1', status: 'PAID' });

      await service.update('inv-1', { status: 'PAID' });

      const call = mockRepo.update.mock.calls[0][1];
      expect(call.paidAt).toBeInstanceOf(Date);
      expect(call.status).toBe('PAID');
    });

    it('sets paidAt to null when status reset to PENDING', async () => {
      mockRepo.update.mockResolvedValue({ id: 'inv-1', status: 'PENDING' });

      await service.update('inv-1', { status: 'PENDING' });

      const call = mockRepo.update.mock.calls[0][1];
      expect(call.paidAt).toBeNull();
    });

    it('leaves paidAt undefined for other status changes', async () => {
      mockRepo.update.mockResolvedValue({ id: 'inv-1' });

      await service.update('inv-1', { amount: 100 });

      const call = mockRepo.update.mock.calls[0][1];
      expect(call.paidAt).toBeUndefined();
    });

    it('throws NotFoundException when invoice not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update('missing', { amount: 50 })).rejects.toThrow(NotFoundException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes invoice when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'inv-1' });
      mockRepo.delete.mockResolvedValue({ id: 'inv-1' });

      await service.delete('inv-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('inv-1');
    });

    it('throws NotFoundException when invoice not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── createPaymentLink ────────────────────────────────────────────────────

  describe('createPaymentLink', () => {
    it('throws NotFoundException when invoice not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.createPaymentLink('inv-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when invoice is already PAID', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'inv-1', status: 'PAID' });

      await expect(service.createPaymentLink('inv-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when STRIPE_SECRET_KEY is not set', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'inv-1', status: 'PENDING' });
      delete process.env.STRIPE_SECRET_KEY;

      await expect(service.createPaymentLink('inv-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── handleStripeWebhook ──────────────────────────────────────────────────

  describe('handleStripeWebhook', () => {
    it('returns { received: true } when STRIPE_WEBHOOK_SECRET is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const result = await service.handleStripeWebhook(Buffer.from(''), 'sig');

      expect(result).toEqual({ received: true });
    });
  });

  // ─── markOverdue / summaryByClient ────────────────────────────────────────

  describe('markOverdue', () => {
    it('delegates to repository', () => {
      mockRepo.markOverdue.mockResolvedValue(2);

      service.markOverdue();

      expect(mockRepo.markOverdue).toHaveBeenCalled();
    });
  });

  describe('summaryByClient', () => {
    it('delegates to repository with clientId', () => {
      mockRepo.summaryByClient.mockResolvedValue({ total: 100, paid: 50 });

      service.summaryByClient('c-1');

      expect(mockRepo.summaryByClient).toHaveBeenCalledWith('c-1');
    });
  });
});
