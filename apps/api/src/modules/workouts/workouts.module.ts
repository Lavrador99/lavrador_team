import { Module } from '@nestjs/common';
import { WorkoutsService } from './services/workouts.service';
import { WorkoutsController } from './controllers/workouts.controller';
import { WorkoutsRepository } from './repositories/workouts.repository';

@Module({
  providers: [WorkoutsService, WorkoutsRepository],
  controllers: [WorkoutsController],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
