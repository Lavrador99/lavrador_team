import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../../../common/guards/jwt.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { StatsService } from "../services/stats.service";

@UseGuards(JwtGuard, RolesGuard)
@Controller("stats")
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get("dashboard")
  getDashboard() {
    return this.statsService.getDashboardStats();
  }

  @Get("client/:id")
  getClient(@Param("id") id: string) {
    return this.statsService.getClientStats(id);
  }

  @Get("sessions")
  getSessions() {
    return this.statsService.getSessionsDistribution();
  }

  @Get("clients/activity")
  getActivity() {
    return this.statsService.getClientsActivity();
  }
}
