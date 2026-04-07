import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { SessionsService } from '../services/sessions.service';
import { CreateSessionDto, UpdateSessionDto, SessionFiltersDto } from '../types/sessions.dto';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Get()
  findAll(@Query() filters: SessionFiltersDto) {
    return this.sessionsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }

  @Get('client/:clientId/upcoming')
  getUpcoming(@Param('clientId') clientId: string) {
    return this.sessionsService.getUpcomingForClient(clientId);
  }

  @Get('client/:clientId/stats')
  getStats(@Param('clientId') clientId: string) {
    return this.sessionsService.getStatsForClient(clientId);
  }
}
