import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PainReportsService, CreatePainReportDto } from './pain-reports.service';

describe('PainReportsService', () => {
  let service: PainReportsService;
  let prisma: jest.Mocked<PrismaService>;
  let notifications: jest.Mocked<NotificationsService>;

  const mockPrisma = {
    client: {
      findFirst: jest.fn(),
    },
    painReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  };

  const mockNotifications = {
    sendToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PainReportsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<PainReportsService>(PainReportsService);
    prisma = module.get(PrismaService);
    notifications = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    const userId = 'user-1';
    const clientId = 'client-1';
    const dto: CreatePainReportDto = {
      bodyPart: 'left knee',
      intensity: 'MODERATE',
      description: 'Pain during squats',
    };

    it('creates a pain report and notifies the PT', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      const report = {
        id: 'report-1',
        clientId,
        ...dto,
        client: { name: 'John Doe' },
      };
      mockPrisma.painReport.create.mockResolvedValue(report);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      const result = await service.create(userId, dto);

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({ where: { userId } });
      expect(mockPrisma.painReport.create).toHaveBeenCalledWith({
        data: { clientId, ...dto },
        include: { client: true },
      });
      expect(mockNotifications.sendToUser).toHaveBeenCalledWith(
        'pt-1',
        expect.objectContaining({
          title: expect.stringContaining('dor'),
          body: expect.stringContaining('John Doe'),
        }),
      );
      expect(result).toEqual(report);
    });

    it('does not throw when PT notification fails', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      mockPrisma.painReport.create.mockResolvedValue({
        id: 'report-1',
        clientId,
        ...dto,
        client: { name: 'John Doe' },
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });
      mockNotifications.sendToUser.mockRejectedValue(new Error('Push failed'));

      await expect(service.create(userId, dto)).resolves.toBeDefined();
    });

    it('skips notification when no PT user found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      mockPrisma.painReport.create.mockResolvedValue({
        id: 'report-1',
        clientId,
        ...dto,
        client: { name: 'John' },
      });
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await service.create(userId, dto);

      expect(mockNotifications.sendToUser).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('uses correct intensity label in notification body (SEVERE)', async () => {
      const severeDto: CreatePainReportDto = { bodyPart: 'shoulder', intensity: 'SEVERE' };
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      mockPrisma.painReport.create.mockResolvedValue({
        id: 'report-1',
        clientId,
        ...severeDto,
        client: { name: 'Jane' },
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      await service.create(userId, severeDto);

      expect(mockNotifications.sendToUser).toHaveBeenCalledWith(
        'pt-1',
        expect.objectContaining({ body: expect.stringContaining('severa') }),
      );
    });
  });

  // ─── findMy ──────────────────────────────────────────────────────────────

  describe('findMy', () => {
    const userId = 'user-1';
    const clientId = 'client-1';

    it('returns pain reports for the resolved client', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      const reports = [{ id: 'r1', clientId, bodyPart: 'knee', intensity: 'MILD' }];
      mockPrisma.painReport.findMany.mockResolvedValue(reports);

      const result = await service.findMy(userId);

      expect(mockPrisma.painReport.findMany).toHaveBeenCalledWith({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      expect(result).toEqual(reports);
    });

    it('throws NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.findMy(userId)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findForClient ────────────────────────────────────────────────────────

  describe('findForClient', () => {
    it('returns all pain reports for the given clientId', async () => {
      const clientId = 'client-1';
      const reports = [{ id: 'r1', clientId }];
      mockPrisma.painReport.findMany.mockResolvedValue(reports);

      const result = await service.findForClient(clientId);

      expect(mockPrisma.painReport.findMany).toHaveBeenCalledWith({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(reports);
    });
  });

  // ─── resolve ─────────────────────────────────────────────────────────────

  describe('resolve', () => {
    it('sets resolvedAt on the pain report', async () => {
      const id = 'report-1';
      const updated = { id, resolvedAt: new Date() };
      mockPrisma.painReport.update.mockResolvedValue(updated);

      const result = await service.resolve(id);

      expect(mockPrisma.painReport.update).toHaveBeenCalledWith({
        where: { id },
        data: { resolvedAt: expect.any(Date) },
      });
      expect(result).toEqual(updated);
    });
  });
});
