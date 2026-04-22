import { Module } from '@nestjs/common';
import { SessionPackagesService } from './session-packages.service';
import { SessionPackagesController } from './session-packages.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SessionPackagesService],
  controllers: [SessionPackagesController],
  exports: [SessionPackagesService],
})
export class SessionPackagesModule {}
