import { Controller, Post, Get, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AssessmentsService } from '../services/assessments.service';
import { CreateAssessmentDto } from '../types/assessments.dto';
import { JwtGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── CLIENT: ver as suas avaliações ───────────────────────────────────

  @Get('my')
  async getMyAssessments(@CurrentUser('sub') userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) return [];
    return this.assessmentsService.findByClient(client.id);
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(dto);
  }

  @Get('client/:clientId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findByClient(@Param('clientId') clientId: string) {
    return this.assessmentsService.findByClient(clientId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findById(@Param('id') id: string) {
    return this.assessmentsService.findById(id);
  }
}
