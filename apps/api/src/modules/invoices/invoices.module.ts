import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesRepository } from './invoices.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InvoicesService, InvoicesRepository],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
