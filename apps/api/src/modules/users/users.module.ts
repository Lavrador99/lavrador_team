import { Module } from "@nestjs/common";
import { UsersController } from "./controllers/users.controller";
import { ClientsRepository } from "./repositories/clients.repository";
import { UsersRepository } from "./repositories/users.repository";
import { UsersService } from "./services/users.service";

@Module({
  providers: [UsersService, UsersRepository, ClientsRepository],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
