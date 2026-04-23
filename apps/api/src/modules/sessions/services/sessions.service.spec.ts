import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from '../repositories/sessions.repository';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SessionsService', () => {
  let service: SessionsService;

  const mockRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUpcomingForClient: jest.fn(),
    countByStatus: jest.fn(),
  };

  const mockEmail = {
    sendSessionReminder: jest.fn().mockResolvedValue(undefined),
  };

  const mockPrisma = {
    client: { findUnique: jest.fn() },
    session: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: SessionsRepository, useValue: mockRepo },
        { provide: EmailService, useValue: mockEmail },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      clientId: 'c-1',
      scheduledAt: '2026-05-10T10:00:00Z',
      duration: 60,
    };

    it('creates a session and returns it', async () => {
      const session = { id: 's-1', clientId: 'c-1', scheduledAt: new Date(dto.scheduledAt) };
      mockRepo.create.mockResolvedValue(session);
      mockPrisma.client.findUnique.mockResolvedValue(null); // fire-and-forget, no email

      const result = await service.create(dto as any);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 'c-1',
        scheduledAt: new Date(dto.scheduledAt),
        duration: 60,
      }));
      expect(result).toEqual(session);
    });

    it('applies default duration of 60 when not provided', async () => {
      mockRepo.create.mockResolvedValue({ id: 's-1' });
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await service.create({ clientId: 'c-1', scheduledAt: '2026-05-10T10:00:00Z' } as any);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ duration: 60 }));
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('passes filters to repository converting date strings to Dates', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      await service.findAll({ clientId: 'c-1', from: '2026-01-01', to: '2026-12-31' } as any);

      expect(mockRepo.findAll).toHaveBeenCalledWith({
        clientId: 'c-1',
        status: undefined,
        from: new Date('2026-01-01'),
        to: new Date('2026-12-31'),
      });
    });

    it('passes undefined for missing date filters', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      await service.findAll({} as any);

      expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({
        from: undefined,
        to: undefined,
      }));
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns session when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 's-1' });

      const result = await service.findById('s-1');

      expect(result).toEqual({ id: 's-1' });
    });

    it('throws NotFoundException when session does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates session when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 's-1' });
      mockRepo.update.mockResolvedValue({ id: 's-1', status: 'COMPLETED' });

      const result = await service.update('s-1', { status: 'COMPLETED' } as any);

      expect(mockRepo.update).toHaveBeenCalledWith('s-1', expect.objectContaining({ status: 'COMPLETED' }));
      expect(result).toMatchObject({ status: 'COMPLETED' });
    });

    it('converts scheduledAt string to Date', async () => {
      mockRepo.findById.mockResolvedValue({ id: 's-1' });
      mockRepo.update.mockResolvedValue({ id: 's-1' });

      await service.update('s-1', { scheduledAt: '2026-06-01T09:00:00Z' } as any);

      expect(mockRepo.update).toHaveBeenCalledWith('s-1', expect.objectContaining({
        scheduledAt: new Date('2026-06-01T09:00:00Z'),
      }));
    });

    it('throws NotFoundException when session not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update('missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes session when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 's-1' });
      mockRepo.delete.mockResolvedValue({ id: 's-1' });

      await service.remove('s-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('s-1');
    });

    it('throws NotFoundException when session not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getUpcomingForClient / getStatsForClient ─────────────────────────────

  describe('getUpcomingForClient', () => {
    it('delegates to repository', async () => {
      mockRepo.findUpcomingForClient.mockResolvedValue([{ id: 's-1' }]);

      const result = await service.getUpcomingForClient('c-1');

      expect(mockRepo.findUpcomingForClient).toHaveBeenCalledWith('c-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getStatsForClient', () => {
    it('delegates to repository countByStatus', async () => {
      mockRepo.countByStatus.mockResolvedValue({ SCHEDULED: 3, COMPLETED: 10 });

      const result = await service.getStatsForClient('c-1');

      expect(mockRepo.countByStatus).toHaveBeenCalledWith('c-1');
      expect(result).toMatchObject({ SCHEDULED: 3 });
    });
  });

  // ─── exportAsIcal ─────────────────────────────────────────────────────────

  describe('exportAsIcal', () => {
    it('returns a valid iCal string with VCALENDAR and VEVENT blocks', async () => {
      mockPrisma.session.findMany.mockResolvedValue([
        {
          id: 'sess-1',
          scheduledAt: new Date('2026-05-10T10:00:00Z'),
          durationMin: 60,
          notes: 'Treino de força',
          client: { name: 'João Silva' },
        },
      ]);

      const result = await service.exportAsIcal();

      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('BEGIN:VEVENT');
      expect(result).toContain('END:VEVENT');
      expect(result).toContain('END:VCALENDAR');
      expect(result).toContain('João Silva');
    });

    it('returns valid iCal with empty sessions list', async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);

      const result = await service.exportAsIcal();

      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('END:VCALENDAR');
      expect(result).not.toContain('BEGIN:VEVENT');
    });
  });
});
