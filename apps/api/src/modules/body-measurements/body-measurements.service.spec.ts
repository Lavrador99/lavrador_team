import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BodyMeasurementsService } from './body-measurements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BodyMeasurementsService', () => {
  let service: BodyMeasurementsService;

  const mockPrisma = {
    bodyMeasurement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BodyMeasurementsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BodyMeasurementsService>(BodyMeasurementsService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates measurement with provided recordedAt date', async () => {
      mockPrisma.bodyMeasurement.create.mockResolvedValue({ id: 'm-1' });

      await service.create({ clientId: 'c-1', recordedAt: '2026-04-01', peso: 75 });

      expect(mockPrisma.bodyMeasurement.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          clientId: 'c-1',
          recordedAt: new Date('2026-04-01'),
          peso: 75,
        }),
      }));
    });

    it('defaults recordedAt to now when not provided', async () => {
      mockPrisma.bodyMeasurement.create.mockResolvedValue({ id: 'm-2' });
      const before = new Date();

      await service.create({ clientId: 'c-1', peso: 74 });

      const call = mockPrisma.bodyMeasurement.create.mock.calls[0][0];
      const after = new Date();
      expect(call.data.recordedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(call.data.recordedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ─── findByClient ─────────────────────────────────────────────────────────

  describe('findByClient', () => {
    it('returns measurements ordered by recordedAt asc', async () => {
      mockPrisma.bodyMeasurement.findMany.mockResolvedValue([{ id: 'm-1' }, { id: 'm-2' }]);

      const result = await service.findByClient('c-1');

      expect(mockPrisma.bodyMeasurement.findMany).toHaveBeenCalledWith({
        where: { clientId: 'c-1' },
        orderBy: { recordedAt: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  // ─── findByUser ───────────────────────────────────────────────────────────

  describe('findByUser', () => {
    it('resolves userId to clientId and returns measurements', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.bodyMeasurement.findMany.mockResolvedValue([{ id: 'm-1' }]);

      const result = await service.findByUser('u-1');

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({ where: { userId: 'u-1' }, select: { id: true } });
      expect(result).toHaveLength(1);
    });

    it('returns empty array when user has no client profile', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const result = await service.findByUser('u-orphan');

      expect(mockPrisma.bodyMeasurement.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes measurement when it exists', async () => {
      mockPrisma.bodyMeasurement.findUnique.mockResolvedValue({ id: 'm-1' });
      mockPrisma.bodyMeasurement.delete.mockResolvedValue({ id: 'm-1' });

      await service.delete('m-1');

      expect(mockPrisma.bodyMeasurement.delete).toHaveBeenCalledWith({ where: { id: 'm-1' } });
    });

    it('throws NotFoundException when measurement not found', async () => {
      mockPrisma.bodyMeasurement.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
