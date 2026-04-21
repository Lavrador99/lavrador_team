import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateFormCheckDto, FormChecksService, ReviewFormCheckDto } from './form-checks.service';

@UseGuards(JwtGuard)
@Controller('form-checks')
export class FormChecksController {
  constructor(private readonly svc: FormChecksService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateFormCheckDto) {
    return this.svc.create(userId, dto);
  }

  @Get('my')
  findMy(@CurrentUser('sub') userId: string) {
    return this.svc.findMy(userId);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findPending() {
    return this.svc.findPending();
  }

  @Get('client/:clientId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findForClient(@Param('clientId') clientId: string) {
    return this.svc.findForClient(clientId);
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewFormCheckDto,
    @CurrentUser('sub') ptUserId: string,
  ) {
    return this.svc.review(id, dto, ptUserId);
  }
}
