import { Module } from '@nestjs/common';
import { WorkoutsService } from './services/workouts.service';
import { WorkoutsController } from './controllers/workouts.controller';
import { WorkoutsRepository } from './repositories/workouts.repository';
import { ProgressionScheduler } from './progression.scheduler';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [EmailModule, PrismaModule, NotificationsModule, AchievementsModule],
  providers: [WorkoutsService, WorkoutsRepository, ProgressionScheduler],
  controllers: [WorkoutsController],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
