import { Module } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { HabitsRepository } from './habits.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HabitsService, HabitsRepository],
  controllers: [HabitsController],
  exports: [HabitsService],
})
export class HabitsModule {}
