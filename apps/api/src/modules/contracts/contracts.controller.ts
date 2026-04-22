import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContractsService, CreateContractDto, SignContractDto } from './contracts.service';

@UseGuards(JwtGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly svc: ContractsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateContractDto) {
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

  @Post(':id/sign')
  sign(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: SignContractDto,
  ) {
    return this.svc.sign(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
