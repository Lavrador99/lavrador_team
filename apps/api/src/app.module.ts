import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { EmailModule } from './modules/email/email.module';
import { MessagesModule } from './modules/messages/messages.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { HabitsModule } from './modules/habits/habits.module';
import { WorkoutTemplatesModule } from './modules/workout-templates/workout-templates.module';
import { ProgressPhotosModule } from './modules/progress-photos/progress-photos.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    EmailModule,
    MessagesModule,
    InvoicesModule,
    HabitsModule,
    WorkoutTemplatesModule,
    ProgressPhotosModule,
    NutritionModule,
  ],
})
export class AppModule {}
