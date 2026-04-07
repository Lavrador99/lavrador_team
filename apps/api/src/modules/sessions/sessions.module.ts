import { Module } from '@nestjs/common';
import { SessionsService } from './services/sessions.service';
import { SessionsController } from './controllers/sessions.controller';
import { SessionsRepository } from './repositories/sessions.repository';

@Module({
  providers: [SessionsService, SessionsRepository],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}
