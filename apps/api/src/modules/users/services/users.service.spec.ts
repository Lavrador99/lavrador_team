import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from '../repositories/users.repository';
import { ClientsRepository } from '../repositories/clients.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepo = {
    findById: jest.fn(),
    findAllClients: jest.fn(),
    updateClient: jest.fn(),
  };

  const mockClientsRepo = {
    findDetailById: jest.fn(),
  };

  const mockPrisma = {
    session: { findMany: jest.fn() },
    assessment: { findMany: jest.fn(), findFirst: jest.fn() },
    workoutLog: { findMany: jest.fn() },
    personalRecord: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: ClientsRepository, useValue: mockClientsRepo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ─── getMe ────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns user without passwordHash', async () => {
      mockUsersRepo.findById.mockResolvedValue({
        id: 'u-1',
        email: 'pt@example.com',
        passwordHash: 'secret',
      });

      const result = await service.getMe('u-1');

      expect(result).toEqual({ id: 'u-1', email: 'pt@example.com' });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException when user not found', async () => {
      mockUsersRepo.findById.mockResolvedValue(null);

      await expect(service.getMe('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getAllClients ─────────────────────────────────────────────────────────

  describe('getAllClients', () => {
    it('strips passwordHash from every user', async () => {
      mockUsersRepo.findAllClients.mockResolvedValue([
        { id: 'u-1', email: 'a@a.com', passwordHash: 'h1' },
        { id: 'u-2', email: 'b@b.com', passwordHash: 'h2' },
      ]);

      const result = await service.getAllClients();

      expect(result).toHaveLength(2);
      result.forEach((u) => expect(u).not.toHaveProperty('passwordHash'));
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('updates profile when user exists', async () => {
      mockUsersRepo.findById.mockResolvedValue({ id: 'u-1' });
      mockUsersRepo.updateClient.mockResolvedValue({ id: 'u-1', name: 'João' });

      const result = await service.updateProfile('u-1', { name: 'João' } as any);

      expect(mockUsersRepo.updateClient).toHaveBeenCalledWith('u-1', expect.objectContaining({ name: 'João' }));
      expect(result).toMatchObject({ name: 'João' });
    });

    it('converts birthDate string to Date', async () => {
      mockUsersRepo.findById.mockResolvedValue({ id: 'u-1' });
      mockUsersRepo.updateClient.mockResolvedValue({ id: 'u-1' });

      await service.updateProfile('u-1', { birthDate: '1990-01-01' } as any);

      expect(mockUsersRepo.updateClient).toHaveBeenCalledWith('u-1', expect.objectContaining({
        birthDate: new Date('1990-01-01'),
      }));
    });

    it('throws NotFoundException when user not found', async () => {
      mockUsersRepo.findById.mockResolvedValue(null);

      await expect(service.updateProfile('missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getClientDetail ──────────────────────────────────────────────────────

  describe('getClientDetail', () => {
    it('delegates to clients repository', async () => {
      mockClientsRepo.findDetailById.mockResolvedValue({ id: 'c-1' });

      const result = await service.getClientDetail('c-1');

      expect(mockClientsRepo.findDetailById).toHaveBeenCalledWith('c-1');
      expect(result).toEqual({ id: 'c-1' });
    });
  });

  // ─── getClientTimeline ────────────────────────────────────────────────────

  describe('getClientTimeline', () => {
    beforeEach(() => {
      mockPrisma.session.findMany.mockResolvedValue([]);
      mockPrisma.assessment.findMany.mockResolvedValue([]);
      mockPrisma.workoutLog.findMany.mockResolvedValue([]);
      mockPrisma.personalRecord.findMany.mockResolvedValue([]);
    });

    it('returns sorted timeline events within limit', async () => {
      mockPrisma.session.findMany.mockResolvedValue([
        { id: 's-1', scheduledAt: new Date('2026-04-20'), type: 'TRAINING', status: 'COMPLETED', notes: null },
      ]);
      mockPrisma.personalRecord.findMany.mockResolvedValue([
        { id: 'pr-1', exerciseName: 'Squat', type: 'WEIGHT_KG', value: 120, recordedAt: new Date('2026-04-22') },
      ]);

      const result = await service.getClientTimeline('c-1', 30);

      expect(result.length).toBeGreaterThan(0);
      // Most recent event first
      expect(new Date(result[0].date).getTime()).toBeGreaterThanOrEqual(new Date(result[result.length - 1].date).getTime());
    });

    it('returns empty array when client has no activity', async () => {
      const result = await service.getClientTimeline('c-1');

      expect(result).toEqual([]);
    });
  });

  // ─── getClientClinicalSummary ─────────────────────────────────────────────

  describe('getClientClinicalSummary', () => {
    it('returns null when no assessment exists', async () => {
      mockPrisma.assessment.findFirst.mockResolvedValue(null);

      const result = await service.getClientClinicalSummary('c-1');

      expect(result).toBeNull();
    });

    it('returns clinical summary from latest assessment', async () => {
      mockPrisma.assessment.findFirst.mockResolvedValue({
        id: 'a-1',
        createdAt: new Date('2026-01-01'),
        level: 'INTERMEDIATE',
        flags: ['hipertensao'],
        data: {
          pessoal: { PAS: 130, PAD: 85 },
          desporto: { lesoes: 'Joelho direito', objetivo: 'Hipertrofia', diasSemana: 3 },
        },
      });

      const result = await service.getClientClinicalSummary('c-1');

      expect(result).toMatchObject({
        level: 'INTERMEDIATE',
        flags: ['hipertensao'],
        pas: 130,
        pad: 85,
        lesoes: 'Joelho direito',
        objetivo: 'Hipertrofia',
        diasSemana: 3,
      });
    });

    it('returns null for missing nested fields', async () => {
      mockPrisma.assessment.findFirst.mockResolvedValue({
        id: 'a-1',
        createdAt: new Date(),
        level: 'BEGINNER',
        flags: [],
        data: {},
      });

      const result = await service.getClientClinicalSummary('c-1');

      expect(result!.pas).toBeNull();
      expect(result!.lesoes).toBeNull();
    });
  });
});
