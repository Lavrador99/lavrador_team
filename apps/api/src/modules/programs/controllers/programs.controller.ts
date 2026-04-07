import {
  Controller, Post, Get, Patch, Param,
  Body, UseGuards, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ProgramsService } from '../services/programs.service';
import { GenerateProgramDto, UpdateSelectionsDto } from '../types/programs.dto';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(@Body() dto: GenerateProgramDto) {
    return this.programsService.generate(dto);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.programsService.findByClient(clientId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.programsService.findById(id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.programsService.archive(id);
  }

  @Patch(':id/exercises')
  updateSelections(@Param('id') id: string, @Body() dto: UpdateSelectionsDto) {
    return this.programsService.updateSelections(id, dto);
  }

  @Get(':id/export')
  async exportJson(@Param('id') id: string, @Res() res: Response) {
    const data = await this.programsService.exportJson(id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="program-${id}.json"`);
    return res.json(data);
  }
}
