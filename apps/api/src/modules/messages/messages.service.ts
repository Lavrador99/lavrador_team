import { Injectable } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly repo: MessagesRepository) {}

  send(fromUserId: string, toUserId: string, content: string) {
    return this.repo.create({ fromUserId, toUserId, content });
  }

  getHistory(userA: string, userB: string, take?: number) {
    return this.repo.findConversation(userA, userB, take);
  }

  markRead(toUserId: string, fromUserId: string) {
    return this.repo.markRead(toUserId, fromUserId);
  }

  countUnread(toUserId: string) {
    return this.repo.countUnread(toUserId);
  }

  getConversationPartners(userId: string) {
    return this.repo.findConversationPartners(userId);
  }
}
