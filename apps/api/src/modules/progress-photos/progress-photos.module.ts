import { Module } from '@nestjs/common';
import { ProgressPhotosController } from './progress-photos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressPhotosController],
})
export class ProgressPhotosModule {}
