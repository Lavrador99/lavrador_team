import { api } from './axios';

export interface MessageDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  read: boolean;
  createdAt: string;
  fromUser?: { id: string; email: string; role: string };
}

export interface ConversationPartner {
  id: string;
  email: string;
  role: string;
  client?: { name: string } | null;
}

export const messagesApi = {
  getHistory: async (withUserId: string, take = 50): Promise<MessageDto[]> => {
    const { data } = await api.get(`/messages/history/${withUserId}?take=${take}`);
    return data;
  },

  getPartners: async (): Promise<ConversationPartner[]> => {
    const { data } = await api.get('/messages/partners');
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const data = await api.get('/messages/unread');
    return data.data;
  },
};
