import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PersonalRecordsRepository } from './personal-records.repository';
import { PersonalRecordsService } from './personal-records.service';
import { PersonalRecordsController } from './personal-records.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalRecordsController],
  providers: [PersonalRecordsRepository, PersonalRecordsService],
  exports: [PersonalRecordsService],
})
export class PersonalRecordsModule {}
