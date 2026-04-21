import { Module } from '@nestjs/common';
import { ProgramsService } from './services/programs.service';
import { ProgramsController } from './controllers/programs.controller';
import { ProgramsRepository } from './repositories/programs.repository';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AssessmentsModule, ExercisesModule, PrismaModule],
  providers: [ProgramsService, ProgramsRepository],
  controllers: [ProgramsController],
  exports: [ProgramsService],
})
export class ProgramsModule {}
