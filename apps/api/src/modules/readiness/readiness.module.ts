import { Module } from '@nestjs/common';
import { ReadinessService } from './readiness.service';
import { ReadinessController } from './readiness.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReadinessService],
  controllers: [ReadinessController],
  exports: [ReadinessService],
})
export class ReadinessModule {}
