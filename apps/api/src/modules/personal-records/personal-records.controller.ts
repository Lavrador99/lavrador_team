import {
  Controller, Get, Post, Delete,
  Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PersonalRecordsService } from './personal-records.service';
import { PrismaService } from '../prisma/prisma.service';

class CreateRecordDto {
  clientId: string;
  exerciseId?: string;
  exerciseName: string;
  type: any;
  value: number;
  notes?: string;
  recordedAt?: string;
}

@Controller('personal-records')
@UseGuards(JwtGuard)
export class PersonalRecordsController {
  constructor(
    private readonly service: PersonalRecordsService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── CLIENT: os seus próprios records ─────────────────────────────────

  @Get('my/best')
  async getMyBest(@CurrentUser('sub') userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) return [];
    return this.service.getBestByClient(client.id);
  }

  @Get('my/history')
  async getMyHistory(
    @CurrentUser('sub') userId: string,
    @Query('exercise') exerciseName: string,
  ) {
    const client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) return [];
    return this.service.getHistory(client.id, exerciseName);
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateRecordDto) {
    return this.service.create(dto);
  }

  @Get('client/:clientId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getByClient(@Param('clientId') clientId: string) {
    return this.service.getByClient(clientId);
  }

  @Get('client/:clientId/best')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getBest(@Param('clientId') clientId: string) {
    return this.service.getBestByClient(clientId);
  }

  @Get('client/:clientId/history')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getHistory(
    @Param('clientId') clientId: string,
    @Query('exercise') exerciseName: string,
  ) {
    return this.service.getHistory(clientId, exerciseName);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
