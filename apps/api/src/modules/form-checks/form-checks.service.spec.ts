import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FormChecksService, CreateFormCheckDto, ReviewFormCheckDto } from './form-checks.service';

describe('FormChecksService', () => {
  let service: FormChecksService;

  const mockPrisma = {
    client: { findFirst: jest.fn() },
    formCheckRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: { findFirst: jest.fn() },
  };

  const mockNotifications = { sendToUser: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormChecksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<FormChecksService>(FormChecksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const userId = 'user-1';
    const clientId = 'client-1';
    const dto: CreateFormCheckDto = {
      exerciseName: 'Squat',
      videoUrl: 'https://example.com/video.mp4',
      notes: 'Check knee tracking',
    };

    it('creates a form check and notifies PT', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      const created = { id: 'fc-1', clientId, ...dto, client: { name: 'João', userId: 'user-1' } };
      mockPrisma.formCheckRequest.create.mockResolvedValue(created);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });

      const result = await service.create(userId, dto);

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({ where: { userId } });
      expect(mockPrisma.formCheckRequest.create).toHaveBeenCalledWith({
        data: { clientId, ...dto },
        include: { client: true },
      });
      expect(mockNotifications.sendToUser).toHaveBeenCalledWith(
        'pt-1',
        expect.objectContaining({ title: expect.stringContaining('análise de forma') }),
      );
      expect(result).toEqual(created);
    });

    it('throws NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('skips PT notification when no admin user exists', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      mockPrisma.formCheckRequest.create.mockResolvedValue({
        id: 'fc-1', clientId, ...dto, client: { name: 'João' },
      });
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await service.create(userId, dto);

      expect(mockNotifications.sendToUser).not.toHaveBeenCalled();
    });
  });

  // ─── findMy ───────────────────────────────────────────────────────────────

  describe('findMy', () => {
    const userId = 'user-1';
    const clientId = 'client-1';

    it('returns form checks for the resolved client', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      const checks = [{ id: 'fc-1', clientId, exerciseName: 'Squat' }];
      mockPrisma.formCheckRequest.findMany.mockResolvedValue(checks);

      const result = await service.findMy(userId);

      expect(mockPrisma.formCheckRequest.findMany).toHaveBeenCalledWith({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(checks);
    });

    it('throws NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.findMy(userId)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findPending ──────────────────────────────────────────────────────────

  describe('findPending', () => {
    it('returns all PENDING form checks with client data', async () => {
      const pending = [{ id: 'fc-1', status: 'PENDING', client: { name: 'João' } }];
      mockPrisma.formCheckRequest.findMany.mockResolvedValue(pending);

      const result = await service.findPending();

      expect(mockPrisma.formCheckRequest.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: { client: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(pending);
    });
  });

  // ─── findForClient ────────────────────────────────────────────────────────

  describe('findForClient', () => {
    it('returns form checks filtered by clientId', async () => {
      const clientId = 'client-1';
      const checks = [{ id: 'fc-1', clientId }];
      mockPrisma.formCheckRequest.findMany.mockResolvedValue(checks);

      const result = await service.findForClient(clientId);

      expect(mockPrisma.formCheckRequest.findMany).toHaveBeenCalledWith({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(checks);
    });
  });

  // ─── review ───────────────────────────────────────────────────────────────

  describe('review', () => {
    const id = 'fc-1';
    const ptUserId = 'pt-1';
    const dto: ReviewFormCheckDto = { ptFeedback: 'Knees caving — focus on external rotation' };

    it('sets status to REVIEWED, saves feedback, and notifies client', async () => {
      const updated = {
        id,
        status: 'REVIEWED',
        ptFeedback: dto.ptFeedback,
        reviewedAt: new Date(),
        exerciseName: 'Squat',
        client: { userId: 'user-2', name: 'João' },
      };
      mockPrisma.formCheckRequest.update.mockResolvedValue(updated);

      const result = await service.review(id, dto, ptUserId);

      expect(mockPrisma.formCheckRequest.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          ptFeedback: dto.ptFeedback,
          status: 'REVIEWED',
          reviewedAt: expect.any(Date),
        },
        include: { client: true },
      });
      expect(mockNotifications.sendToUser).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({ title: expect.stringContaining('Análise de forma') }),
      );
      expect(result).toEqual(updated);
    });
  });
});
