import { Module } from '@nestjs/common';
import { FormChecksService } from './form-checks.service';
import { FormChecksController } from './form-checks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [FormChecksService],
  controllers: [FormChecksController],
  exports: [FormChecksService],
})
export class FormChecksModule {}
