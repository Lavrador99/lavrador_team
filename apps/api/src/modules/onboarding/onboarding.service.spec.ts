import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OnboardingService, OnboardingIntakeDto } from './onboarding.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AutomationsService } from '../automations/automations.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_temp_pass'),
}));

const validIntake: OnboardingIntakeDto = {
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: '910000000',
  birthDate: '1990-05-15',
  hasHeartCondition: false,
  hasChestPain: false,
  hasDizziness: false,
  hasJointProblem: false,
  hasHighBloodPressure: false,
  primaryGoal: 'Perda de peso',
  currentActivityLevel: 'LIGHT',
  trainingFrequencyPerWeek: 3,
  consentSigned: true,
  consentSignatureName: 'Maria Silva',
};

describe('OnboardingService', () => {
  let service: OnboardingService;

  const futureDate = new Date(Date.now() + 7 * 86400_000);
  const pastDate = new Date(Date.now() - 1000);

  const mockToken = {
    id: 'tok-1',
    token: 'valid-token-abc',
    ptUserId: 'pt-1',
    clientName: 'Maria Silva',
    clientEmail: 'maria@example.com',
    expiresAt: futureDate,
    usedAt: null,
    pt: { id: 'pt-1' },
  };

  const mockPrisma = {
    onboardingToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    client: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotifications = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockAutomations = {
    trigger: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AutomationsService, useValue: mockAutomations },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  // ─── generateToken ────────────────────────────────────────────────────────

  describe('generateToken', () => {
    it('creates token record and returns url + expiry', async () => {
      mockPrisma.onboardingToken.create.mockResolvedValue({
        token: 'tok-abc',
        expiresAt: futureDate,
      });

      const result = await service.generateToken('pt-1', 'João', 'joao@example.com');

      expect(mockPrisma.onboardingToken.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ ptUserId: 'pt-1' }),
      }));
      expect(result.token).toBe('tok-abc');
      expect(result.url).toContain('tok-abc');
      expect(result.expiresAt).toEqual(futureDate);
    });
  });

  // ─── getTokenInfo ─────────────────────────────────────────────────────────

  describe('getTokenInfo', () => {
    it('returns client name and email for valid token', async () => {
      mockPrisma.onboardingToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.getTokenInfo('valid-token-abc');

      expect(result).toEqual({ clientName: 'Maria Silva', clientEmail: 'maria@example.com' });
    });

    it('throws NotFoundException when token not found', async () => {
      mockPrisma.onboardingToken.findUnique.mockResolvedValue(null);

      await expect(service.getTokenInfo('bad-token')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when token already used', async () => {
      mockPrisma.onboardingToken.findUnique.mockResolvedValue({ ...mockToken, usedAt: new Date() });

      await expect(service.getTokenInfo('used-token')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token is expired', async () => {
      mockPrisma.onboardingToken.findUnique.mockResolvedValue({ ...mockToken, expiresAt: pastDate });

      await expect(service.getTokenInfo('expired-token')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── submitIntake ─────────────────────────────────────────────────────────

  describe('submitIntake', () => {
    const transactionResult = { user: { id: 'u-new' }, client: { id: 'c-new' }, flags: [] };

    beforeEach(() => {
      mockPrisma.onboardingToken.findUnique.mockResolvedValue(mockToken);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue({ id: 'u-new' }) },
          client: { create: jest.fn().mockResolvedValue({ id: 'c-new' }) },
          onboardingToken: { update: jest.fn().mockResolvedValue({}) },
        };
        await cb(tx);
        return transactionResult;
      });
    });

    it('creates user+client in transaction and returns clientId', async () => {
      const result = await service.submitIntake('valid-token-abc', validIntake);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.clientId).toBe('c-new');
      expect(result.message).toBeTruthy();
    });

    it('builds clinical flags from PAR-Q responses', async () => {
      const intakeWithFlags: OnboardingIntakeDto = {
        ...validIntake,
        hasHighBloodPressure: true,
        hasHeartCondition: true,
        currentActivityLevel: 'SEDENTARY',
      };

      const result = await service.submitIntake('valid-token-abc', intakeWithFlags);

      expect(result.flags).toContain('hipertensao');
      expect(result.flags).toContain('cardiovascular_risk');
      expect(result.flags).toContain('sedentario');
    });

    it('throws BadRequestException when token is already used', async () => {
      mockPrisma.onboardingToken.findUnique.mockResolvedValue({ ...mockToken, usedAt: new Date() });

      await expect(service.submitIntake('used-token', validIntake)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token is expired', async () => {
      mockPrisma.onboardingToken.findUnique.mockResolvedValue({ ...mockToken, expiresAt: pastDate });

      await expect(service.submitIntake('exp-token', validIntake)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when consent is not signed', async () => {
      await expect(
        service.submitIntake('valid-token-abc', { ...validIntake, consentSigned: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when email already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-existing' });

      await expect(service.submitIntake('valid-token-abc', validIntake)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when token not found', async () => {
      mockPrisma.onboardingToken.findUnique.mockResolvedValue(null);

      await expect(service.submitIntake('bad-token', validIntake)).rejects.toThrow(NotFoundException);
    });
  });
});
