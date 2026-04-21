import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const redisStore = require('cache-manager-ioredis');
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
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BodyMeasurementsModule } from './modules/body-measurements/body-measurements.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { ReadinessModule } from './modules/readiness/readiness.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { PainReportsModule } from './modules/pain-reports/pain-reports.module';
import { FormChecksModule } from './modules/form-checks/form-checks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'auth',    ttl: 60_000, limit: 5  },  // auth endpoints: 5 req/min
      { name: 'default', ttl: 60_000, limit: 60 },  // default: 60 req/min
      { name: 'heavy',   ttl: 60_000, limit: 20 },  // suggestion/stats: 20 req/min
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        ttl: 3600, // 1h default
      }),
    }),
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
    NotificationsModule,
    BodyMeasurementsModule,
    OnboardingModule,
    AchievementsModule,
    ReadinessModule,
    AutomationsModule,
    PainReportsModule,
    FormChecksModule,
  ],
})
export class AppModule {}
