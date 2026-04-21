import { Module } from '@nestjs/common';
import { BodyMeasurementsController } from './body-measurements.controller';
import { BodyMeasurementsService } from './body-measurements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BodyMeasurementsService],
  controllers: [BodyMeasurementsController],
  exports: [BodyMeasurementsService],
})
export class BodyMeasurementsModule {}
