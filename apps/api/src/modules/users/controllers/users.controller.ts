import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { JwtGuard } from "../../../common/guards/jwt.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { UsersService } from "../services/users.service";
import { UpdateProfileDto } from "../types/users.dto";

@UseGuards(JwtGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser("sub") userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch("me")
  updateProfile(
    @CurrentUser("sub") userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get()
  @Roles("ADMIN")
  getAllClients() {
    return this.usersService.getAllClients();
  }

  @Get("clients/:clientId/detail")
  @Roles("ADMIN")
  async getClientDetail(@Param("clientId") clientId: string) {
    const client = await this.usersService.getClientDetail(clientId);
    if (!client) throw new NotFoundException("Cliente não encontrado");
    return client;
  }
}
