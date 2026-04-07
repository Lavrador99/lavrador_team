import { Module } from '@nestjs/common';
import { SessionsService } from './services/sessions.service';
import { SessionsController } from './controllers/sessions.controller';
import { SessionsRepository } from './repositories/sessions.repository';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EmailModule, PrismaModule],
  providers: [SessionsService, SessionsRepository],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}
