import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SuggestionService } from '../services/suggestion.service';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('suggestions')
export class SuggestionController {
  constructor(private readonly suggestionService: SuggestionService) {}

  // Gerar sugestão para um cliente
  @Post()
  @HttpCode(HttpStatus.OK)
  suggest(@Body() body: {
    clientId:  string;
    level:     string;
    objective: string;
    flags:     string[];
    equipment: string[];
    pattern?:  string;
  }) {
    return this.suggestionService.suggest({
      clientId:  body.clientId,
      level:     body.level   as any,
      objective: body.objective,
      flags:     body.flags ?? [],
      equipment: body.equipment ?? [],
      pattern:   body.pattern  as any,
    });
  }

  // PT registou que gosta de um exercício
  @Post('feedback/choose')
  recordChoose(@Body() body: {
    exerciseId: string;
    level:      string;
    pattern:    string;
    objective:  string;
    chosen:     boolean;
  }) {
    return this.suggestionService.recordChoice({
      exerciseId: body.exerciseId,
      level:      body.level    as any,
      pattern:    body.pattern  as any,
      objective:  body.objective,
      chosen:     body.chosen,
    });
  }

  // PT substituiu explicitamente X por Y
  @Post('feedback/substitute')
  recordSubstitution(@Body() body: {
    fromExId:  string;
    toExId:    string;
    level:     string;
    pattern:   string;
    objective: string;
    reason?:   string;
  }) {
    return this.suggestionService.recordSubstitution({
      fromExId:  body.fromExId,
      toExId:    body.toExId,
      level:     body.level    as any,
      pattern:   body.pattern  as any,
      objective: body.objective,
      reason:    body.reason,
    });
  }

  // Dashboard de aprendizagem — o que o sistema já sabe
  @Get('learning-status')
  getLearningStatus() {
    return this.suggestionService.getLearningStatus();
  }

  // Validar uma prescrição manual contra os guidelines ACSM
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() body: {
    sets:       number;
    reps:       number;
    percentRM:  number;
    objective:  string;
  }) {
    return this.suggestionService.validateManual(
      body.sets, body.reps, body.percentRM, body.objective,
    );
  }
}
