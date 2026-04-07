import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { InactivityScheduler } from './inactivity.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmailService, InactivityScheduler],
  exports: [EmailService],
})
export class EmailModule {}
