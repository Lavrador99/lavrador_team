import { Module } from '@nestjs/common';
import { AssessmentsService } from './services/assessments.service';
import { AssessmentsController } from './controllers/assessments.controller';
import { AssessmentsRepository } from './repositories/assessments.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AssessmentsService, AssessmentsRepository],
  controllers: [AssessmentsController],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
