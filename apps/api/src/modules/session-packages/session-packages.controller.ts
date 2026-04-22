import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSessionPackageDto, SessionPackagesService } from './session-packages.service';

@UseGuards(JwtGuard)
@Controller('session-packages')
export class SessionPackagesController {
  constructor(private readonly svc: SessionPackagesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateSessionPackageDto) {
    return this.svc.create(dto);
  }

  @Get('client/:clientId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findForClient(@Param('clientId') clientId: string) {
    return this.svc.findForClient(clientId);
  }

  @Get('my')
  findMy(@CurrentUser('sub') userId: string) {
    return this.svc.findMy(userId);
  }

  @Patch(':id/use')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  useSession(@Param('id') id: string) {
    return this.svc.useSession(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
