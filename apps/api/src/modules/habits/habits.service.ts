import { Injectable } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';

@Injectable()
export class HabitsService {
  constructor(private readonly repo: HabitsRepository) {}

  create(data: { clientId: string; name: string; icon?: string; frequency?: string }) {
    return this.repo.createHabit(data);
  }

  findByClient(clientId: string) {
    return this.repo.findByClient(clientId);
  }

  update(id: string, data: { name?: string; icon?: string; isActive?: boolean }) {
    return this.repo.updateHabit(id, data);
  }

  delete(id: string) {
    return this.repo.deleteHabit(id);
  }

  log(habitId: string, date: string, completed?: boolean) {
    return this.repo.logHabit(habitId, new Date(date), completed ?? true);
  }

  getWeeklyAdherence(clientId: string) {
    return this.repo.getWeeklyAdherence(clientId);
  }
}
