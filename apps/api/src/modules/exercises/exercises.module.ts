import { Module } from '@nestjs/common';
import { ExercisesService } from './services/exercises.service';
import { ExercisesController } from './controllers/exercises.controller';
import { ExercisesRepository } from './repositories/exercises.repository';

@Module({
  providers: [ExercisesService, ExercisesRepository],
  controllers: [ExercisesController],
  exports: [ExercisesService], // necessário para a Fase 2 (motor de prescrição)
})
export class ExercisesModule {}
