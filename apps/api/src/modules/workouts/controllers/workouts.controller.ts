import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { JwtGuard } from "../../../common/guards/jwt.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { WorkoutsService } from "../services/workouts.service";
import {
  CreateWorkoutDto,
  CreateWorkoutLogDto,
  UpdateWorkoutDto,
} from "../types/workouts.dto";

@UseGuards(JwtGuard)
@Controller("workouts")
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  // ─── ADMIN ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateWorkoutDto) {
    return this.workoutsService.create(dto);
  }

  @Get("program/:programId")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  findByProgram(@Param("programId") programId: string) {
    return this.workoutsService.findByProgram(programId);
  }

  @Get("client/:clientId")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  findByClient(@Param("clientId") clientId: string) {
    return this.workoutsService.findByClient(clientId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() dto: UpdateWorkoutDto) {
    return this.workoutsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.workoutsService.remove(id);
  }

  @Post("duration-preview")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  durationPreview(@Body("blocks") blocks: any[]) {
    return this.workoutsService.calcDurationPreview(blocks ?? []);
  }

  // ─── CLIENT: ver os seus workouts activos ─────────────────────────────

  @Get("my")
  getMyWorkouts(@CurrentUser("sub") userId: string) {
    return this.workoutsService.findActiveByUser(userId);
  }

  // ─── Ambos: detalhe + logs ────────────────────────────────────────────

  @Get(":id")
  findById(
    @Param("id") id: string,
    @CurrentUser("sub") userId: string,
    @CurrentUser("role") role: string,
  ) {
    return this.workoutsService.findById(id, userId, role);
  }

  @Get(":id/logs")
  getLogs(@Param("id") id: string) {
    return this.workoutsService.getLogsByWorkout(id);
  }

  @Post("logs")
  @HttpCode(HttpStatus.CREATED)
  createLog(
    @Body() dto: CreateWorkoutLogDto,
    @CurrentUser("sub") userId: string,
  ) {
    return this.workoutsService.createLog(dto, userId);
  }

  @Get("logs/my")
  getMyLogs(@CurrentUser("sub") userId: string) {
    return this.workoutsService.getLogsByClient(userId);
  }
}
