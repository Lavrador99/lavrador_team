import { Module } from '@nestjs/common';
import { WorkoutsService } from './services/workouts.service';
import { WorkoutsController } from './controllers/workouts.controller';
import { WorkoutsRepository } from './repositories/workouts.repository';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EmailModule, PrismaModule],
  providers: [WorkoutsService, WorkoutsRepository],
  controllers: [WorkoutsController],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
