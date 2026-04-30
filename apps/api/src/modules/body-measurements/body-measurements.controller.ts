import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BodyMeasurementsService, CreateBodyMeasurementDto } from './body-measurements.service';

@UseGuards(JwtGuard)
@Controller('body-measurements')
export class BodyMeasurementsController {
  constructor(private readonly svc: BodyMeasurementsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBodyMeasurementDto) {
    return this.svc.create(dto);
  }

  @Get('client/:clientId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findByClient(@Param('clientId') clientId: string) {
    return this.svc.findByClient(clientId);
  }

  @Post('my')
  @HttpCode(HttpStatus.CREATED)
  createMy(@CurrentUser('sub') userId: string, @Body() dto: Omit<CreateBodyMeasurementDto, 'clientId'>) {
    return this.svc.createForUser(userId, dto);
  }

  @Get('my')
  findMy(@CurrentUser('sub') userId: string) {
    return this.svc.findByUser(userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
