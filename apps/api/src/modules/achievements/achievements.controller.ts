import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AchievementsService } from './achievements.service';

@UseGuards(JwtGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly svc: AchievementsService) {}

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
}
