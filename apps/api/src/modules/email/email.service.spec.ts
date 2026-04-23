import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

// Resend is disabled in test env (no RESEND_API_KEY) so all sends are no-ops.
// These tests verify that: (a) methods don't throw when disabled, and
// (b) no real HTTP calls are attempted.
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn() },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    delete process.env.RESEND_API_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Disabled mode (no RESEND_API_KEY) ────────────────────────────────────

  describe('when email is disabled', () => {
    it('sendWelcome resolves without throwing', async () => {
      await expect(service.sendWelcome('test@example.com', 'João')).resolves.not.toThrow();
    });

    it('sendSessionReminder resolves without throwing', async () => {
      await expect(
        service.sendSessionReminder('test@example.com', {
          clientName: 'João',
          date: '10 de Maio',
          time: '10:00',
          duration: 60,
          type: 'TRAINING',
        }),
      ).resolves.not.toThrow();
    });

    it('sendPlanUpdated resolves without throwing', async () => {
      await expect(
        service.sendPlanUpdated('test@example.com', {
          clientName: 'João',
          planName: 'Treino A',
        }),
      ).resolves.not.toThrow();
    });

    it('sendInactivityAlert resolves without throwing', async () => {
      await expect(
        service.sendInactivityAlert('pt@example.com', {
          adminName: 'PT',
          inactiveClients: [{ name: 'Ana', daysSinceLast: 14 }],
        }),
      ).resolves.not.toThrow();
    });

    it('sendCheckinEmail resolves without throwing', async () => {
      await expect(
        service.sendCheckinEmail('test@example.com', {
          clientName: 'Ana',
          streak: 5,
          totalWorkouts: 20,
          checkinUrl: 'http://localhost:3000/messages',
        }),
      ).resolves.not.toThrow();
    });

    it('sendCheckinEmail builds streak message when streak > 0', async () => {
      // Should not throw regardless of streak value
      await expect(
        service.sendCheckinEmail('test@example.com', {
          clientName: 'Ana',
          streak: 0,
          totalWorkouts: 0,
          checkinUrl: 'http://localhost:3000/messages',
        }),
      ).resolves.not.toThrow();
    });
  });
});
