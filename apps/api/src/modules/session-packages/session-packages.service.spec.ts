import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionPackagesService, CreateSessionPackageDto } from './session-packages.service';

describe('SessionPackagesService', () => {
  let service: SessionPackagesService;

  const mockPrisma = {
    client: { findFirst: jest.fn() },
    sessionPackage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionPackagesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SessionPackagesService>(SessionPackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateSessionPackageDto = {
      clientId: 'client-1',
      name: 'Pack Mensal 12',
      totalSessions: 12,
      priceEur: 360,
    };

    it('creates a session package without validUntil', async () => {
      const created = { id: 'pkg-1', ...dto, usedSessions: 0 };
      mockPrisma.sessionPackage.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mockPrisma.sessionPackage.create).toHaveBeenCalledWith({
        data: {
          clientId: dto.clientId,
          name: dto.name,
          totalSessions: dto.totalSessions,
          priceEur: dto.priceEur,
          validUntil: undefined,
        },
      });
      expect(result).toEqual(created);
    });

    it('parses validUntil string to Date when provided', async () => {
      const dtoWithDate = { ...dto, validUntil: '2026-12-31' };
      mockPrisma.sessionPackage.create.mockResolvedValue({ id: 'pkg-1', ...dtoWithDate });

      await service.create(dtoWithDate);

      expect(mockPrisma.sessionPackage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ validUntil: new Date('2026-12-31') }),
      });
    });
  });

  // ─── findForClient ────────────────────────────────────────────────────────

  describe('findForClient', () => {
    it('returns packages for a client ordered by creation date desc', async () => {
      const packages = [{ id: 'pkg-1', clientId: 'client-1' }];
      mockPrisma.sessionPackage.findMany.mockResolvedValue(packages);

      const result = await service.findForClient('client-1');

      expect(mockPrisma.sessionPackage.findMany).toHaveBeenCalledWith({
        where: { clientId: 'client-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(packages);
    });
  });

  // ─── findMy ───────────────────────────────────────────────────────────────

  describe('findMy', () => {
    const userId = 'user-1';

    it('resolves clientId from userId and returns packages', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      const packages = [{ id: 'pkg-1' }];
      mockPrisma.sessionPackage.findMany.mockResolvedValue(packages);

      const result = await service.findMy(userId);

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toEqual(packages);
    });

    it('returns empty array when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      const result = await service.findMy(userId);

      expect(result).toEqual([]);
      expect(mockPrisma.sessionPackage.findMany).not.toHaveBeenCalled();
    });
  });

  // ─── useSession ───────────────────────────────────────────────────────────

  describe('useSession', () => {
    const id = 'pkg-1';

    it('increments usedSessions by 1', async () => {
      const pkg = { id, totalSessions: 10, usedSessions: 3 };
      mockPrisma.sessionPackage.findUnique.mockResolvedValue(pkg);
      const updated = { ...pkg, usedSessions: 4 };
      mockPrisma.sessionPackage.update.mockResolvedValue(updated);

      const result = await service.useSession(id);

      expect(mockPrisma.sessionPackage.update).toHaveBeenCalledWith({
        where: { id },
        data: { usedSessions: 4 },
      });
      expect(result).toEqual(updated);
    });

    it('does not exceed totalSessions (caps at total)', async () => {
      const pkg = { id, totalSessions: 10, usedSessions: 10 };
      mockPrisma.sessionPackage.findUnique.mockResolvedValue(pkg);
      mockPrisma.sessionPackage.update.mockResolvedValue({ ...pkg, usedSessions: 10 });

      await service.useSession(id);

      expect(mockPrisma.sessionPackage.update).toHaveBeenCalledWith({
        where: { id },
        data: { usedSessions: 10 },
      });
    });

    it('throws NotFoundException when package does not exist', async () => {
      mockPrisma.sessionPackage.findUnique.mockResolvedValue(null);

      await expect(service.useSession(id)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the package by id', async () => {
      mockPrisma.sessionPackage.delete.mockResolvedValue({ id: 'pkg-1' });

      await service.delete('pkg-1');

      expect(mockPrisma.sessionPackage.delete).toHaveBeenCalledWith({ where: { id: 'pkg-1' } });
    });
  });
});
