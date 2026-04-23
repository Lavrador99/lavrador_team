import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

// web-push is initialised at module load time using env vars.
// In test environment those vars are absent so webPushEnabled = false,
// meaning sendToUser / sendToAll return early without touching Prisma.
jest.mock('web-push', () => ({
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  },
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrisma = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  // ─── subscribe ────────────────────────────────────────────────────────────

  describe('subscribe', () => {
    const sub = {
      endpoint: 'https://push.example.com/sub-1',
      keys: { p256dh: 'key123', auth: 'auth456' },
    };

    it('upserts push subscription and returns { ok: true }', async () => {
      const result = await service.subscribe('user-1', sub);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true });
    });
  });

  // ─── unsubscribe ──────────────────────────────────────────────────────────

  describe('unsubscribe', () => {
    it('deletes push subscription and returns { ok: true }', async () => {
      const result = await service.unsubscribe('user-1', 'https://push.example.com/sub-1');

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true });
    });
  });

  // ─── sendToUser ───────────────────────────────────────────────────────────

  describe('sendToUser', () => {
    it('returns without querying Prisma when VAPID keys are not set', async () => {
      // webPushEnabled is false in test environment (no VAPID env vars)
      await service.sendToUser('user-1', { title: 'Test', body: 'Hello' });

      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  // ─── sendToAll ────────────────────────────────────────────────────────────

  describe('sendToAll', () => {
    it('returns without querying Prisma when VAPID keys are not set', async () => {
      await service.sendToAll({ title: 'Broadcast', body: 'Hello everyone' });

      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
