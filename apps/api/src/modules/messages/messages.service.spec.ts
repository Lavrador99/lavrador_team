import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockRepo = {
    create: jest.fn(),
    findConversation: jest.fn(),
    markRead: jest.fn(),
    countUnread: jest.fn(),
    findConversationPartners: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: MessagesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  // ─── send ─────────────────────────────────────────────────────────────────

  describe('send', () => {
    it('creates a message between two users', () => {
      mockRepo.create.mockResolvedValue({ id: 'msg-1', fromUserId: 'u-1', toUserId: 'u-2', content: 'Olá' });

      service.send('u-1', 'u-2', 'Olá');

      expect(mockRepo.create).toHaveBeenCalledWith({ fromUserId: 'u-1', toUserId: 'u-2', content: 'Olá' });
    });
  });

  // ─── getHistory ───────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('returns conversation between two users with default limit', () => {
      mockRepo.findConversation.mockResolvedValue([{ id: 'msg-1' }]);

      service.getHistory('u-1', 'u-2');

      expect(mockRepo.findConversation).toHaveBeenCalledWith('u-1', 'u-2', undefined);
    });

    it('passes custom take limit to repository', () => {
      mockRepo.findConversation.mockResolvedValue([]);

      service.getHistory('u-1', 'u-2', 50);

      expect(mockRepo.findConversation).toHaveBeenCalledWith('u-1', 'u-2', 50);
    });
  });

  // ─── markRead ─────────────────────────────────────────────────────────────

  describe('markRead', () => {
    it('marks messages from a sender as read for the recipient', () => {
      mockRepo.markRead.mockResolvedValue({ count: 3 });

      service.markRead('u-2', 'u-1');

      expect(mockRepo.markRead).toHaveBeenCalledWith('u-2', 'u-1');
    });
  });

  // ─── countUnread ──────────────────────────────────────────────────────────

  describe('countUnread', () => {
    it('returns unread count for user', () => {
      mockRepo.countUnread.mockResolvedValue(5);

      service.countUnread('u-1');

      expect(mockRepo.countUnread).toHaveBeenCalledWith('u-1');
    });
  });

  // ─── getConversationPartners ──────────────────────────────────────────────

  describe('getConversationPartners', () => {
    it('returns list of users the given user has exchanged messages with', () => {
      mockRepo.findConversationPartners.mockResolvedValue([{ id: 'u-2', name: 'João' }]);

      service.getConversationPartners('u-1');

      expect(mockRepo.findConversationPartners).toHaveBeenCalledWith('u-1');
    });
  });
});
