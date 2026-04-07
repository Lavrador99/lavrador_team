import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ExercisesService } from '../services/exercises.service';
import { CreateExerciseDto, UpdateExerciseDto, ExerciseFiltersDto } from '../types/exercises.dto';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@UseGuards(JwtGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // Todos os utilizadores autenticados podem ver
  @Get()
  findAll(@Query() filters: ExerciseFiltersDto) {
    return this.exercisesService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exercisesService.findById(id);
  }

  // Só ADMIN pode gerir
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateExerciseDto) {
    return this.exercisesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exercisesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.exercisesService.remove(id);
  }
}
