import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateReadinessDto, ReadinessService } from './readiness.service';

@UseGuards(JwtGuard)
@Controller('readiness')
export class ReadinessController {
  constructor(private readonly svc: ReadinessService) {}

  @Post()
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateReadinessDto,
  ) {
    return this.svc.create(userId, dto);
  }

  @Get('my')
  findMy(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findMy(userId, limit ? Number(limit) : 30);
  }

  @Get('my/today')
  todayScore(@CurrentUser('sub') userId: string) {
    return this.svc.todayScore(userId);
  }

  @Get('client/:clientId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findForClient(
    @Param('clientId') clientId: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findForClient(clientId, limit ? Number(limit) : 10);
  }
}
