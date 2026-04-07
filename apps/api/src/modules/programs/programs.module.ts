import { Module } from '@nestjs/common';
import { ProgramsService } from './services/programs.service';
import { ProgramsController } from './controllers/programs.controller';
import { ProgramsRepository } from './repositories/programs.repository';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ExercisesModule } from '../exercises/exercises.module';

@Module({
  imports: [AssessmentsModule, ExercisesModule],
  providers: [ProgramsService, ProgramsRepository],
  controllers: [ProgramsController],
  exports: [ProgramsService],
})
export class ProgramsModule {}
