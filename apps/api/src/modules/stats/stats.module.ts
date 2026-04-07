import { Module } from '@nestjs/common';
import { StatsService } from './services/stats.service';
import { StatsController } from './controllers/stats.controller';

@Module({
  providers: [StatsService],
  controllers: [StatsController],
  exports: [StatsService],
})
export class StatsModule {}
