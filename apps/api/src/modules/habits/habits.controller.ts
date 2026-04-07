import {
  Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { HabitsService } from './habits.service';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('habits')
export class HabitsController {
  constructor(
    private readonly habitsService: HabitsService,
    private readonly prisma: PrismaService,
  ) {}

  /** CLIENT: get own habits */
  @Get('my')
  async getMy(@Req() req: any) {
    const client = await this.prisma.client.findUnique({ where: { userId: req.user.sub } });
    if (!client) return [];
    return this.habitsService.findByClient(client.id);
  }

  /** CLIENT: get own weekly adherence */
  @Get('my/adherence')
  async getMyAdherence(@Req() req: any) {
    const client = await this.prisma.client.findUnique({ where: { userId: req.user.sub } });
    if (!client) return { adherencePct: 0, totalHabits: 0, completedThisWeek: 0 };
    return this.habitsService.getWeeklyAdherence(client.id);
  }

  /** CLIENT: log a habit check-in */
  @Post(':habitId/log')
  logHabit(
    @Param('habitId') habitId: string,
    @Body() body: { date: string; completed?: boolean },
  ) {
    return this.habitsService.log(habitId, body.date, body.completed);
  }

  /** ADMIN: create habit for a client */
  @Roles('ADMIN')
  @Post('client/:clientId')
  create(
    @Param('clientId') clientId: string,
    @Body() body: { name: string; icon?: string; frequency?: string },
  ) {
    return this.habitsService.create({ clientId, ...body });
  }

  /** ADMIN: get habits for a client */
  @Roles('ADMIN')
  @Get('client/:clientId')
  getByClient(@Param('clientId') clientId: string) {
    return this.habitsService.findByClient(clientId);
  }

  /** ADMIN: get weekly adherence for a client */
  @Roles('ADMIN')
  @Get('client/:clientId/adherence')
  getAdherence(@Param('clientId') clientId: string) {
    return this.habitsService.getWeeklyAdherence(clientId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; icon?: string; isActive?: boolean }) {
    return this.habitsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.habitsService.delete(id);
  }
}
