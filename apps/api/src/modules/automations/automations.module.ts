import { Module } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, MessagesModule, NotificationsModule],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
