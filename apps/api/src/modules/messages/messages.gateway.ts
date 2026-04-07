import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';

interface SocketUser {
  userId: string;
  role: string;
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:4501', credentials: true },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly users = new Map<string, string>(); // userId → socketId

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }

      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      }) as { sub: string; role: string };

      (client as any)._user = { userId: payload.sub, role: payload.role };
      this.users.set(payload.sub, client.id);

      // Join a personal room (userId) so we can push to specific user
      client.join(payload.sub);

      // Send unread count on connect
      const unread = await this.messagesService.countUnread(payload.sub);
      client.emit('unread_count', { count: unread });

      this.logger.log(`Connected: ${payload.sub} (${payload.role})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user: SocketUser | undefined = (client as any)._user;
    if (user) {
      this.users.delete(user.userId);
      this.logger.log(`Disconnected: ${user.userId}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; content: string },
  ) {
    const user: SocketUser | undefined = (client as any)._user;
    if (!user || !data.toUserId || !data.content?.trim()) return;

    const message = await this.messagesService.send(
      user.userId,
      data.toUserId,
      data.content.trim(),
    );

    // Emit to sender (confirmation) and recipient
    client.emit('new_message', message);
    this.server.to(data.toUserId).emit('new_message', message);

    return message;
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { fromUserId: string },
  ) {
    const user: SocketUser | undefined = (client as any)._user;
    if (!user || !data.fromUserId) return;
    await this.messagesService.markRead(user.userId, data.fromUserId);
    client.emit('unread_count', { count: await this.messagesService.countUnread(user.userId) });
  }
}
