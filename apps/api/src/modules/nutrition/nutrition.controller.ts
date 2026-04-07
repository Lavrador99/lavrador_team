import {
  Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { NutritionService } from './nutrition.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  // ── Foods ──────────────────────────────────────────────────────────────────

  @Get('foods')
  searchFoods(@Query('q') q: string) {
    return this.nutrition.searchFoods(q ?? '');
  }

  @Roles('ADMIN')
  @Post('foods')
  createFood(@Body() body: { name: string; kcal: number; protein: number; carbs: number; fat: number; fiber?: number }) {
    return this.nutrition.createFood(body);
  }

  // ── Plans (ADMIN) ──────────────────────────────────────────────────────────

  @Roles('ADMIN')
  @Get('plans/client/:clientId')
  getPlansByClient(@Param('clientId') clientId: string) {
    return this.nutrition.findPlansByClient(clientId);
  }

  @Roles('ADMIN')
  @Post('plans')
  createPlan(@Body() body: { clientId: string; name: string; startDate: string; endDate?: string; notes?: string }) {
    return this.nutrition.createPlan(body);
  }

  @Roles('ADMIN')
  @Get('plans/:id')
  getPlan(@Param('id') id: string) {
    return this.nutrition.findPlanById(id);
  }

  @Roles('ADMIN')
  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.nutrition.deletePlan(id);
  }

  @Roles('ADMIN')
  @Post('plans/:planId/days/:dayOfWeek')
  upsertDay(
    @Param('planId') planId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() body: { label?: string },
  ) {
    return this.nutrition.upsertDay(planId, Number(dayOfWeek), body.label);
  }

  @Roles('ADMIN')
  @Post('days/:dayId/meals')
  addMeal(@Param('dayId') dayId: string, @Body() body: { name: string; items: any[] }) {
    return this.nutrition.addMeal(dayId, body.name, body.items);
  }

  @Roles('ADMIN')
  @Put('meals/:mealId')
  updateMeal(@Param('mealId') mealId: string, @Body() body: { name: string; items: any[] }) {
    return this.nutrition.updateMeal(mealId, body.name, body.items);
  }

  @Roles('ADMIN')
  @Delete('meals/:mealId')
  deleteMeal(@Param('mealId') mealId: string) {
    return this.nutrition.deleteMeal(mealId);
  }

  // ── Client's own plan ──────────────────────────────────────────────────────

  @Get('my-plan')
  getMyPlan(@Req() req: any) {
    return this.nutrition.getMyPlan(req.user.sub);
  }
}
