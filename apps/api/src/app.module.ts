import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StatsModule } from './modules/stats/stats.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { SuggestionModule } from './modules/suggestion/suggestion.module';
import { PersonalRecordsModule } from './modules/personal-records/personal-records.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    AssessmentsModule,
    ProgramsModule,
    SessionsModule,
    StatsModule,
    WorkoutsModule,
    SuggestionModule,
    PersonalRecordsModule,
  ],
})
export class AppModule {}
