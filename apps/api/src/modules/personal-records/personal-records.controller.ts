import {
  Controller, Get, Post, Delete,
  Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PersonalRecordsService } from './personal-records.service';

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
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
export class PersonalRecordsController {
  constructor(private readonly service: PersonalRecordsService) {}

  @Post()
  create(@Body() dto: CreateRecordDto) {
    return this.service.create(dto);
  }

  @Get('client/:clientId')
  getByClient(@Param('clientId') clientId: string) {
    return this.service.getByClient(clientId);
  }

  @Get('client/:clientId/best')
  getBest(@Param('clientId') clientId: string) {
    return this.service.getBestByClient(clientId);
  }

  @Get('client/:clientId/history')
  getHistory(
    @Param('clientId') clientId: string,
    @Query('exercise') exerciseName: string,
  ) {
    return this.service.getHistory(clientId, exerciseName);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
