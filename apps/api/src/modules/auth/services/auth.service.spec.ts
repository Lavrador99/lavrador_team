import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('mock_token'),
  };

  const mockEmail = {
    sendWelcome: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      const user = { id: 'u-1', email: 'pt@example.com', passwordHash: 'hash', role: Role.PT };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'pt@example.com', password: 'pass' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'none@example.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1', passwordHash: 'hash', role: Role.PT });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'pt@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates a CLIENT user and returns tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u-2', email: 'new@example.com', role: Role.CLIENT });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register({ email: 'new@example.com', password: 'pass', name: 'Ana' } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: Role.CLIENT }),
      }));
      expect(result).toHaveProperty('accessToken');
    });

    it('throws ConflictException when email already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1' });

      await expect(service.register({ email: 'dup@example.com', password: 'pass', name: 'X' } as any))
        .rejects.toThrow(ConflictException);
    });
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('rotates refresh token and returns new tokens', async () => {
      const stored = {
        id: 'rt-1',
        token: 'old_token',
        expiresAt: new Date(Date.now() + 86400_000),
        user: { id: 'u-1', email: 'u@example.com', role: Role.CLIENT },
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(stored);
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('old_token');

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws ForbiddenException when token not found', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('bad_token')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when token is expired', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        expiresAt: new Date(Date.now() - 1000), // in the past
        user: { id: 'u-1', email: 'u@example.com', role: Role.CLIENT },
      });

      await expect(service.refresh('expired_token')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('deletes all refresh tokens for user', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await service.logout('u-1');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u-1' } });
    });
  });

  // ─── createUser ───────────────────────────────────────────────────────────

  describe('createUser', () => {
    const dto = { email: 'admin@example.com', password: 'pass', role: 'CLIENT', name: 'Maria' };

    it('creates CLIENT user with client profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u-3', email: dto.email, role: Role.CLIENT, client: {} });

      const result = await service.createUser(dto);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          client: expect.objectContaining({ create: expect.objectContaining({ name: 'Maria' }) }),
        }),
      }));
      expect(result).toMatchObject({ email: dto.email });
    });

    it('creates ADMIN user without client profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u-4', email: 'admin@example.com', role: Role.ADMIN });

      await service.createUser({ ...dto, role: 'ADMIN' });

      const call = mockPrisma.user.create.mock.calls[0][0];
      expect(call.data).not.toHaveProperty('client');
    });

    it('throws ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1' });

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });
  });
});
