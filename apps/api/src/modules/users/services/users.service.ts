import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "../repositories/users.repository";
import { ClientsRepository } from "../repositories/clients.repository";
import { UpdateProfileDto } from "../types/users.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly clientsRepository: ClientsRepository,
  ) {}

  async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException("Utilizador não encontrado");
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async getAllClients() {
    const users = await this.usersRepository.findAllClients();
    return users.map(({ passwordHash, ...u }) => u);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException("Utilizador não encontrado");

    return this.usersRepository.updateClient(userId, {
      name: dto.name,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      phone: dto.phone,
      notes: dto.notes,
    });
  }

  async getClientDetail(clientId: string) {
    return this.clientsRepository.findDetailById(clientId);
  }
}
