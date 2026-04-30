import { Module } from '@nestjs/common';
import { PainReportsService } from './pain-reports.service';
import { PainReportsController } from './pain-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, NotificationsModule, MessagesModule],
  providers: [PainReportsService],
  controllers: [PainReportsController],
  exports: [PainReportsService],
})
export class PainReportsModule {}
