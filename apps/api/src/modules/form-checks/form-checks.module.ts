import { Module } from '@nestjs/common';
import { FormChecksService } from './form-checks.service';
import { FormChecksController } from './form-checks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, NotificationsModule, MessagesModule],
  providers: [FormChecksService],
  controllers: [FormChecksController],
  exports: [FormChecksService],
})
export class FormChecksModule {}
