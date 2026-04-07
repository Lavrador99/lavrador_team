import { Module } from '@nestjs/common';
import { WorkoutTemplatesService } from './workout-templates.service';
import { WorkoutTemplatesController } from './workout-templates.controller';
import { WorkoutTemplatesRepository } from './workout-templates.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WorkoutTemplatesService, WorkoutTemplatesRepository],
  controllers: [WorkoutTemplatesController],
  exports: [WorkoutTemplatesService],
})
export class WorkoutTemplatesModule {}
