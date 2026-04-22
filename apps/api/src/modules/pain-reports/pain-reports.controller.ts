import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePainReportDto, PainReportsService } from './pain-reports.service';

@UseGuards(JwtGuard)
@Controller('pain-reports')
export class PainReportsController {
  constructor(private readonly svc: PainReportsService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreatePainReportDto) {
    return this.svc.create(userId, dto);
  }

  @Get('my')
  findMy(@CurrentUser('sub') userId: string) {
    return this.svc.findMy(userId);
  }

  @Get('client/:clientId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findForClient(@Param('clientId') clientId: string) {
    return this.svc.findForClient(clientId);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  resolve(@Param('id') id: string) {
    return this.svc.resolve(id);
  }
}
